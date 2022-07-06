const memoryDB = {
    corsOptionsReq: {}
}

module.exports = function (req, res) {

    if (req.query.cors) {
        const { origin, methods, headers, allowCredentials } = req.query.cors = JSON.parse(req.query.cors)
        if (origin) res.set('Access-Control-Allow-Origin', origin);
        if (methods) res.set('Access-Control-Allow-Methods', methods);
        if (headers) res.set('Access-Control-Allow-Headers', headers);
        if (allowCredentials) res.set('Access-Control-Allow-Credentials', 'true');
    }

    const headers = { ...req.headers };
    [ // mock unstable headers
        'sec-ch-ua-mobile',
        'sec-ch-ua',
        'sec-ch-ua-platform',
        'accept-language',
        'user-agent',
    ].forEach(header => {
        if (header in headers)
            headers[header] = `testServer mock: '${header}' exist`
    });
    [ // delete irrelevant headers
        /*/ cache
        'cache-control',
        'pragma',
        //*/
    ].forEach(header => {
        delete headers[header];
    });

    const reqFiltered = {
        headers,
        method: req.method,
        // url: req.url,
        query: req.query,
        body: req.body,
    }

    const id = req.params.id;
    if (req.method === 'OPTIONS' && id) {
        memoryDB.corsOptionsReq[id] = reqFiltered;
    } else if (memoryDB.corsOptionsReq[id]) {
        reqFiltered.corsOptionsReq = memoryDB.corsOptionsReq[id];
        delete memoryDB.corsOptionsReq[id];
    }

    res.status(parseInt(req.query.httpCode) || 200);
    res.send(reqFiltered)
}
