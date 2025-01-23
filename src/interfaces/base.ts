import type * as Puppeteer from 'puppeteer' // ContinueRequestOverrides
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
    isLocal?: boolean;
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

/**
 * Plugin configuration object
 */
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
     * 
     * Default - managed
     */
    requestMode: RequestMode;
    /**
     * You can handle all plugins messages
     */
    logger: typeof Logger;
    /**
     * Request timeout in milliseconds(actual execution only)
     */
    timeout: number;
    // attempts: number;
    /**
     * If you didn't changed request or response, let puppeteer handle this request by himself
     * 
     * Default: `false`
     */
    nativeContinueIfPossible: boolean;
    /**
     * If you did not use the plugin' response object it will not retrieve response from puppeteer 
     * for better performance
     * 
     * Applies for `native` mode only
     * 
     * @dev Affects the operation of the `getResponse` only if it is set to direct or 
     * the response object was not explicitly received while working with the request
     */
    ignoreResponseBodyIfPossible: boolean,
    requestHandlers: IRequestHandlerOptions[];
    requestListeners: IRequestListenerOptions[];
}

export interface IPage extends Puppeteer.Page {
    // interceptionConfig: any?;
}
