import type * as Puppeteer from 'puppeteer'

import { IConfig } from './interfaces/index';

import { Plugin } from './classes/Plugin';
import { InterceptionProxyPageConfig } from './classes/Page';
import type { InterceptionProxyRequest } from './classes/Request'

export {
    IConfig,
    InterceptionProxyRequest,
    Plugin as InterceptionProxyPlugin,
    Plugin as default,
    Plugin as AutomationExtraInterceptionProxyPlugin,
}

/**
 * Add interception ability to the page [(sample)](https://github.com/utyfua/automation-extra-interception-proxy/blob/master/samples/singlePageInterception.js)
 *
 * @param page Page for future interceptions
 */
export async function wrapPage(page: Puppeteer.Page, config?: IConfig): Promise<InterceptionProxyPageConfig> {
    return await InterceptionProxyPageConfig.proceedNewPage(page, config);
}
