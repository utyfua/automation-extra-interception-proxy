const fs = require('fs').promises;
const path = require('path');

const { wrapPage } = require('../')

function getValuesPath(filePath) {
    return path.join(__dirname, 'values', filePath)
}

async function doCorsTest(testName, page) {
    await page.goto('http://localhost:3000/cors.html#' + testName, { timeout: 5000 })
    await page.waitForSelector('#content');

    let valuesName = 'everything';
    // if (testName === 'managed') {
    //     console.warn('managed does not fully support cors')
    //     valuesName = 'managed';
    // }

    const expectedValue = JSON.parse(await fs.readFile(
        getValuesPath(`cors.${valuesName}.json`)));

    const result = JSON.parse(await page.evaluate(
        () => window.content.textContent));

    await fs.writeFile(
        getValuesPath(`cors.${testName}._actual_.json`),
        JSON.stringify(result, null, '\t'))

    expect(result).toStrictEqual(expectedValue)
}

describe('Cors', () => {
    beforeEach(async () => {
        await jestPuppeteer.resetPage()
    })

    test('pure puppeteer', async () => {
        await doCorsTest('pure', page);
    })

    test('native requests with plugin', async () => {
        await wrapPage(page, { requestMode: 'native' });
        await doCorsTest('native', page);
    })

    test('managed nativeContinueIfPossible requests by plugin', async () => {
        await wrapPage(page, { requestMode: 'managed', nativeContinueIfPossible: true });
        await doCorsTest('managed', page);
    })

    // need a lot of work to make it working
    xtest('managed requests by plugin', async () => {
        await wrapPage(page, { requestMode: 'managed' });
        await doCorsTest('managed', page);
    })

    afterEach(() => {
        expect(page.listenerCount('response')).toBe(0)
    })
})
