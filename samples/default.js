/**
 * This example will show how to setup the library for single page.
 */

// require libs
const puppeteer = require('puppeteer');
const InterceptionUtils = require('automation-extra-interception-proxy');

// do everything async
(async () => {

    // launch some browser
    const browser = await puppeteer.launch({
        headless: false,
    });

    // get some page
    const page = await browser.newPage();

    // attach interception commands
    await InterceptionUtils.wrapPage(page);

    // goto to our destination and wait for the response
    await page.goto('https://www.npmjs.com/package/automation-extra-interception-proxy');

    // closing browser
    await browser.close();

})(); // ent of our thread
