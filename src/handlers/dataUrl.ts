import {
    AUTHOR_NEW_ISSUE_URL, NPM_PACKAGE_NAME,
    IInterceptionProxyRequest, IResponseOptions
} from '../interfaces';


let isNotified = false;
export const dataUrlHandlerKey = 'dataUrl';
export async function dataUrlHandler(request: IInterceptionProxyRequest): Promise<void | IResponseOptions> {
    const { url } = request;
    if (!url.startsWith('data:')) return;
    if (!isNotified) {
        isNotified = true;
        request.logger({
            level: 'warning',
            message: `${NPM_PACKAGE_NAME} does not support full data url management\n` +
                `Request will be continued by default but also you have option to override response\n` +
                `If you really need to support data url let me know ${AUTHOR_NEW_ISSUE_URL}`,
            meta: [url.slice(0, 25) + (url.length > 25 ? '。。。 ＋' + (url.length - 25) + ' symbols' : '')],
        });
    }
    return { continue: true }
}
