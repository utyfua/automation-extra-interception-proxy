import type Puppeteer from 'puppeteer'
import EventEmitter from 'events';
import { PuppeteerToughCookieStore } from 'puppeteer-tough-cookie-store';
import { CookieJar } from 'tough-cookie';
import {
    IConfigurableMixin, ILoggableMixin, INetworkMixin,
    IInterceptionProxyRequest, INewRequestInitialArgs, IRequestOptions,
    RequestStage, IAbortReason, IInterceptionProxyResponse, IResponseOptions,
    IResponseOverrides, RequestMode,
} from '../interfaces'
import { applyConfigurableMixin, applyLoggableMixin, applyNetworkMixin } from '../mixins'
import { InterceptionProxyResponse } from './Response';
import { adjustRequestCorsHeaders } from '../utils/cors'
import { getStageEnhancedErrorMessage } from '../utils/errors';
import { getCDPSession } from '../utils/getCDPSession';

@applyConfigurableMixin
@applyLoggableMixin
@applyNetworkMixin
class RequestBase extends EventEmitter { }

interface RequestBase extends IConfigurableMixin, ILoggableMixin, INetworkMixin, IRequestOptions { }
for (let key of ['method', 'url', 'headers', 'body']) {
    Object.defineProperty(RequestBase.prototype, key, {
        get: function () {
            return this.requestOptions[key];
        },
        set: function (value) {
            return this.__requestOptionSetter(key, value);
        },
        enumerable: true,
        configurable: true
    });
}

/**
 * Plugin' request. The request have significant difference with Puppeteer' request.
 */
class InterceptionProxyRequest extends RequestBase implements IInterceptionProxyRequest {
    emit2(eventName: string, payload: any) {
        this.emit(eventName, payload);
        this.__response?.emit(eventName, payload);
    }

    readonly page;
    readonly originalRequest;
    readonly requestOptions;
    protected __stage: RequestStage;
    protected __parent;
    protected __response?: IInterceptionProxyResponse;
    protected __isAdjusted: boolean = false;

    constructor(initial: INewRequestInitialArgs, requestOptions: IRequestOptions) {
        super();
        this.page = initial.page;
        this.originalRequest = initial.originalRequest;
        this.requestOptions = requestOptions;
        this.__stage = RequestStage.gotRequest;
        this.__parent = initial.__parent;
    }

