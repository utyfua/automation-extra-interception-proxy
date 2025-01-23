import parseDataURL from 'data-urls';
import {
    IInterceptionProxyRequest, IResponseOptions
} from '../interfaces/index';

export async function dataUrlHandler(request: IInterceptionProxyRequest): Promise<void | IResponseOptions> {
    const { url } = request;
    if (!url.startsWith('data:')) return;

    const dataURL = parseDataURL(url);
    if (!dataURL) return; // the result cannot be parsed as a data: URL.

    const contentType = dataURL.mimeType.toString()

    return {
        status: 200,
        headers: {
            'content-type': contentType
        },
        // contentType,
        body: dataURL.body,
    }
}
