describe('forwarded-for', function () {
  'use strict';

  var assume = require('assume')
    , parser = require('./');

  it('is exposed as function', function () {
    assume(parser).is.a('function');
  });

  it('exposes the proxy array', function () {
    assume(parser.proxies).to.be.a('array');
  });

  it('exposes the Forwarded class', function () {
    assume(parser.Forwarded).to.be.a('function');
  });

  it('sorts the proxy array and sets the last match as first item', function () {
    var last = parser.proxies[parser.proxies.length - 1]
      , spec = { ip: '222.1.2.242', port: '4900', proto: 'https' };

    assume(parser.proxies[0].ip).to.not.equal(last.ip);

    var forwarded = parser({
      remoteAddress: '127.1.2.0',
      remotePort: 490
    }, Object.keys(spec).reduce(function reduce(headers, key) {
      headers[last[key]] = spec[key];
      return headers;
    }, {}));

    assume(parser.proxies[0].ip).to.equal(last.ip);
    assume(forwarded.ip).to.equal('222.1.2.242');
    assume(forwarded.port).to.equal(4900);
    assume(forwarded.secure).to.equal(true);
  });

  it('extracts the `remoteAdress` and port from the given object', function() {
    var forwarded = parser({
      remoteAddress: '222.1.2.242',
      remotePort: 490
    });

    assume(forwarded.ip).to.equal('222.1.2.242');
    assume(forwarded.port).to.equal(490);
    assume(forwarded.secure).to.equal(false);
  });

  it('`encrypted` is used to check connection is secure', function () {
    var forwarded = parser({
      remoteAddress: '222.1.2.242',
      remotePort: 490,
      encrypted: true
    });

    assume(forwarded.ip).to.equal('222.1.2.242');
    assume(forwarded.port).to.equal(490);
    assume(forwarded.secure).to.equal(true);
  });

  it('prefers the x-forwarded-* headers over the supplied object', function () {
    var forwarded = parser({
      remoteAddress: '127.1.2.0',
      remotePort: 490
    }, {
      'x-forwarded-for': '72.1.80.224',
      'x-forwarded-port': '9093',
      'x-forwarded-proto': 'https'
    });

    assume(forwarded.ip).to.equal('72.1.80.224');
    assume(forwarded.port).to.equal(9093);
    assume(forwarded.secure).to.equal(true);
  });

  it('works when shuffling the proxies array', function() {
    var i = 0, forwarded, hs = [
      {headers: {'fastly-client-ip': '1.2.3.4'}, expected: '1.2.3.4'},
      {headers: {'x-forwarded-for': '9.9.9.9'}, expected: '9.9.9.9'},
      {headers: {'forwarded': '3.4.5.6'}, expected: '3.4.5.6'},
      {headers: {'x-real-ip': '7.8.9.10'}, expected: '7.8.9.10'},
    ];

    // Fisher-Yates shuffle
    function shuffle(o){ //v1.0
        for (var j, x, i = o.length; i;
          j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
    }

    for (; i < 8; i++) {
      hs = shuffle(hs);
      hs.forEach(function(v) {
        forwarded = parser({}, v.headers);
        assume(forwarded.ip).to.equal(v.expected);
      });
    }
  });

  describe('fastly.com', function () {
    it('extracts information from fastly headers', function () {
      var forwarded = parser({}, {
        'fastly-client-ip': '1.2.3.4',
        'fastly-ssl': '1'
      });

      assume(forwarded.ip).to.equal('1.2.3.4');
      assume(forwarded.secure).to.equal(true);

      forwarded = parser({}, { 'fastly-client-ip': '1.2.3.4' });
      assume(forwarded.secure).to.equal(false);
    });
  });

  describe('zscaler', function () {
    it('extracts information from the zeus/zscaler headers', function () {
      var forwarded = parser({}, {
        'z-forwarded-for': '1.2.3.4'
      });

      assume(forwarded.ip).to.equal('1.2.3.4');
    });
  });

  describe('socket.io', function () {
    //
    // Copy of the data structure that Socket.IO 0.9 supplies to the user during
    // authorization and which is available as `socket.handshake`
    //
    var handshakeData ={
        headers: {}
      , address: {
          address: '1.2.3.4',
          port: 1234
        }
      , time: (new Date()).toString()
      , query: { query: 'string' }
      , url: '/socket.io/1/websocket'
      , xdomain: false
      , secure: true
      , issued: Date.now()
    };

    it('extracts the data from the handshake', function () {
      var forwarded = parser(handshakeData, {});

      assume(forwarded.ip).to.equal('1.2.3.4');
      assume(forwarded.port).to.equal(1234);
      assume(forwarded.secure).to.equal(true);
    });
  });

  describe('sockjs', function () {
    var socket = {
      _session: {
        session_id: undefined,
        heartbeat_delay: 25000,
        disconnect_delay: 5000,
        prefix: '/primus(?:[^/]+)?',
        send_buffer: [],
        is_closing: false,
        readyState: 1,
        timeout_cb: [Function],
        to_tref:{
          _idleTimeout: 25000,
          _idlePrev: [Object],
          _idleNext: [Object],
          _idleStart: 1408442593896,
          _onTimeout: [Function],
          _repeat: false
        },
        connection: [socket],
        emit_open: null,
        recv: {
          ws: [Object],
          connection: [Object],
          thingy: [Object],
          thingy_end_cb: [Function],
          session: [socket]
        }
      },
      id: 'b44a71e0-3f95-42c6-a04e-648ea2db8ae4',
      headers: { via: null, host: 'localhost:1113' },
      prefix: '/primus(?:[^/]+)?',
      remoteAddress: '1.2.3.4',
      remotePort: 62191,
      address: { address: '127.0.0.1', family: 'IPv4', port: 1113 },
      url: '/primus/139/3v_ublnj/websocket',
      pathname: '/primus/139/3v_ublnj/websocket',
      protocol: 'websocket'
    };

    it('extracts the data from the socket', function () {
      var forwarded = parser(socket, {});

      assume(forwarded.ip).to.equal('1.2.3.4');
      assume(forwarded.port).to.equal(62191);
      assume(forwarded.secure).to.equal(false);
    });
  });
});
