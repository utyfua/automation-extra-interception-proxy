/*/
// https://github.com/smooth-code/jest-puppeteer/issues/260#issuecomment-690817921
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

require.cache[require.resolve('puppeteer')] =
    require.cache[require.resolve('puppeteer-extra')];
//*/


module.exports = {
    launch: {
        headless: process.env.HEADLESS !== 'false',
    },
    server: {
        command: `npm run test:server`,
        port: 3000,
        launchTimeout: 10000,
        debug: true,
    },
}
