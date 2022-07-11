import type { Method, Headers } from 'got'
import type { ErrorCode } from 'puppeteer'

/**
 * Plugin mode for handling requests
 */
export enum RequestMode {
    /**
     * Plugin will do nothing about original request
     */
    ignore = 'ignore',
    /**
     * Plugin will just listen to the original request/response data and all requests will fulfilled by puppeteer itself.
     * But some plugin functionality can be unavailable.
     */
    native = 'native',
    /**
     * Plugin will do all requests by himself. All plugin features will be available.
     */
    managed = 'managed',
}

/**
 * Current stage of the request
 */
export enum RequestStage {
    // * We just got a new request from the puppeteer and getting additional information about it.
    // initial = 'initial',

    /**
     * We got a new request from the puppeteer witch includes all necessary information about.
     *
     * At this stage we can adjust request.
     */
    gotRequest = 'gotRequest',

    /**
     * The request in requesting process
     *
     * At this stage we unable to adjust request but still have not response to go forward.
     */
    sentRequest = 'sentRequest',

    /**
     * We got response from the request witch probably was modified by the user and now user can adjust the response.
     *
     * At this stage we can adjust response.
     * At this stage the user will unable to override the request anymore.
     */
    gotResponse = 'gotResponse',

    /**
     * We sent final response of the request to the browser.
     *
     * Its too late to adjust request or response.
     */
    sentResponse = 'sentResponse',

    /**
     * Page were closed and we unable do anything
     *
     * From technical perspective `sentResponse` looks just the same
     */
    closed = 'closed',
}

/**
 * Plugin' request options. The request have significant difference with Puppeteer' request.
 * 
 * Can be modified. All changes will be applied to the actual Puppeteer' request and will be executed
 */
export interface IRequestOptions {
    /**
     * Request method.
     *
     * If request were executed you will unable to change this property.
     */
    method: Method;

    /**
     * Request url.
     *
     * If request were executed you will unable to change this property.
     */
    url: string;

    /**
     * Request headers.
     *
     * If request were executed you will unable to change this property.
     */
    headers: Headers;

    /**
     * Request body.
     *
     * If request were executed you will unable to change this property.
     */
    body: string | Buffer | undefined;
}

export interface IResponseOverrides {
    status: number;
    headers: Headers;
    // contentType: string | undefined;
    body: string | Buffer;
}

/**
 * This option will override the response
 * - `aborted` - An operation was aborted (due to user action).
 * - `accessdenied` - Permission to access a resource, other than the network, was denied.
 * - `addressunreachable` - The IP address is unreachable. This usually means
that there is no route to the specified host or network.
 * - `blockedbyclient` - The client chose to block the request.
 * - `blockedbyresponse` - The request failed because the response was delivered along with requirements which are not met ('X-Frame-Options' and 'Content-Security-Policy' ancestor checks, for instance).
 * - `connectionaborted` - A connection timed out as a result of not receiving an ACK for data sent.
 * - `connectionclosed` - A connection was closed (corresponding to a TCP FIN).
 * - `connectionfailed` - A connection attempt failed.
 * - `connectionrefused` - A connection attempt was refused.
 * - `connectionreset` - A connection was reset (corresponding to a TCP RST).
 * - `internetdisconnected` - The Internet connection has been lost.
 * - `namenotresolved` - The host name could not be resolved.
 * - `timedout` - An operation timed out.
 * - `failed` - A generic failure occurred.
 */
export type IAbortReason = ErrorCode;
export type IContinueOverrides = { continue: true };
export type IAbortOverrides = { abortReason?: IAbortReason };

export type IResponseOptions = IResponseOverrides | IContinueOverrides | IAbortOverrides
