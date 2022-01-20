const express = require('express')
const app = express()
const path = require('path')

// https://stackoverflow.com/questions/22632593/how-to-disable-webpage-caching-in-expressjs-nodejs
app.set('etag', false)
app.set('Cache-Control', 'no-store')

app.use((req, res, next) => {

    // https://stackoverflow.com/questions/18740504/removing-all-headers-from-express-js
    res.removeHeader("x-powered-by");
    res.removeHeader("set-cookie");
    res.removeHeader("Date");
    res.removeHeader("Connection");

    // next!
    next();
})
app.use(express.static(path.join(__dirname, 'static')));

app.get('/', function (req, res) {
    res.send('Hello world.');
});

app.use('/test/:id', require('./routes/test'));

app.listen(process.env.PORT || 3000)
