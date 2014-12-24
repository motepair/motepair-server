/* istanbul ignore next */
describe('access-control', function () {
  'use strict';

  var request = require('request')
    , access = require('./')
    , http = require('http')
    , chai = require('chai')
    , expect = chai.expect
    , server
    , cors;

  chai.config.includeStack = true;

  //
  // Port number for the HTTP server;
  //
  var port = 1024;

  afterEach(function (next) {
    if (!server) return next();

    server.close();
    next();
  });

  it('exposes itself as an function', function () {
    expect(access).to.be.a('function');
  });

  it('returns a function after configuring', function () {
    expect(access()).to.be.a('function');
  });

  it('does not send Access-* headers if the origin header is missing', function (next) {
    cors = access();

    server = http.createServer(function (req, res) {
      if (cors(req, res)) return;

      res.end('foo');
    }).listen(++port, function listening() {
      request('http://localhost:'+ port, function (err, res, body) {
        if (err) return next(err);

        expect(body).to.equal('foo');
        expect(res.headers).to.not.have.property('access-control-allow-origin');

        next();
      });
    });
  });

  it('accepts empty origin headers which are sent when using data uris');

  it('sets the origin to the Origin header for GET requests with credentials', function (next) {
    cors = access();

    server = http.createServer(function (req, res) {
      if (cors(req, res)) return;

      res.end('foo');
    }).listen(++port, function listening() {
      var origin = 'http://example.com';

      request({
        uri: 'http://localhost:'+ port,
        headers: {
          Origin: origin,
          Cookie: 'foo=bar'
        },
        method: 'GET'
      }, function (err, res, body) {
        if (err) return next(err);

        expect(body).to.equal('foo');
        expect(res.headers['access-control-allow-origin']).to.equal(origin);
        expect(res.headers['access-control-allow-credentials']).to.equal('true');

        next();
      });
    });
  });

  it('optionally sets the exposed header', function (next) {
    cors = access({
      exposed: 'Content-Length'
    });

    server = http.createServer(function (req, res) {
      if (cors(req, res)) return;

      res.end('foo');
    }).listen(++port, function listening() {
      var origin = 'http://example.com';

      request({
        uri: 'http://localhost:'+ port,
        headers: {
          Origin: origin,
          Cookie: 'foo=bar'
        },
        method: 'GET'
      }, function (err, res, body) {
        if (err) return next(err);

        expect(body).to.equal('foo');
        expect(res.headers['access-control-allow-origin']).to.equal(origin);
        expect(res.headers['access-control-expose-headers']).to.equal('Content-Length');

        next();
      });
    });
  });

  describe('middleware', function () {
    it('calls the completion callback when no origin is set', function (next) {
      cors = access();

      server = http.createServer(function (req, res) {
        cors(req, res, function next() {
          res.end('foo');
        });
      }).listen(++port, function listening() {
        request('http://localhost:'+ port, function (err, res, body) {
          if (err) return next(err);

          expect(body).to.equal('foo');
          expect(res.headers).to.not.have.property('access-control-allow-origin');

          next();
        });
      });
    });

    it('calls the completion callback when a origin is set', function (next) {
      cors = access();

      server = http.createServer(function (req, res) {
        cors(req, res, function () {
          res.end('foo');
        });
      }).listen(++port, function listening() {
        request({
          uri: 'http://localhost:'+ port,
          headers: {
            Origin: 'http://google.com',
          },
          method: 'GET'
        }, function (err, res, body) {
          if (err) return next(err);

          expect(body).to.equal('foo');
          expect(res.headers['access-control-allow-origin']).to.equal('http://google.com');
          expect(res.headers['access-control-allow-credentials']).to.equal('true');

          next();
        });
      });
    });

    it('does not call the callback for preflight requests', function (next) {
      cors = access({ credentials: false });

      server = http.createServer(function (req, res) {
        cors(req, res, function () {
          res.statusCode = 404;
          res.end('foo');

          throw new Error('This should fail hard');
        });
      }).listen(++port, function listening() {
        request({
          uri: 'http://localhost:'+ port,
          method: 'OPTIONS',
          headers: {
            Origin: 'http://example.com',
            'Access-Control-Request-Method': 'PUT'
          }
        }, function (err, res, body) {
          if (err) return next(err);

          expect(res.statusCode).to.equal(200);
          expect(res.headers['access-control-allow-origin']).to.equal('*');

          next();
        });
      });
    });
  });

  describe('preflight', function () {
    it('contains the Access-Control-Allow-Origin header', function (next) {
      cors = access({ credentials: false });

      server = http.createServer(function (req, res) {
        if (cors(req, res)) return;

        res.statusCode = 404;
        res.end('foo');
      }).listen(++port, function listening() {
        request({
          uri: 'http://localhost:'+ port,
          method: 'OPTIONS',
          headers: {
            Origin: 'http://example.com',
            'Access-Control-Request-Method': 'PUT'
          }
        }, function (err, res, body) {
          if (err) return next(err);

          expect(res.statusCode).to.equal(200);
          expect(res.headers['access-control-allow-origin']).to.equal('*');

          next();
        });
      });
    });

    it('answers only if the Access-Control-Request-Method header is set', function (next) {
      cors = access();

      server = http.createServer(function (req, res) {
        expect(cors(req, res)).to.equal(false);

        res.statusCode = 404;
        res.end('foo');
      }).listen(++port, function listening() {
        request({
          uri: 'http://localhost:'+ port,
          method: 'OPTIONS',
          headers: {
            Origin: 'http://example.com',
          }
        }, function (err, res, body) {
          if (err) return next(err);

          expect(res.statusCode).to.equal(404);
          expect(body).to.equal('foo');

          next();
        });
      });
    });

    it('optionally adds the Access-Control-Max-Age header', function (next) {
      cors = access({ maxAge: '1 day' });

      server = http.createServer(function (req, res) {
        if (cors(req, res)) return;

        res.statusCode = 404;
        res.end('foo');
      }).listen(++port, function listening() {
        request({
          uri: 'http://localhost:'+ port,
          method: 'OPTIONS',
          headers: {
            Origin: 'http://example.com',
            'Access-Control-Request-Method': 'PUT'
          }
        }, function (err, res, body) {
          if (err) return next(err);

          expect(res.statusCode).to.equal(200);
          expect(res.headers['access-control-max-age']).to.equal('86400');

          next();
        });
      });
    });

    it('optionally adds the Access-Control-Allow-Headers header', function (next) {
      cors = access({ headers: ['Content-Length', 'User-Agent'] });

      server = http.createServer(function (req, res) {
        if (cors(req, res)) return;

        res.statusCode = 404;
        res.end('foo');
      }).listen(++port, function listening() {
        request({
          uri: 'http://localhost:'+ port,
          method: 'OPTIONS',
          headers: {
            Origin: 'http://example.com',
            'Access-Control-Request-Method': 'PUT'
          }
        }, function (err, res, body) {
          if (err) return next(err);

          expect(res.statusCode).to.equal(200);
          expect(res.headers['access-control-allow-headers']).to.equal('Content-Length, User-Agent');

          next();
        });
      });
    });

    it('optionally adds the Access-Control-Allow-Methods header', function (next) {
      cors = access({ methods: ['PUT', 'OPTIONS'] });

      server = http.createServer(function (req, res) {
        if (cors(req, res)) return;

        res.statusCode = 404;
        res.end('foo');
      }).listen(++port, function listening() {
        request({
          uri: 'http://localhost:'+ port,
          method: 'OPTIONS',
          headers: {
            Origin: 'http://example.com',
            'Access-Control-Request-Method': 'PUT'
          }
        }, function (err, res, body) {
          if (err) return next(err);

          expect(res.statusCode).to.equal(200);
          expect(res.headers['access-control-allow-methods']).to.equal('PUT, OPTIONS');

          next();
        });
      });
    });

    it('optionally adds the Access-Control-Allow-Headers header', function (next) {
      cors = access();

      server = http.createServer(function (req, res) {
        if (cors(req, res)) return;

        res.statusCode = 404;
        res.end('foo');
      }).listen(++port, function listening() {
        request({
          uri: 'http://localhost:'+ port,
          method: 'OPTIONS',
          headers: {
            Origin: 'http://example.com',
            'Access-Control-Request-Method': 'PUT',
            'Access-Control-Request-Headers': 'X-Requested-With'
          }
        }, function (err, res, body) {
          if (err) return next(err);

          expect(res.statusCode).to.equal(200);
          expect(res.headers['access-control-allow-headers']).to.equal('X-Requested-With');

          next();
        });
      });
    });

    it('returns true when it handled the request', function (next) {
      cors = access();

      server = http.createServer(function (req, res) {
        expect(cors(req, res)).to.equal(true);

        res.statusCode = 404;
        res.end('foo');
      }).listen(++port, function listening() {
        request({
          uri: 'http://localhost:'+ port,
          method: 'OPTIONS',
          headers: {
            Origin: 'http://example.com',
            'Access-Control-Request-Method': 'PUT'
          }
        }, function (err, res, body) {
          if (err) return next(err);

          expect(body).to.equal('');
          expect(+res.headers['content-length']).to.equal(0);

          next();
        });
      });
    });

    it('answers with a 200 OK', function (next) {
      cors = access();

      server = http.createServer(function (req, res) {
        if (cors(req, res)) return;

        res.statusCode = 404;
        res.end('foo');
      }).listen(++port, function listening() {
        request({
          uri: 'http://localhost:'+ port,
          method: 'OPTIONS',
          headers: {
            Origin: 'http://example.com',
            'Access-Control-Request-Method': 'PUT'
          }
        }, function (err, res, body) {
          if (err) return next(err);

          expect(res.statusCode).to.equal(200);
          next();
        });
      });
    });
  });

  describe('validation', function () {
    it('only allows valid origin headers', function (next) {
      cors = access();

      server = http.createServer(function (req, res) {
        if (cors(req, res)) return;

        res.end('foo');
      }).listen(++port, function listening() {
        request({
          uri: 'http://localhost:'+ port,
          headers: {
            Origin: 'http://example.com%'
          },
          method: 'GET'
        }, function (err, res, body) {
          if (err) return next(err);
          expect(res.statusCode).to.equal(403);

          request({
            uri: 'http://localhost:'+ port,
            headers: {
              Origin: 'example.co'
            },
            method: 'GET'
          }, function (err, res, body) {
            if (err) return next(err);

            expect(res.statusCode).to.equal(403);

            request({
              uri: 'http://localhost:'+ port,
              headers: {
                Origin: ''
              },
              method: 'GET'
            }, function (err, res, body) {
              if (err) return next(err);

              expect(res.statusCode).to.equal(403);

              next();
            });
          });
        });
      });
    });

    it('only accepts allowed origin headers', function (next) {
      cors = access({
        origins: 'http://example.com',
        credentials: false
      });

      server = http.createServer(function (req, res) {
        if (cors(req, res)) return;

        res.end('foo');
      }).listen(++port, function listening() {
        request({
          uri: 'http://localhost:'+ port,
          headers: {
            Origin: 'http://example.com'
          },
          method: 'GET'
        }, function (err, res, body) {
          if (err) return next(err);

          expect(body).to.equal('foo');
          expect(res.statusCode).to.equal(200);
          expect(res.headers['access-control-allow-origin']).to.equal('http://example.com');
          expect(res.headers.vary).to.equal('Origin');

          request({
            uri: 'http://localhost:'+ port,
            headers: {
              Origin: 'http://example.co'
            },
            method: 'GET'
          }, function (err, res, body) {
            if (err) return next(err);

            expect(res.statusCode).to.equal(403);
            expect(res.headers).to.not.have.property('access-control-allow-origin');

            next();
          });
        });
      });
    });

    it('only accepts allowed methods', function (next) {
      cors = access({
        methods: ['GET', 'OPTIONS'],
        credentials: false
      });

      server = http.createServer(function (req, res) {
        if (cors(req, res)) return;

        res.end('foo');
      }).listen(++port, function listening() {
        request({
          uri: 'http://localhost:'+ port,
          headers: {
            Origin: 'http://example.com'
          },
          method: 'GET'
        }, function (err, res, body) {
          if (err) return next(err);

          expect(body).to.equal('foo');
          expect(res.statusCode).to.equal(200);
          expect(res.headers['access-control-allow-origin']).to.equal('*');

          request({
            uri: 'http://localhost:'+ port,
            headers: {
              Origin: 'http://example.com'
            },
            method: 'POST',
            json: { foo: 'bar' }
          }, function (err, res, body) {
            if (err) return next(err);

            expect(res.statusCode).to.equal(403);
            expect(res.headers).to.not.have.property('access-control-allow-origin');

            next();
          });
        });
      });
    });

    it('allows Origin: null', function (next) {
      cors = access();

      server = http.createServer(function (req, res) {
        if (cors(req, res)) return;

        res.end('foo');
      }).listen(++port, function listening() {
        request({
          uri: 'http://localhost:'+ port,
          headers: {
            Origin: 'null'
          },
          method: 'GET'
        }, function (err, res, body) {
          if (err) return next(err);

          expect(body).to.equal('foo');
          expect(res.statusCode).to.equal(200);
          expect(res.headers['access-control-allow-origin']).to.equal('null');
          expect(res.headers.vary).to.equal('Origin');

          next();
        });
      });
    });

    it('only accepts allowed headers');

    it('returns true when invalid requests are handled', function (next) {
      cors = access({
        methods: ['POST']
      });

      server = http.createServer(function (req, res) {
        expect(cors(req, res)).to.equal(true);
        res.end('foo');
      }).listen(++port, function listening() {
        request({
          uri: 'http://localhost:'+ port,
          headers: {
            Origin: 'http://example.com'
          },
          method: 'GET'
        }, function (err, res, body) {
          expect(res.statusCode).to.equal(403);
          next();
        });
      });
    });
  });
});
