import EventEmitter from 'events';
import {
    IConfigurableMixin, ILoggableMixin, INetworkMixin,
    IInterceptionProxyRequest, INewRequestInitialArgs, IRequestOptions,
    RequestStage, IAbortReason, IInterceptionProxyResponse, IResponseOptions,
    IResponseOverrides,
} from '../interfaces'
import { applyConfigurableMixin, applyLoggableMixin, applyNetworkMixin } from '../mixins'
import { InterceptionProxyResponse } from './Response';
import { getCookieJarByRequest } from '../utils/cookies'
import { adjustRequestCorsHeaders } from '../utils/cors'
import { getStageEnhancedErrorMessage } from '../utils/errors';

@applyConfigurableMixin
@applyLoggableMixin
@applyNetworkMixin
class RequestBase extends EventEmitter { }

interface RequestBase extends IConfigurableMixin, ILoggableMixin, INetworkMixin, IRequestOptions { }
for (let key of ['method', 'url', 'headers', 'body', 'cookieJar']) {
    Object.defineProperty(RequestBase.prototype, key, {
        get: function () {
            return this.requestOptions[key];
        },
        set: function (value) {
            return this.__requestSetter(key, value);
        },
        enumerable: true,
        configurable: true
    });
}

class InterceptionProxyRequest extends RequestBase implements IInterceptionProxyRequest {
    // @ts-ignore
    emit2(eventName, payload) {
        this.emit(eventName, payload);
        this.__response?.emit(eventName, payload);
    }

    readonly page;
    readonly originalRequest;
    readonly requestOptions;
    protected __stage: RequestStage;
    protected __parent;
    protected __response?: IInterceptionProxyResponse;

    constructor(initial: INewRequestInitialArgs, requestOptions: IRequestOptions) {
        super();
        this.page = initial.page;
        this.originalRequest = initial.originalRequest;
        this.requestOptions = requestOptions;
        this.__stage = RequestStage.gotRequest;
        this.__parent = initial.__parent;
    }

    static async proceedNewRequest(initial: INewRequestInitialArgs) {
        const { originalRequest, __parent } = initial;
        const requestOptions: IRequestOptions = {
            method: originalRequest.method() as IRequestOptions["method"],
            url: originalRequest.url(),
            headers: { ...originalRequest.headers() },
            body: originalRequest.postData(),
        };

        adjustRequestCorsHeaders(initial, requestOptions);

        try {
            requestOptions.cookieJar = await getCookieJarByRequest(originalRequest);
        } catch (error) {
            __parent.logger({
                level: 'warning',
                error: error,
                message:
                    `Getting cookie error but we will proceed without\n` +
                    (error instanceof Error ? error.message : '' + error),
                meta: [requestOptions.url],
            });
        };

        const request = new InterceptionProxyRequest(initial, requestOptions);


        for (let handlerObj of request.requestListeners) {
            try {
                const localRes = await handlerObj.handler(request);
                if (localRes) break;
            } catch (error) {
                request.recordError(`Your interception handler "${String(handlerObj.key)}" throws an error. ` +
                    `Please wrap your function using try-catch blocks. For now we will ignore an error`, error);
            }
        };
        try {
            await request.continue();
        } catch (error) {
            request.recordError('Unable to proceed response from interception handler. We will abort the request.', error);
            await originalRequest.abort('failed', request.cooperativePriority);
        }
    }

    get stage() { return this.__stage; };
    set stage(value) {
        this.__stage = value;
        this.emit2('stage', value);
    };

    protected __requestOptionSetter<T extends keyof IRequestOptions>(key: T, value: IRequestOptions[T]) {
        if (!this.isRequestOverrideAvailable) {
            throw new Error(getStageEnhancedErrorMessage(key, this.stage))
        }
        this.requestOptions[key] = value;
        this.emit2(key, value);
        this.emit2('requestOptions', this.requestOptions);
    }

    async _getResponseInstance(responseOptions?: IResponseOptions): Promise<IInterceptionProxyResponse> {
        if (this.__response || this.isResponseCollecting) {
            const response: IInterceptionProxyResponse =
                this.__response || await new Promise(c => this.once('responseInstance', c));

            if (responseOptions) {
                response.setResponse(responseOptions);
            }

            return response;
        }

        this.stage = RequestStage.sentRequest;
        const response = await InterceptionProxyResponse.proceedNewResponse(this, responseOptions);

        this.__response = response;
        this.stage = RequestStage.gotResponse;
        this.emit2('responseInstance', response);

        return response;
    };

    getRequest(): IInterceptionProxyRequest {
        return this;
    };
    async setResponse(response: IResponseOverrides) {
        return await this._getResponseInstance(response);
    }
    async getResponse() {
        return await this._getResponseInstance();
    }
    async abort(abortReason?: IAbortReason) {
        return await this._getResponseInstance({ abortReason: abortReason || 'aborted' });
    }

    async continue() {
        if (!this.__response && this.continueIfPossible) {
            this.originalRequest.continue(undefined, this.cooperativePriority);
            return;
        }
        const response = await this.getResponse();
        response.continue();
    }
}

export {
    InterceptionProxyRequest,
}
