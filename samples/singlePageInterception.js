/**
 * This example will show how to enable interceptions for single page.
 *
 * This code will get some wallpaper image urls from bing.com
 *
 * This code could be broken if their behavior was changed.
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
    await InterceptionUtils.wrapPage(page, {
        requestMode: "managed",

        // optional, will be handled by https://www.npmjs.com/package/proxy-agent
        // proxy: "socks5://username:password@some-socks-proxy.com:9050" 
    });

    // create promise callback for async processing
    let callback;
    const promise = new Promise((resolve) => { callback = resolve; });

    // add some listener
    page.interceptions.addRequestListener('bing-images', async request => {

        // filter anything else
        if (request.url !== 'https://www.bing.com/hp/api/model') {
            // just letting you know that we got something else here
            console.log('Ignoring', request.url.slice(0, 50));
            return
        }

        // get response data
        const response = await request.getResponse();

        // grab data directly from their api response
        const apiData = response.json;

        // doing anything you like
        const imageUrls = apiData.MediaContents.map(({ ImageContent }) =>
            `https://www.bing.com${ImageContent.Image.Url}`);

        // back to async thread
        callback(imageUrls);

    }); // end of listener

    // goto to our destination and wait for the response
    const [imageUrls] = await Promise.all([
        promise,
        page.goto('https://www.bing.com/'),
    ]);

    // print our image urls
    console.log('imageUrls', imageUrls);

    // not necessary: cleaning our listener
    page.interceptions.deleteLocalRequestListener('bing-images');

    // closing browser
    await browser.close();

})(); // ent of our thread
