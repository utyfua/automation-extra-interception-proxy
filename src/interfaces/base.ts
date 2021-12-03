import type Puppeteer from 'puppeteer' // ContinueRequestOverrides
import { IResponseOptions } from './network'

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

export type IRequestHandler = (...args: any[]) => void | IResponseOptions | Promise<void | IResponseOptions>
export type IRequestListener = (...args: any[]) => void | true | Promise<void | true>

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
     * Puppeteer` "Cooperative Intercept Mode" `priority`
     *
     * This package using own way to manage cooperation
     *
     * Use only if you know what it does
     *
     * [[More]](https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#cooperative-intercept-mode-and-legacy-intercept-mode)
     */
    cooperativePriority: undefined | number;
    proxy: any; // TODO: fill missing type
    logger: typeof Logger;
    timeout: number;
    // attempts: number;
    continueIfPossible: boolean;
    requestHandlers: IRequestHandlerOptions[];
    requestListeners: IRequestListenerOptions[];
}

export interface IPage extends Puppeteer.Page {
    // interceptionConfig: any?;
}
