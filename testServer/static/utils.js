const testRoute = '/test/';
const origin = location.origin

const unordered = {
    'b': 'foo',
    'c': 'bar',
    'a': 'baz'
};

console.log(JSON.stringify(unordered));
// → '{"b":"foo","c":"bar","a":"baz"}'


function getPrettyObject(unordered) {
    if (unordered instanceof Array || typeof unordered !== 'object')
        return unordered;
    return Object.keys(unordered).sort().reduce(
        (obj, key) => {
            obj[key] = getPrettyObject(unordered[key]);
            return obj;
        },
        {}
    )
}

function echo(payload) {
    payload = getPrettyObject(payload);
    console.log(payload);
    contentParent.innerHTML = `<div id="content">${JSON.stringify(payload, null, 2)}</div>`;
}

function getCorsUrl({ force }) {
    if (location.host.startsWith('localhost'))
        return location.origin.replace('localhost', '127.0.0.1') + testRoute;
    if (location.host.startsWith('127.0.0.1'))
        return location.origin.replace('127.0.0.1', 'localhost') + testRoute;

    if (force)
        throw echo({
            errorMessage: `Test was open throw unsupported host: ${location.host}`
        });

    return '';
}

function filterResponse(result) {
    return {
        status: result.status,
        headers: result.headers,
        data: result.data,
    }
}

async function doRequest(id, request = {}) {
    if (!request.url) request.url = testRoute
    const testSuite = location.hash.slice(1);
    request.url += (testSuite ? testSuite + ': ' : '') + id;

    let response, errorMessage;
    try {
        response = await axios(request)
    } catch (error) {
        response = error.response
        errorMessage = error.message
    };

    if (response) {
        response = {
            status: response.status,
            headers: response.headers,
            data: response.data,
        }
        delete response.headers['content-length'];
    }

    delete request.url

    return {
        id,
        // echo request
        request,
        // cut off irrelevant
        response,
        errorMessage
    }
}

async function proceedWrapper(...tests) {
    try {
        const result = {};
        for (const test of tests) {
            const response = await test();
            const id = response.id;
            if (!id || id in result)
                throw new Error("Something wrong with " + id)
            result[id] = response
        }
        echo({ result })
    } catch (error) {
        console.error(error);
        echo({ errorMessage: error.stack })
    }
}
