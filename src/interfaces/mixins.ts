import type { IConfig, ILogObject, IRequestHandlerOptions, IRequestListenerOptions } from './base'


export type IConfigurableHandlerTarget = IRequestHandlerOptions["key"] | IRequestHandlerOptions["handler"]
export type IConfigurableListenerTarget = IRequestListenerOptions["key"] | IRequestListenerOptions["handler"]

export interface IConfigurableMixin extends IConfig {
    addRequestHandler(handlerOptions: IRequestHandlerOptions): void
    addRequestHandler(handler: IRequestHandlerOptions["handler"]): void
    addRequestHandler(priority: IRequestHandlerOptions["priority"], handler: IRequestHandlerOptions["handler"]): void
    addRequestHandler(key: IRequestHandlerOptions["key"], handler: IRequestHandlerOptions["handler"]): void
    addRequestHandler(key: IRequestHandlerOptions["key"], priority: IRequestHandlerOptions["priority"], handler: IRequestHandlerOptions["handler"]): void
    // enableRequestHandler(target: IConfigurableHandlerTarget): void
    // disableRequestHandler(target: IConfigurableHandlerTarget): void
    deleteLocalRequestHandler(target: IConfigurableHandlerTarget): boolean

    addRequestListener(listenerOptions: IRequestListenerOptions): void
    addRequestListener(handler: IRequestListenerOptions["handler"]): void
    addRequestListener(priority: IRequestListenerOptions["priority"], handler: IRequestListenerOptions["handler"]): void
    addRequestListener(key: IRequestListenerOptions["key"], handler: IRequestListenerOptions["handler"]): void
    addRequestListener(key: IRequestListenerOptions["key"], priority: IRequestListenerOptions["priority"], handler: IRequestListenerOptions["handler"]): void
    // enableRequestListener(target: IConfigurableListenerTarget): void
    // disableListener(target: IConfigurableListenerTarget): void
    deleteLocalRequestListener(target: IConfigurableListenerTarget): boolean

    /**
     * Flush local configuration
     * @param key If provided will flush only specific parameter at local level
     */
    flushLocal(key?: keyof IConfig): void
}

export interface ILoggableMixin {
    /**
     * Pass an error to the logger
     * @param message Flow description
     * @param error Original error object
     * @param meta non specific meta information
     */
    recordError(
        message: ILogObject["message"],
        error?: ILogObject["error"],
        ...meta: ILogObject["meta"]
    ): void
    /**
     * Pass an internal error to the logger
     * @param message Flow/error description
     * @param meta non specific meta information
     */
    recordInternalError(
        message: ILogObject["message"],
        ...meta: ILogObject["meta"]
    ): void
}

export interface INetworkMixin {
    isRequestOverrideAvailable: boolean;
    isResponseCollecting: boolean;
    isResponseCollected: boolean;
    isResponseOverrideAvailable: boolean;
    isResponseFinished: boolean;
}
