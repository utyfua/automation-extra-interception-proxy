import type * as Puppeteer from 'puppeteer'
import { IInterceptionProxyPage, INTERCEPTION_KEY_HOOK, IConfig } from '../interfaces/index'
import { applyConfigurableMixin, applyLoggableMixin } from '../mixins/index'
import { InterceptionProxyRequest } from './Request'

@applyConfigurableMixin
@applyLoggableMixin
class PageBase { }

interface PageBase extends IInterceptionProxyPage { }

class InterceptionProxyPageConfig extends PageBase {
    protected __parent?: Partial<IConfig>;

    constructor(readonly page: Puppeteer.Page, __parent?: IConfig) {
        super();
        Object.assign(this, __parent);

        page.on('request', (originalRequest: Puppeteer.HTTPRequest) => {
            InterceptionProxyRequest.proceedNewRequest({
                page: this.page,
                __parent: this,
                originalRequest
            })
        });
    }

    static async proceedNewPage(page: Puppeteer.Page, __parent?: IConfig) {
        if (page[INTERCEPTION_KEY_HOOK]) {
            if (!__parent) return page[INTERCEPTION_KEY_HOOK];
            throw new Error('Interception hook already registered.');
        }

        const interceptionConfig = new InterceptionProxyPageConfig(page, __parent);

        page[INTERCEPTION_KEY_HOOK] = interceptionConfig;

        // sad, but puppeteer-extra will not wait our promise. So we are doing that in the end
        await page.setRequestInterception(true);

        return interceptionConfig;
    }
}

export {
    InterceptionProxyPageConfig,
}
