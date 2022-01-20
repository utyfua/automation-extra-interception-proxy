import type Puppeteer from 'puppeteer'
import EventEmitter from 'events';
import {
    AUTHOR_NEW_ISSUE_URL, NPM_PACKAGE_NAME,
    IConfigurableMixin, ILoggableMixin, INetworkMixin,
    RequestStage,
    IInterceptionProxyRequest, IInterceptionProxyResponse,
    IResponseOverrides, IAbortOverrides, IResponseOptions, IAbortReason, RequestMode
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
for (let key of ['status', 'headers', /*'contentType',*/ 'body', 'abortReason']) {
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
    originalResponse?: Puppeteer.HTTPResponse = undefined;

    emit2(eventName: string, payload: any) {
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

        const response = new InterceptionProxyResponse(request, responseOptions)

        return response;
    }

    static async proceedOriginalResponse(
        request: IInterceptionProxyRequest,
        originalResponse: Puppeteer.HTTPResponse
    ): Promise<IInterceptionProxyResponse> {
        const responseOptions: IResponseOverrides = {
            status: originalResponse.status(),
            headers: originalResponse.headers(),
            body: `${NPM_PACKAGE_NAME}: Unable to get original response`,
        };

        try {
            responseOptions.body = await originalResponse.buffer()
        } catch (e) {
            // console.dir(e);
            // Could not load body for this request. This might happen if the request is a pre a preflight request.
        }

        const response = new InterceptionProxyResponse(request, responseOptions)
        response.originalResponse = originalResponse

        return response;
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
        // prevent processing for already handled requests
        if (!this.isResponseOverrideAvailable) {
            if (this.requestMode !== RequestMode.managed) return;
            // TODO: warn?
            return;
        }

        this.stage = RequestStage.sentResponse;
        const response = this.responseOptions;
        try {
            if ("body" in response) {
                const cookieHeader = response.headers["set-cookie"];
                if (cookieHeader) {
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
            this.stage = RequestStage.closed;

            // @ts-ignore
            const client = this.originalRequest._client;
            if (client && !client._connection) {
                // possibly page was closed, no need to scream
            } else {
                this.emit2('error', error);
            }
        }
    }
}

export {
    InterceptionProxyResponse,
}
