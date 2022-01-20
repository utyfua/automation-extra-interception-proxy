
import Puppeteer from 'puppeteer'
import { Cookie } from 'tough-cookie';

// Format single browser cookie object to tough-cookie object
export const formatCookie = (cookie: Puppeteer.Protocol.Network.Cookie): Cookie.Serialized => {
    const currentDate = new Date().toISOString();
    return {
        key: cookie.name,
        value: cookie.value,
        expires: (cookie.expires === -1) ? "Infinity" : new Date(cookie.expires * 1000).toISOString(),
        domain: cookie.domain.replace(/^\./, ""),
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        hostOnly: !cookie.domain.startsWith("."),
        creation: currentDate,
        lastAccessed: currentDate
    };
};

// Parse single raw cookie string to a cookie object for the browser
export const parseCookieHeader = (rawCookie: string, domain: string) => {
    const cookie: Puppeteer.Protocol.Network.CookieParam = {
        name: "",
        value: "",
        domain,
        path: "/",
        secure: false,
        httpOnly: false,
        sameSite: "Lax",
        expires: undefined
    };
    const pairs = rawCookie.split(/; */);
    for (let i = 0; i < pairs.length; i++) {
        // Split to key value pair e.g. key=value
        const pair = pairs[i].split(/=(.*)/, 2);
        // Trim and assign key and value
        let key = pair[0].trim();
        let value = pair[1] ? pair[1].trim() : "";
        // Remove surrounding quotes from value if exists
        value = value.replace(/^"(.*)"$/, "$1");
        switch (key.toLowerCase()) {
            case "domain": cookie.domain = value; break;
            case "path": cookie.path = value; break;
            case "secure": cookie.secure = true; break;
            case "httponly": cookie.httpOnly = true; break;
            case "samesite":
                const firstChar = value[0].toUpperCase();
                const restChars = value.slice(1).toLowerCase();
                // TODO: (T6) find a way to set the variable without ts-ignore
                // @ts-ignore
                cookie.sameSite = firstChar + restChars;
                break;
            case "max-age":
                // Current time and 'max-age' in seconds
                const currentTime = new Date().getTime() / 1000;
                const maxAge = parseInt(value);
                cookie.expires = Math.round(currentTime + maxAge);
                break;
            case "expires":
                // If cookie expires hasn't already been set by 'max-age'
                if (!cookie.expires) {
                    const time = new Date(value).getTime();
                    cookie.expires = Math.round(time / 1000);
                }
                break;
            default: if (i < 1) { cookie.name = key; cookie.value = value }
        }
    }
    return cookie;
}
