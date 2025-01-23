import got, { OptionsOfBufferResponseBody } from 'got';
import { IInterceptionProxyRequest, IResponseOptions } from '../interfaces/index';

export const buildGotHttpHandler = (
    gotOptions: Partial<OptionsOfBufferResponseBody> = {}
) => async (request: IInterceptionProxyRequest): Promise<void | IResponseOptions> => {
    try {
        const {
            method, url, headers, body,
            timeout,
        } = request;
        if (!url.startsWith('http:') && !url.startsWith('https:')) return;

        const options: OptionsOfBufferResponseBody = {
            // main request options
            method, url, headers, body,

            // secondary request options
            timeout,

            // another `got` options
            responseType: 'buffer',
            throwHttpErrors: false,
            ignoreInvalidCookies: true,
            followRedirect: false,

            ...gotOptions,
        }

        const gotResponse = await got(options);

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
