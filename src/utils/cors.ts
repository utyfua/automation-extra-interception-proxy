import {
    INewRequestInitialArgs, IRequestOptions,
} from '../interfaces'
import { getDomain, getOrigin } from './urls'

export function adjustRequestCorsHeaders({ originalRequest }: INewRequestInitialArgs, requestOptions: IRequestOptions) {
    const frame = originalRequest.frame();

    if (!frame || originalRequest.resourceType() !== "xhr") return;

    const frameUrl = frame.url();

    if (getDomain(frameUrl) === getDomain(requestOptions.url)) return;

    requestOptions.headers['Origin'] = getOrigin(frameUrl);
}
