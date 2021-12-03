import { IInterceptionProxyRequest, IResponseOptions } from '../interfaces';
import got from 'got';
import ProxyAgent from 'proxy-agent';

export function getGotProxyAgent(proxy: any): any {
    if (proxy === null) { return }
    const proxyAgent = new ProxyAgent(proxy);
    return {
        http: proxyAgent,
        https: proxyAgent,
    }
}

export const baseHttpHandlerKey = 'baseHttpHandlerKey';
export async function baseHttpHandler(request: IInterceptionProxyRequest): Promise<void | IResponseOptions> {
    const {
        method, url, headers, body, cookieJar,
        timeout, proxy
    } = request;
    if (!url.startsWith('http:') && !url.startsWith('https:')) return;

    const gotOptions = {
        // main request options
        method, url, headers, body, cookieJar,

        // secondary request options
        timeout,
        agent: getGotProxyAgent(proxy),

        // another `got` options
        responseType: "buffer" as "buffer",
        throwHttpErrors: false,
        ignoreInvalidCookies: true,
        followRedirect: false,
    }
    const gotResponse = await got(gotOptions);
    return {
        status: gotResponse.statusCode,
        headers: gotResponse.headers,
        contentType: gotResponse.headers['content-type'],
        body: gotResponse.body,
    }
}
