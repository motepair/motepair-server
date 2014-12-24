describe('create server', function () {
  'use strict';

  var request = require('request')
    , assume = require('assume')
    , create = require('../')
    , port = 1024
    , server;

  var https = require('https')
    , http = require('http')
    , spdy = require('spdy');

  afterEach(function (next) {
    if (!server) return next();

    try {
      server.close(function () {
        //
        // We can't use `server.close(next);` directly because in node > 0.10
        // the callback receives an error when the server is not running.
        //
        next();
      });
    } catch (e) {
      process.nextTick(next);
    }

    server = undefined;
  });

  it('is exported as a function', function () {
    assume(create).to.be.a('function');
  });

  it('creates a HTTP server that listens on the given port (number)', function (next) {
    server = create(++port, { listening: function (err) {
      if (err) return next(err);

      assume(server.address().port).to.equal(port);
      next();
    }});

    assume(server).to.be.instanceOf(http.Server);
  });

  it('creates a HTTP server that listens on the given port (object)', function (next) {
    server = create({ port: ++port }, { listening: function (err) {
      if (err) return next(err);

      assume(server.address().port).to.equal(port);
      next();
    }});

    assume(server).to.be.instanceOf(http.Server);
  });

  it('proxies errors to the listener', function (next) {
    server = create(80, { listening: function (err) {
      if (!err) throw new Error('Port 80 should be restricted, we are not root');

      next();
    }});
  });

  it('uses the provided event listeners and callbacks', function (next) {
    var complete = false;

    server = create({ port: ++port }, {
      close: next,
      http: function () {
        complete = true;
      },
      listening: function (err) {
        if (err) return next(err);

        assume(complete).to.equal(true);
        assume(server.address().port).to.equal(port);
        request('http://localhost:'+ port, function (err, res, body) {
          if (err) return next(err);

          assume(res.headers['content-type']).to.equal('text/plain');
          assume(body).to.equal('');
          server.close();
        });
      },
      request: function (req, res) {
        res.writeHead(200, {
          'Content-Length': 0,
          'Content-Type': 'text/plain'
        });
        res.end('');
      }
    });
  });

  it('allows the callback object to be merged with the options', function (next) {
    server = create({ port: ++port, listening: function (err) {
      if (err) return next(err);

      assume(server.address().port).to.equal(port);
      next();
    }});
  });

  it('allows to disable the automatic invocation of the listen method', function (next) {
    server = create({
      listen: false,
      port: ++port
    }, { listening: function () {
      assume(server.address().port).to.equal(port);

      server.close(function () {
        server = create({ listen: false, port: ++port });
        server.once('listening', function () {
          assume(server.address().port).to.equal(port);
          next();
        });

        server.listen(port);
      });
    }});

    server.listen(port);
  });

  it('throws an error if the required options for HTTPS are not provided', function (next) {
    try {
      server = create();
    } catch (err) {
      assume(err.message).to.contain('SSL key or certificate');
      next();
    }
  });

  it('creates a HTTPS server if the key and cert options are provided', function (next) {
    server = create({
      port: ++port,
      root: __dirname,
      cert: 'ssl/server.crt',
      key: 'ssl/server.key',
      listening: next
    });

    assume(server).to.be.instanceOf(https.Server);
  });

  it('creates a SPDY server if the spdy boolean option is set', function (next) {
    server = create({
      port: ++port,
      root: __dirname,
      cert: 'ssl/server.crt',
      key: 'ssl/server.key',
      spdy: true,
      listening: next
    });

    // spdy is spiced up HTTPS server
    assume(server).to.be.instanceOf(https.Server);
    assume(server).to.be.instanceOf(spdy.server.Server);
  });

  it('optionally creates a redirect server (HTTP to HTTPS)', function (next) {
    var redirect = ++port + 1;

    server = create({
      port: port,
      redirect: redirect,
      root: __dirname,
      ca: ['ssl/ca.crt'],
      cert: 'ssl/server.crt',
      key: 'ssl/server.key'
    }, function (err) {
      if (err) return next(err);

      assume(server.address().port).to.equal(port);
      request({
        uri: 'http://localhost:'+ redirect,
        followRedirect: false
      }, function (err, res, body) {
        if (err) return next(err);

        assume(res.headers.location).to.equal('https://localhost:'+ port +'/');
        assume(res.headers['strict-transport-security']).to.contain('max-age');
        assume(body).to.equal('');
        next();
      });
    });

    assume(server).to.be.instanceOf(https.Server);
  });

  it('optionally creates a redirect server (HTTP to HTTP)', function (next) {
    var redirect = ++port + 1;

    server = create({
      port: port,
      redirect: redirect
    }, function (err) {
      if (err) return next(err);

      assume(server.address().port).to.equal(port);
      request({
        uri: 'http://localhost:'+ redirect,
        followRedirect: false
      }, function (err, res, body) {
        if (err) return next(err);

        assume(res.headers.location).to.equal('http://localhost:'+ port +'/');
        assume(body).to.equal('');
        next();
      });
    });

    assume(server).to.be.instanceOf(http.Server);
  });
});
