import type { Frame } from 'puppeteer';
import {
    INewRequestInitialArgs, IRequestOptions,
} from '../interfaces/index'
import { getDomain, getOrigin } from './urls'

function getFrameUrl(frame: Frame | null): string | null {
    if (!frame) return null;

    const url = frame.url();
    if (url) return url;

    const parentFrame = frame.parentFrame();

    return getFrameUrl(parentFrame);
}

export function adjustRequestCorsHeaders({ originalRequest }: INewRequestInitialArgs, requestOptions: IRequestOptions) {
    const frame = originalRequest.frame();
    const frameUrl = getFrameUrl(frame);

    if (!frameUrl || originalRequest.resourceType() !== "xhr") return;

    try {
        if (getDomain(frameUrl) === getDomain(requestOptions.url)) return;

        requestOptions.headers['Origin'] = getOrigin(frameUrl);
    } catch (error) {
        console.error(error)
    }
}
