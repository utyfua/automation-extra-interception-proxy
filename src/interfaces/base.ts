import type Puppeteer from 'puppeteer' // ContinueRequestOverrides
import type { Agent } from 'http'
import type { Hooks } from 'got'
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
     * Proxy for request
     * 
     * Automatically sets `agent` property using [proxy-agent](https://www.npmjs.com/package/proxy-agent)
     * 
     * Examples:
     * - `http://proxy-server-over-tcp.com:3128`
     * - `https://proxy-server-over-tls.com:3129`
     * - `socks://username:password@some-socks-proxy.com:9050` (username & password are optional)
     * - `socks5://username:password@some-socks-proxy.com:9050` (username & password are optional)
     * - `socks4://some-socks-proxy.com:9050`
     * - `pac+http://www.example.com/proxy.pac`
     * 
     * Default `null`
     */
    proxy: string | null, // TODO: fill missing type
    /**
     * Your agent hot handling requests
     * 
     * Sets by `proxy` property. Cleans `proxy` property if sets directly.
     * 
     * Default `null`
     * 
     * @deprecated Use `proxy` property instead. 
     * Deprecated because of possibly incoming request handling rework.
     */
    agent: Agent | null,
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
     * It is not recommended to use. Use another library properties to do it.
     * 
     * Modify requests in more advanced way through interaction with got.
     * 
     * @see https://github.com/sindresorhus/got/blob/main/documentation/9-hooks.md
     */
    gotHooks: Hooks,
    requestHandlers: IRequestHandlerOptions[];
    requestListeners: IRequestListenerOptions[];
}

export interface IPage extends Puppeteer.Page {
    // interceptionConfig: any?;
}
