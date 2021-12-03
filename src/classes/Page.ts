import type Puppeteer from 'puppeteer'
import { IInterceptionProxyPage, IInterceptionProxyBrowser, INTERCEPTION_KEY_HOOK } from '../interfaces'
import { applyConfigurableMixin, applyLoggableMixin } from '../mixins'
import { InterceptionProxyRequest } from './Request'

@applyConfigurableMixin
@applyLoggableMixin
class PageBase { }

interface PageBase extends IInterceptionProxyPage { }

class InterceptionProxyPageConfig extends PageBase {
    protected __parent?: IInterceptionProxyBrowser;

    constructor(__parent: IInterceptionProxyBrowser | undefined, readonly page: Puppeteer.Page) {
        super();
        this.__parent = __parent;
    }

    static async proceedNewPage(__parent: IInterceptionProxyBrowser | undefined, page: Puppeteer.Page) {
        const interceptionConfig = new InterceptionProxyPageConfig(__parent, page);

        // @ts-ignore
        page[INTERCEPTION_KEY_HOOK] = interceptionConfig;

        page.on('request', (originalRequest: Puppeteer.HTTPRequest) => {
            InterceptionProxyRequest.proceedNewRequest({
                page: interceptionConfig.page,
                __parent: interceptionConfig,
                originalRequest
            })
        });

        // sad, but puppeteer-extra will not wait our promise. So we are doing that in the end
        await page.setRequestInterception(true);

        return interceptionConfig;
    }
}

export {
    InterceptionProxyPageConfig,
}
