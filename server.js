'use strict';

const http    = require('http');
const url     = require('url');
const query   = require('querystring');
const fs      = require('fs');
const statics = require('serve-static');
const request = require('request');

const req = request.defaults({ gzip: true });
const serve = statics('client');

/**
 * Extract important info from API response
 * and normalize field formats
 * @param  {Object} res1
 * @param  {Object} res2
 *   - res.body       - String
 *   - res.headers    - Object
 *   - res.statusCode - Number
 * @return {Object}
 */

const formatRes = (res1, res2) => {
  return {
    first: {
      body: res1.body,
      headers: JSON.stringify(res1.headers),
      status: res1.statusCode
    },
    second: {
      body: res2.body,
      headers: JSON.stringify(res2.headers),
      status: res2.statusCode
    }
  };
};

/**
 * Request two URLs and return bundle response
 */

const proxy = (q, cb) => {
  console.log(q);
  req(q.url1, (err1, res1) => {
    if (err1) return cb(err1);

    req(q.url2, (err2, res2) => {
      if (err2) return cb(err2);
      const msg = formatRes(res1, res2);
      console.log(msg);
      cb(null, msg);
    });
  });
};

/**
 * HTTP request handler
 */

const handler = (req, res) => {

  const parsedUrl = url.parse(req.url);

  if (parsedUrl.pathname === '/proxy') {
    const params = query.parse(parsedUrl.query);
    proxy(params, (err, msg) => {
      if (err) {
        console.error(err);
        res.writeHead(400, 'Content-Type: application/json');
        return res.end(err.message);
      }
      res.writeHead(200, 'Content-Type: application/json');
      res.end(JSON.stringify(msg));
    })
  }
  else {
    console.log(parsedUrl.path);
    serve(req, res, () => res.end());
  }
};

/**
 * Start server
 */

const server = http.createServer(handler);
server.listen(parseInt(process.env.PORT) || 8000, () => {
  console.log('   server started');
});
