const puppeteer = require('puppeteer');
// const InterceptionUtils = require('automation-extra-interception-proxy');
const InterceptionUtils = require('./');

// do everything async
(async () => {

    // launch some browser
    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
    });

    // get some page
    const [page] = await browser.pages();

    // attach interception commands
    const interceptions = await InterceptionUtils.wrapPage(page, {
        requestMode: 'managed',
        // requestMode: 'native',
    });
    console.log({ interceptions })

    try {
        await page.goto('http://localhost:3000/cors.html', { timeout: 3000 });
    } catch (err) {
        await page.goto('https://www.npmjs.com/package/automation-extra-interception-proxy');
    }

    console.log('Go!');
})()
