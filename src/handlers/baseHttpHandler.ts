import got, { OptionsOfBufferResponseBody } from 'got';

import { IInterceptionProxyRequest, IResponseOptions } from '../interfaces';

export const baseHttpHandlerKey = 'baseHttpHandlerKey';
export async function baseHttpHandler(request: IInterceptionProxyRequest): Promise<void | IResponseOptions> {
    try {
        const {
            method, url, headers, body, cookieJar,
            timeout, agent, gotHooks
        } = request;
        if (!url.startsWith('http:') && !url.startsWith('https:')) return;

        const gotOptions: OptionsOfBufferResponseBody = {
            // main request options
            method, url, headers, body, cookieJar, hooks: gotHooks,

            // secondary request options
            timeout,

            // another `got` options
            responseType: 'buffer',
            throwHttpErrors: false,
            ignoreInvalidCookies: true,
            followRedirect: false,
        }

        if (agent) {
            gotOptions.agent = {
                http: agent,
                https: agent,
            } as any;
        }

        const gotResponse = await got(gotOptions);

        return {
            status: gotResponse.statusCode,
            headers: gotResponse.headers,
            // contentType: gotResponse.headers['content-type'],
            body: gotResponse.body,
        }
    } catch (error) {
        request.recordWarning('Unable to get response for', [request.url, error])
        // TODO: throw correct `abortReason`
        return {
            abortReason: 'connectionreset'
        }
    }
}
