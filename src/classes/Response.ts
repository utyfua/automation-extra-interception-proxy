import EventEmitter from 'events';
import {
    AUTHOR_NEW_ISSUE_URL, NPM_PACKAGE_NAME,
    IConfigurableMixin, ILoggableMixin, INetworkMixin,
    RequestStage,
    IInterceptionProxyRequest, IInterceptionProxyResponse,
    IResponseOverrides, IAbortOverrides, IResponseOptions, IAbortReason
} from '../interfaces'
import { applyConfigurableMixin, applyLoggableMixin, applyNetworkMixin } from '../mixins'
import { setCookieByHeaders } from '../utils/cookies'
import { getStageEnhancedErrorMessage } from '../utils/errors';

@applyNetworkMixin
@applyLoggableMixin
@applyConfigurableMixin
class ResponseBase extends EventEmitter { }

interface ResponseBase extends
    IConfigurableMixin, ILoggableMixin, INetworkMixin,
    Partial<IResponseOverrides>, Partial<IAbortOverrides> { }
for (let key of ['status', 'headers', 'contentType', 'body', 'abortReason']) {
    Object.defineProperty(ResponseBase.prototype, key, {
        get: function () {
            return this.responseOptions[key];
        },
        set: function (value) {
            return this.__responseOptionSetter(key, value);
        },
        enumerable: true,
        configurable: true
    });
}


class InterceptionProxyResponse extends ResponseBase implements IInterceptionProxyResponse {
    // @ts-ignore
    emit2(eventName, payload) {
        this.emit(eventName, payload);
        this.__parent.emit(eventName, payload);
    }

    protected __parent: IInterceptionProxyRequest;
    responseOptions: IResponseOptions;
    constructor(__parent: IInterceptionProxyRequest, responseOptions: IResponseOptions) {
        super();
        this.__parent = __parent;
        this.responseOptions = responseOptions;

        this.emit2('responseOptions', this.responseOptions);
    }

    static async __getResponse(request: IInterceptionProxyRequest): Promise<IResponseOptions> {
        for (let handlerObj of request.requestHandlers) {
            try {
                const responseOptions = await handlerObj.handler(request);
                if (responseOptions) return responseOptions;
            } catch (error) {
                request.recordError(
                    `Interception handler "${String(handlerObj.key)}" throws an error. ` +
                    `For now we will ignore an error`, error);
            }
        };
        throw new Error(
            `No requestHandlers left. ` +
            `Looks like ${NPM_PACKAGE_NAME} doest not support urls like that` +
            `Please provide more information ${AUTHOR_NEW_ISSUE_URL}`
        )
    }

    static async proceedNewResponse(
        request: IInterceptionProxyRequest,
        responseOptions?: IResponseOptions
    ): Promise<IInterceptionProxyResponse> {
        try {
            responseOptions ??= await this.__getResponse(request);
        } catch (error) {
            responseOptions = { abortReason: 'connectionfailed' };
            request.recordError(
                `Unable to proceed url`,
                error, request.url);
        }

        return new InterceptionProxyResponse(request, responseOptions);
    }

    getRequest() { return this.__parent }
    get page() { return this.__parent.page; }
    get originalRequest() { return this.__parent.originalRequest; }
    get stage() { return this.__parent.stage; }
    set stage(value) { this.__parent.stage = value; }

    protected __responseOptionSetter<T extends keyof IResponseOverrides | 'abortReason'>(key: T, value: any) {
        if (!this.isResponseOverrideAvailable) {
            throw new Error(getStageEnhancedErrorMessage(key, this.stage))
        }
        if (key === 'abortReason') {
            this.responseOptions = { abortReason: value }
        } else {
            if ("abortReason" in this.responseOptions)
                delete this.responseOptions.abortReason;
            // const responseOptions = this.responseOptions as IResponseOverrides
            // @ts-ignore
            this.responseOptions[key] = value;
            // if (!responseOptions.status) responseOptions.status = 200;
            // if (!responseOptions.headers) responseOptions.headers = {};
            // if (!responseOptions.body) responseOptions.body = '';
        }
        this.emit2(key, value);
        this.emit2('responseOptions', this.responseOptions);
    }

    async setResponse(responseOptions: IResponseOptions): Promise<IInterceptionProxyResponse> {
        this.responseOptions = responseOptions;
        return this;
    }
    async getResponse(): Promise<IInterceptionProxyResponse> {
        return this;
    }
    async abort(abortReason?: IAbortReason): Promise<IInterceptionProxyResponse> {
        this.responseOptions = { abortReason };
        return this;
    }
    async continue(): Promise<void> {
        this.stage = RequestStage.sentResponse;
        try {
            const response = this.responseOptions;
            if ("body" in response) {
                const cookieHeader = response.headers["set-cookie"];
                if (cookieHeader) {
                    // TODO: (T3) find a way to set the contentType without ts-ignore
                    // @ts-ignore
                    await setCookieByHeaders(this.originalRequest, cookieHeader);
                    response.headers["set-cookie"] = undefined;
                }
                await this.originalRequest.respond(
                    response,
                    this.cooperativePriority
                );
            } else if ("continue" in response) {
                await this.originalRequest.continue(
                    undefined,
                    this.cooperativePriority
                );
            } else {
                await this.originalRequest.abort(
                    response.abortReason,
                    this.cooperativePriority
                );
            }
        } catch (error) {
            this.emit2('error', error);
            this.stage = RequestStage.closed;
        }
    }
}

export {
    InterceptionProxyResponse,
}
