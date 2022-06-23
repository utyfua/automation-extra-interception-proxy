import type Puppeteer from 'puppeteer'

export function getCDPSession(page: Puppeteer.Page, request: Puppeteer.HTTPRequest): Puppeteer.CDPSession {
    // WARNING: we are using private property of Puppeteer.HTTPRequest here
    // @ts-ignore: _client is private but we want to get this variable
    let client: Puppeteer.CDPSession | undefined = request._client;

    // for puppeteer@13 and below
    if (client) return client;

    // in another case we deal with private property #client

    // get frame' client if possible
    const frame = request.frame();
    if (frame) {
        // @ts-ignore: its inaccessible in types for puppeteer@13 and below
        return frame._client();
    }

    // in another case just return page' client
    // @ts-ignore: its inaccessible in types for puppeteer@13 and below
    return page._client()
}
