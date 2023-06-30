import type * as Puppeteer from "puppeteer";

/**
 * @internal for _OriginalRequestStateManager
 */
type UserListener = (response: Puppeteer.HTTPResponse | null) => void

/** 
 * keep in track frow state
 * 
 * @internal
 */
export class _OriginalRequestStateManager {
    protected response: Puppeteer.HTTPResponse | null | undefined
    protected pageListeners: {
        response: (response: Puppeteer.HTTPResponse) => void,
        requestfailed: (response: Puppeteer.HTTPRequest) => void,
        requestfinished: (response: Puppeteer.HTTPRequest) => void,
    }
    protected userListeners: UserListener[] = [];
    constructor(protected page: Puppeteer.Page, protected request: Puppeteer.HTTPRequest) {
        this.pageListeners = {
            response: (response) => {
                if (response.request() !== request) return;
                this.close(response);
            },
            requestfailed: (_request) => {
                if (_request !== request) return;
                this.close();
            },
            requestfinished: (_request) => {
                if (_request !== request) return;
                this.close();
            },
        }
        this.setListeners('on')
    }
    setListeners(method: 'on' | 'off') {
        Object.entries(this.pageListeners).forEach(([name, listener]) =>
            // @ts-ignore: should we do typings?
            this.page[method](name, listener)
        )
    }
    onResponse(listener: UserListener): void {
        if (this.response !== undefined) {
            listener(this.response)
            return
        }
        this.userListeners.push(listener);
    }
    close(response?: Puppeteer.HTTPResponse) {
        if (this.response !== undefined) return;
        const resultResponse = this.response = response || this.request.response();
        this.setListeners('off')
        const userListeners = this.userListeners
        this.userListeners = [];
        userListeners.forEach(listener => listener(resultResponse))
    }
}