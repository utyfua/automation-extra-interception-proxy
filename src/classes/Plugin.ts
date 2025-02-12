import type * as Puppeteer from 'puppeteer'
import { IInterceptionProxyPlugin, EXTRA_PLUGIN_ID, INTERCEPTION_KEY_HOOK } from '../interfaces/index'
import { applyConfigurableMixin, applyLoggableMixin } from '../mixins/index'
import { InterceptionProxyBrowserConfig } from './Browser'
import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin'

@applyConfigurableMixin
@applyLoggableMixin
class PluginBase extends PuppeteerExtraPlugin {
    get name() { // puppeteer-extra
        return EXTRA_PLUGIN_ID
    }
}
//*/

interface PluginBase extends IInterceptionProxyPlugin { }

class InterceptionProxyPlugin extends PluginBase {
    async onPageCreated(page: Puppeteer.Page) {
        const browser = await page.browser();
        browser[INTERCEPTION_KEY_HOOK].proceedNewPage(page);
    }

    // Add additions to already existing pages and frames
    async onBrowser(browser: Puppeteer.Browser) {
        browser[INTERCEPTION_KEY_HOOK] = new InterceptionProxyBrowserConfig(this)

        const pages = await browser.pages()
        for (const page of pages) {
            this.onPageCreated(page)
        }
    }
}

export {
    InterceptionProxyPlugin,
    InterceptionProxyPlugin as default,
    InterceptionProxyPlugin as Plugin
}
