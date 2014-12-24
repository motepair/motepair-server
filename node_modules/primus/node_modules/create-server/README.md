# create-server

[![Build Status](https://travis-ci.org/primus/create-server.svg?branch=master)](https://travis-ci.org/primus/create-server)
[![NPM version](https://badge.fury.io/js/create-server.svg)](http://badge.fury.io/js/create-server)
[![Coverage Status](https://img.shields.io/coveralls/primus/create-server.svg)](https://coveralls.io/r/primus/create-server?branch=master)

I've found my self writing this particular piece of snippet over and over again.
If you need to have a common API for creating a HTTP, HTTPS or SPDY server this
might be the module that you've been waiting for.

## Installation

Add it to your Node.js project by running

```
npm install --save create-server
```

## Creating a server

In all code examples we assume that you've required the module and saved it as
the `create` variable:

```js
'use strict';

var create = require('create-server');
```

The `create` variable is now a function which can be used to create different
types of servers. The function accepts 2 different arguments:

1. A number which should be the port number or object with the configuration for
   the servers.
2. Optionally, an object with different callback methods.

The following properties can be configured:

- **port**: The port number we should listen on. Also used to determine which
  type of server we need to create.
- **spdy**: Create SPDY server instead of a HTTPS server.
- **root**: The root folder that contains your HTTPS certs.
- **key, cert, ca, pfx, crl** Path or array of paths which will be read out the
  correct files. The path should be relative to the **root** option.
- **redirect**: Start up an optional HTTP server who will redirect users to the
  port you're listening on. The supplied value should be the port number we need
  to listen on.
- **listen**: Do need to start listening to the server for you?

The following properties can be provided as callback object:

- **close**: Server is closed.
- **request**: Received a new incoming request.
- **upgrade**: Received a HTTP upgrade request.
- **listening**: We're now listening. Receives an optional error as first
  argument.
- **error**: Received a new error on the server.
- **https**: A new HTTPS server has been created.
- **http**: A new HTTP server has been created.
- **spdy**: A new SPDY server has been created.

## License

MIT
