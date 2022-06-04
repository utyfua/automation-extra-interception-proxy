import type Puppeteer from 'puppeteer' // ContinueRequestOverrides
import { IInterceptionProxyRequest } from './classes';
import { IResponseOptions, RequestMode } from './network'

export interface ILogObject {
    level: 'error' | 'warning' | 'info' | 'debug',
    message: string,
    error?: any, // TODO: fill missing type? (10)
    meta: Array<any>,
}
export declare function Logger(logObject: ILogObject): void

export interface IBaseRequestHookOptions {
    key: string | symbol;
    priority: number;
    // disabled?: boolean;
    isLocal?: boolean;
    // handler: (...args: any[]) => any;
}

export type IRequestHandler = (request: IInterceptionProxyRequest) => void | IResponseOptions | Promise<void | IResponseOptions>
export type IRequestListener = (request: IInterceptionProxyRequest) => void | true | Promise<void | true>

export interface IRequestHandlerOptions extends IBaseRequestHookOptions {
    handler: IRequestHandler;
}
export interface IRequestListenerOptions extends IBaseRequestHookOptions {
    handler: IRequestListener;
}

export interface IRequestEventOptionsMap {
    requestHandlers: IRequestHandlerOptions,
    requestListeners: IRequestListenerOptions,
}

export interface IConfig {
    /**
     * Puppeteer' "Cooperative Intercept Mode" `priority`
     *
     * This package using own way to manage cooperation
     *
     * Use only if you know what it does
     *
     * [[Read more]](https://github.com/puppeteer/puppeteer/blob/v10.2.0/docs/api.md#cooperative-intercept-mode-and-legacy-intercept-mode)
     */
    cooperativePriority: undefined | number;
    /**
     * `ignore` - Plugin will do nothing about original request
     *
     * `native` - Plugin will just listen to the original request/response data and all requests will fulfilled by puppeteer itself. But some plugin functionality can be unavailable.
     *
     * `managed` - Plugin will do all requests by `requestHandlers` or by himself. All plugin features will be available.
     */
    requestMode: RequestMode;
    proxy: any; // TODO: fill missing type
    logger: typeof Logger;
    timeout: number;
    // attempts: number;
    nativeContinueIfPossible: boolean;
    requestHandlers: IRequestHandlerOptions[];
    requestListeners: IRequestListenerOptions[];
}

export interface IPage extends Puppeteer.Page {
    // interceptionConfig: any?;
}
