export const EXTRA_PLUGIN_ID = "InterceptionProxyPlugin"
export const DEFAULT_KEY = Symbol('default key');
export const NOOP = () => { };
export const INTERCEPTION_KEY_HOOK = 'interceptions'

/**
 * @utyfua:
 * - puppeteer-extra or automation-extra? Whats better?
 * Plugins based on automation-extra still have raw/alfa stage.
 * I hope automation ecosystem will grow!
 */
export const NPM_PACKAGE_NAME = 'automation-extra-interception-proxy';
export const AUTHOR_REPOSITORY_URL = `https://github.com/utyfua/${NPM_PACKAGE_NAME}`
export const AUTHOR_NEW_ISSUE_URL = `${AUTHOR_REPOSITORY_URL}/issues/new`
