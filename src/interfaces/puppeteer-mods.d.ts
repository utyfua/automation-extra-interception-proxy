// based on:
// https://github.com/berstend/puppeteer-extra/blob/c2880f9063ddd31cff6c87ddbc9a95a19ac9e0dd/packages/puppeteer-extra-plugin-recaptcha/src/types.ts

// Extend Puppeteer interfaces transparently to the end user.

// Note, we need to manually copy this file into the build dir (yarn ambient-dts): https://stackoverflow.com/questions/56018167
// Note2: It's not sufficient to just copy over this d.ts file, it needs to be referenced by another .ts file!
// Note3: To make it even more urgh the TS compiler will change the reference import path, hence we need to fix that in the end as well

// This import statement is important for all this to work, otherwise we don't extend but replace the puppeteer module definition.
// https://github.com/microsoft/TypeScript/issues/10859
import { } from 'puppeteer'

import { INTERCEPTION_KEY_HOOK } from './constants'

import { IInterceptionProxyBrowser, IInterceptionProxyPage } from './classes'

export type InterceptionProxyPluginBrowserAdditions = {
    [INTERCEPTION_KEY_HOOK]: IInterceptionProxyBrowser,
}

export type InterceptionProxyPluginPageAdditions = {
    [INTERCEPTION_KEY_HOOK]: IInterceptionProxyPage,
}

declare module 'puppeteer' {
    interface Browser extends InterceptionProxyPluginBrowserAdditions { }
    interface Page extends InterceptionProxyPluginPageAdditions { }
}

declare module 'puppeteer-core' {
    interface Browser extends InterceptionProxyPluginBrowserAdditions { }
    interface Page extends InterceptionProxyPluginPageAdditions { }
}
