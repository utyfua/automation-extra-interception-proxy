const corsUrl = getCorsUrl({ force: true });

proceedWrapper(
    // base
    () => doRequest(
        "pass local request",
        {}),
    () => doRequest(
        "pass 404 GET request",
        { params: { httpCode: 404 } }),
    //*/

    // method
    () => doRequest(
        "pass asterisk cors GET request",
        { url: corsUrl, params: { cors: { origin: '*' } } }),
    () => doRequest(
        "pass cors GET request",
        { url: corsUrl, params: { cors: { origin } } }),
    () => doRequest(
        "fail cors GET request",
        { url: corsUrl }),
    () => doRequest(
        "pass origin cors GET request",
        { url: corsUrl, params: { cors: { origin } } }),
    () => doRequest(
        "fail origin cors GET request",
        { url: corsUrl, params: { cors: { origin: 'http://fail.domain' } } }),
    () => doRequest(
        "pass remote POST request",
        { url: corsUrl, method: 'POST', params: { cors: { origin, methods: "POST" } } }),
    () => doRequest(
        "pass remote DELETE request",
        { url: corsUrl, method: 'DELETE', params: { cors: { origin, methods: "DELETE" } } }),
    () => doRequest(
        "fail remote DELETE request",
        { url: corsUrl, method: 'DELETE', params: { cors: { origin } } }),
    //*/

    // headers
    () => doRequest(
        "pass remote request with Header",
        { url: corsUrl, headers: { 'X-Test-Header': 'test' }, params: { cors: { origin, headers: 'X-Test-Header' } } }),
    () => doRequest(
        "pass with custom Accept header",
        { url: corsUrl, headers: { 'Accept': 'Margarine' }, params: { cors: { origin, headers: 'Accept' } } }),
    () => doRequest(
        "fail remote request with unknown Header",
        { url: corsUrl, headers: { 'X-Test-Header': 'test' }, params: { cors: { origin, headers: 'X-Test-Header-2' } } }),
    () => doRequest(
        "fail remote request with no header cors",
        { url: corsUrl, headers: { 'X-Test-Header': 'test' }, params: { cors: { origin } } }),
    //*/

    // withCredentials
    () => doRequest(
        "pass remote request with credentials",
        { url: corsUrl, withCredentials: true, params: { cors: { origin, allowCredentials: true } } }),
    () => doRequest(
        "fail remote request with credentials",
        { url: corsUrl, withCredentials: true, params: { cors: { origin } } }),
    //*/

    () => doRequest("pass all features combined",
        {
            url: corsUrl,
            method: 'PUT',
            headers: { 'X-Test-Header': 'test' },
            withCredentials: true,
            params: {
                cors: {
                    origin,
                    methods: "PUT",
                    headers: 'X-Test-Header',
                    allowCredentials: true,
                }
            }
        })
);
