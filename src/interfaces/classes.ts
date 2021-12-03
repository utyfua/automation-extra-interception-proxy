import type Puppeteer from 'puppeteer' // ContinueRequestOverrides
import type EventEmitter from 'events'
import type { IConfigurableMixin, ILoggableMixin, INetworkMixin } from './mixins'
import type { RequestStage, IRequestOptions, IResponseOptions, IAbortReason, IResponseOverrides } from './network'

// TODO: add PuppeteerExtraPlugin/AutomationExtraPlugin?
export interface IInterceptionProxyPlugin extends
    IConfigurableMixin, ILoggableMixin {
}

export interface IInterceptionProxyBrowser extends
    IConfigurableMixin, ILoggableMixin {
}

export interface IInterceptionProxyPage extends
    IConfigurableMixin, ILoggableMixin {
    readonly page: Puppeteer.Page;
}

export interface INewRequestInitialArgs {
    page: Puppeteer.Page;
    __parent: IInterceptionProxyPage;
    originalRequest: Puppeteer.HTTPRequest;
}

export interface IInterceptionProxyNetworkEntity extends
    IConfigurableMixin, ILoggableMixin, EventEmitter, INetworkMixin {
    readonly page: Puppeteer.Page;
    readonly originalRequest: Puppeteer.HTTPRequest;
    stage: RequestStage;

    getRequest(): IInterceptionProxyRequest;
    setResponse(response: IResponseOptions): Promise<IInterceptionProxyResponse>;
    getResponse(): Promise<IInterceptionProxyResponse>;
    abort(abortReason?: IAbortReason): Promise<IInterceptionProxyResponse>;
    /**
     * Will send gathered response back to the puppeteer immediately
     *
     * If response not collected yet will call getResponse first.
     */
    continue(): Promise<void>;
}

export interface IInterceptionProxyRequest extends
    IInterceptionProxyNetworkEntity, IRequestOptions {
}

export interface IInterceptionProxyResponse extends
    IInterceptionProxyNetworkEntity, Partial<IResponseOverrides> {
    responseOptions: IResponseOptions;
    abortReason?: IAbortReason;
}
