'use strict';

const http    = require('http');
const url     = require('url');
const query   = require('querystring');
const fs      = require('fs');
const statics = require('serve-static');
const request = require('request');

const serve = statics('client');

const formatRes = (res1, res2) => {
  return {
    first: {
      body: res1.body,
      type: res1.headers['content-type'],
      headers: res1.headers,
      status: res1.statusCode
    },
    second: {
      body: res2.body,
      type: res2.headers['content-type'],
      headers: res2.headers,
      status: res2.statusCode
    }
  };
};

/**
 * Request two URLs and return bundle response
 */

const proxy = (q, cb) => {
  console.log(q);
  request(q.url1, (err, res1) => {
    request(q.url2, (err, res2) => {
      let msg = formatRes(res1, res2);
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
    res.writeHead(200, 'Content-Type: application/json');
    var params = query.parse(parsedUrl.query);
    proxy(params, (err, msg) => {
      return res.end(JSON.stringify(msg));
    });
  }
  else {
    console.log(parsedUrl.path);
    serve(req, res, (req, res) => {
      return res.end();
    });
  }
};

/**
 * Start server
 */

const server = http.createServer(handler);
server.listen(parseInt(process.env.PORT) || 8000, () => {
  console.log('   server started');
});
