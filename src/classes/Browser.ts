import type Puppeteer from 'puppeteer'
import { IInterceptionProxyBrowser, IInterceptionProxyPlugin } from '../interfaces'
import { applyConfigurableMixin, applyLoggableMixin } from '../mixins'
import { InterceptionProxyPageConfig } from './Page'

@applyConfigurableMixin
@applyLoggableMixin
class BrowserBase { }

interface BrowserBase extends IInterceptionProxyBrowser { }

class InterceptionProxyBrowserConfig extends BrowserBase {
    constructor(protected __parent: IInterceptionProxyPlugin) {
        super();
    }

    async proceedNewPage(page: Puppeteer.Page) {
        return await InterceptionProxyPageConfig.proceedNewPage(page, this)
    }
}

export {
    InterceptionProxyBrowserConfig
}
