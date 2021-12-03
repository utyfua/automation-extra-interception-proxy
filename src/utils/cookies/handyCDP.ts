import type Puppeteer from 'puppeteer'
export const handyCDP = {
    async getCookies(
        client: Puppeteer.CDPSession,
        options: Puppeteer.Protocol.Network.GetCookiesRequest
    ): Promise<Puppeteer.Protocol.Network.Cookie[]> {
        return (await client.send("Network.getCookies", options)).cookies;
    },
    async setCookies(
        client: Puppeteer.CDPSession,
        cookies: Puppeteer.Protocol.Network.SetCookiesRequest
    ): Promise<void> {
        return await client.send("Network.setCookies", cookies);
    },
    async deleteCookies(
        client: Puppeteer.CDPSession,
        cookies: Puppeteer.Protocol.Network.DeleteCookiesRequest
    ): Promise<void> {
        return await client.send("Network.deleteCookies", cookies);
    },
}
