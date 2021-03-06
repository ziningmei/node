'use strict';

const common = require('../common');
const http = require('http');
const assert = require('assert');

// Test that certain response header fields do not repeat.
// 'content-length' should also be in this list, but it needs
// a numeric value, so it's tested slightly differently.
const norepeat = [
  'content-type',
  'user-agent',
  'referer',
  'host',
  'authorization',
  'proxy-authorization',
  'if-modified-since',
  'if-unmodified-since',
  'from',
  'location',
  'max-forwards',
  'retry-after',
  'etag',
  'last-modified',
  'server',
  'age',
  'expires'
];

const server = http.createServer(function(req, res) {
  var num = req.headers['x-num'];
  if (num == 1) {
    res.setHeader('content-length', [1, 2]);
    for (const name of norepeat) {
      res.setHeader(name, ['A', 'B']);
    }
    res.setHeader('X-A', ['A', 'B']);
  } else if (num == 2) {
    const headers = {};
    headers['content-length'] = [1, 2];
    for (const name of norepeat) {
      headers[name] = ['A', 'B'];
    }
    headers['X-A'] = ['A', 'B'];
    res.writeHead(200, headers);
  }
  res.end('ok');
});

server.listen(common.PORT, common.mustCall(function() {
  var count = 0;
  for (let n = 1; n <= 2 ; n++) {
    // this runs twice, the first time, the server will use
    // setHeader, the second time it uses writeHead. The
    // result on the client side should be the same in
    // either case -- only the first instance of the header
    // value should be reported for the header fields listed
    // in the norepeat array.
    http.get(
      {port:common.PORT, headers:{'x-num': n}},
      common.mustCall(function(res) {
        if (++ count === 2) server.close();
        assert.equal(res.headers['content-length'], 1);
        for (const name of norepeat) {
          assert.equal(res.headers[name], 'A');
        }
        assert.equal(res.headers['x-a'], 'A, B');
      })
    );
  }
}));
