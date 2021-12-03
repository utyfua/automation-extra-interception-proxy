import type Puppeteer from 'puppeteer'

import { Plugin } from './classes/Plugin';
import { InterceptionProxyPageConfig } from './classes/Page';

export {
    Plugin as InterceptionProxyPlugin,
    Plugin as default,
    Plugin as AutomationExtraInterceptionProxyPlugin,
}

export async function wrapPage(page: Puppeteer.Page) {
    return await InterceptionProxyPageConfig.proceedNewPage(undefined, page);
}
