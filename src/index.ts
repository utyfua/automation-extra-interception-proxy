import type Puppeteer from 'puppeteer'

import { Plugin } from './classes/Plugin';
import { InterceptionProxyPageConfig } from './classes/Page';

export {
    Plugin as InterceptionProxyPlugin,
    Plugin as default,
    Plugin as AutomationExtraInterceptionProxyPlugin,
}

/**
 * Add interception ability to the page [(sample)](https://github.com/utyfua/automation-extra-interception-proxy/blob/master/samples/singlePageInterception.js)
 *
 * @param page Page for future interceptions
 */
export async function wrapPage(page: Puppeteer.Page): Promise<InterceptionProxyPageConfig> {
    return await InterceptionProxyPageConfig.proceedNewPage(undefined, page);
}