    static async proceedNewRequest(initial: INewRequestInitialArgs) {
        const { originalRequest, __parent, page } = initial;

        let originalResponse: Puppeteer.HTTPResponse | null = null;
        let proceedResponse = async (_originalResponse: Puppeteer.HTTPResponse) => {
            originalResponse = _originalResponse;
        }
        const onNativeResponse = (_originalResponse: Puppeteer.HTTPResponse) => {
            if (_originalResponse.request() !== originalRequest) return;
            proceedResponse(_originalResponse);
        }
        page.on('response', onNativeResponse);

        const requestOptions: IRequestOptions = {
            method: originalRequest.method() as IRequestOptions["method"],
            url: originalRequest.url(),
            headers: { ...originalRequest.headers() },
            body: originalRequest.postData(),
        };

        adjustRequestCorsHeaders(initial, requestOptions);

        const isRequestClientClosed = (): boolean => {
            const client = getCDPSession(page, originalRequest);
            return !client.connection()
        }

        try {
            if (__parent.enableLegacyCookieHandling) {
                const cookieJar = new CookieJar(new PuppeteerToughCookieStore(getCDPSession(__parent.page, originalRequest)));
                requestOptions.headers['Cookie'] = await cookieJar.getCookieString(requestOptions.url);
            }
        } catch (error) {
            if (isRequestClientClosed()) return;

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

        // native response listener handlers
        request.once('responseInstance', () => {
            page.off('response', onNativeResponse);
        });
        proceedResponse = async (originalResponse: Puppeteer.HTTPResponse) => {
            request.stage = RequestStage.sentRequest;
            const response = await InterceptionProxyResponse.proceedOriginalResponse(request, originalResponse);

            request._setResponseInstance(response, RequestMode.native);
        }

        if (originalResponse) {
            await proceedResponse(originalResponse);
            originalResponse = null;
        }

        for (let handlerObj of request.requestListeners) {
            try {
                const localRes = await handlerObj.handler(request);
                if (localRes) break;
            } catch (error) {
                if (isRequestClientClosed()) return;

                request.recordError(`Your interception handler "${String(handlerObj.key)}" throws an error. ` +
                    `Please wrap your function using try-catch blocks. For now we will ignore an error`, error);
            }

            if (isRequestClientClosed()) return;
        };


        try {
            if (
                request.isResponseOverrideAvailable &&
                !('ignoreResponseBodyIfPossible' in request.getLocalConfiguration())
            ) {
                request.ignoreResponseBodyIfPossible = request.ignoreResponseBodyIfPossible;
            }
            await request.continue();
        } catch (error) {
            if (isRequestClientClosed()) return;

            request.recordError('Unable to proceed response from interception handler. We will abort the request.', error);
            try {
                await originalRequest.abort('failed', request.cooperativePriority);
            } catch (error) {
                // we already said that something went wrong
            }
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
        if (this.requestMode !== RequestMode.managed) {
            this.recordWarning(
                `Possibly the request will not be upgraded by your "${key}" ` +
                `because current mode ${this.requestMode} does not support this ability. ` +
                `Please set "requestMode" variable to "${RequestMode.managed}" and then try again.`);
        }

        if (!this.__isAdjusted) this.__isAdjusted = true;

        this.requestOptions[key] = value;
        this.emit2(key, value);
        this.emit2('requestOptions', this.requestOptions);
    }

    protected async _getResponseInstance(responseOptions?: IResponseOptions): Promise<IInterceptionProxyResponse> {
        const { requestMode } = this;

        // @ts-ignore: we are not much care about ignoring requests
        if (requestMode === RequestMode.ignore) return null;

        if (
            this.isRequestOverrideAvailable && !responseOptions &&
            (this.requestMode === RequestMode.native ||
                (this.requestMode === RequestMode.managed && !this.__isAdjusted && this.nativeContinueIfPossible))
        ) {
            this.stage = RequestStage.sentRequest;
            this.originalRequest.continue(undefined, this.cooperativePriority);
        }

        if (this.__response || this.isResponseCollecting ||
            (requestMode === RequestMode.native && !responseOptions)) {
            const response: IInterceptionProxyResponse =
                this.__response || await new Promise(c => this.once('responseInstance', c));

            if (responseOptions) {
                response.setResponse(responseOptions);
            }

            return response;
        }

        this.stage = RequestStage.sentRequest;
        const response = await InterceptionProxyResponse.proceedNewResponse(this, responseOptions);

        this._setResponseInstance(response);

        return response;
    };

    // If its managed response we can modify data until it will be not sent to puppeteer,
    // but in another case it will be finale version of response
    protected _setResponseInstance(response: IInterceptionProxyResponse, mode: RequestMode = RequestMode.managed) {
        this.__response = response;
        this.stage = mode === RequestMode.managed ? RequestStage.gotResponse : RequestStage.sentResponse;
        this.emit2('responseInstance', response);
    }

    getRequest(): IInterceptionProxyRequest {
        return this;
    };
    async setResponse(response: IResponseOverrides) {
        return await this._getResponseInstance(response);
    }
    async getResponse({ requestMode }: { requestMode?: RequestMode } = {}) {
        if (requestMode) this.requestMode = requestMode;
        return await this._getResponseInstance();
    }
    async abort(abortReason?: IAbortReason) {
        return await this._getResponseInstance({ abortReason: abortReason || 'aborted' });
    }

    async continue() {
        const response = await this.getResponse();
        await response.continue();
    }
}

export {
    InterceptionProxyRequest,
}
