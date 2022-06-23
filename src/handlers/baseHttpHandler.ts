import got, { OptionsOfBufferResponseBody } from 'got';
import type { Agent } from 'http'

import { IInterceptionProxyRequest, IResponseOptions } from '../interfaces';

export function getGotAgent(agent: Agent | null): any {
    if (agent === null) { return }

    return {
        http: agent,
        https: agent,
    }
}

export const baseHttpHandlerKey = 'baseHttpHandlerKey';
export async function baseHttpHandler(request: IInterceptionProxyRequest): Promise<void | IResponseOptions> {
    try {
        const {
            method, url, headers, body, cookieJar,
            timeout, agent
        } = request;
        if (!url.startsWith('http:') && !url.startsWith('https:')) return;

        const gotOptions: OptionsOfBufferResponseBody = {
            // main request options
            method, url, headers, body, cookieJar,

            // secondary request options
            timeout,
            agent: getGotAgent(agent),

            // another `got` options
            responseType: 'buffer',
            throwHttpErrors: false,
            ignoreInvalidCookies: true,
            followRedirect: false,
        }

        const gotResponse = await got(gotOptions);

        return {
            status: gotResponse.statusCode,
            headers: gotResponse.headers,
            // contentType: gotResponse.headers['content-type'],
            body: gotResponse.body,
        }
    } catch (error) {
        request.recordWarn('Unable to get response for', [request.url, error])
        // TODO: throw correct `abortReason`
        return {
            abortReason: 'connectionreset'
        }
    }
}
