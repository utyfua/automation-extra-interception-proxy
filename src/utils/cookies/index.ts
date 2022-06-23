// TODO: (T5) increase quality of source code

import type Puppeteer from 'puppeteer'
import { CookieJar } from 'tough-cookie';

import { AUTHOR_NEW_ISSUE_URL, NPM_PACKAGE_NAME } from '../../interfaces/constants'

import { handyCDP } from './handyCDP'
import { getDomain } from '../urls'
import { formatCookie, parseCookieHeader } from './serializing'
import { getCDPSession } from '../getCDPSession';

interface initialVariables {
    url: string;
    domain: string;
    client: Puppeteer.CDPSession,
}

function getInitialVariables(page: Puppeteer.Page, request: Puppeteer.HTTPRequest): initialVariables {
    const frame = request.frame();

    const url = request.isNavigationRequest() || !frame || !frame.url() ? request.url() : frame.url();

    const domain = getDomain(url);

    const client = getCDPSession(page, request);

    return { url, domain, client };
}


export async function getCookieJarByRequest(page: Puppeteer.Page, request: Puppeteer.HTTPRequest): Promise<CookieJar> {
    const { url, client } = getInitialVariables(page, request);
    const browserCookies = await handyCDP.getCookies(client, {
        urls: [url],
        // urls: [url, domain], // saw this code as solution for an issue
    });

    const toughCookies = browserCookies.map(formatCookie);

    // Add cookies to cookieJar
    const cookieJar = CookieJar.deserializeSync({
        version: 'tough-cookie@4.0.0',
        storeType: 'MemoryCookieStore',
        rejectPublicSuffixes: true,
        cookies: toughCookies
    });
    return cookieJar;
}

export async function setCookieByHeaders(page: Puppeteer.Page, request: Puppeteer.HTTPRequest, rawCookies: string | string[]): Promise<void> {
    const { url, client, domain } = getInitialVariables(page, request);

    if (typeof rawCookies === 'string') rawCookies = [rawCookies];
    const browserCookies = rawCookies.map(header => parseCookieHeader(header, domain));

    // Delete old cookies before setting new ones
    for (let cookie of browserCookies) {
        const badCookie = {
            name: cookie.name,
            url: url,
            domain: cookie.domain,
            path: cookie.path
        };
        await handyCDP.deleteCookies(client, badCookie);
    }

    // Store cookies in the browser
    const cookies: Puppeteer.Protocol.Network.SetCookiesRequest["cookies"] = [];
    for (const cookie of browserCookies) {
        if (cookie.name === "") continue;
        const cleanedCookie = { ...cookie };
        if (cleanedCookie.path?.includes("%2F")) {
            cleanedCookie.path = decodeURIComponent(cleanedCookie.path)
        }
        cookies.push(cleanedCookie);
    }
    try {
        // console.log('cookies', { url, cookies, rawCookies })
        await handyCDP.setCookies(client, { cookies });
    } catch (error) {
        throw new Error(
            `Could not set cookies by ${NPM_PACKAGE_NAME} ` +
            `Please provide more information ${AUTHOR_NEW_ISSUE_URL}\n` +
            `Url: ${request.url()}`);
    }
}
