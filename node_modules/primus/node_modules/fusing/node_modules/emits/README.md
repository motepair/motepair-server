# emits

[![Build Status](https://travis-ci.org/primus/emits.svg?branch=master)](https://travis-ci.org/primus/emits)
[![NPM version](https://badge.fury.io/js/emits.svg)](http://badge.fury.io/js/emits)
[![Coverage Status](https://img.shields.io/coveralls/primus/emits.svg)](https://coveralls.io/r/primus/emits?branch=master)

## Installation

This module is compatible with browserify and node.js and is therefor release
through npm:

```
npm install --save emits
```

## Usage

In all examples we assume that you've assigned the `emits` function to the
prototype of your class. This class should inherit from an `EventEmitter` class
which uses the `emit` function to emit events and the `listeners` method to list
the listeners for a given event. For example:

```js
'use strict';

var EventEmitter = require('events').EventEmitter
  , emits = require('emits');

function Example() {
  EventEmitter.call(this);
}

require('util').inherits(Example, EventEmitter);

//
// You can directly assign the function to the prototype if you wish or store it
// in a variable and then assign to the prototype. What pleases you more.
//
Example.prototype.emits = emits; // require('emits');

//
// Also initialize the example so we can use the assigned method.
//
var example = new Example();
```

Now that we've setup our example code we can finally demonstrate the beauty of
this functionality. To create a function that emits `data` we can simply do:

```js
var data = example.emits('data');
```

Every time you invoke the `data()` function it will emit the `data` event with
all the arguments you supplied. If you want "curry" some extra arguments you add
those after the event name:

```js
var data = example.emits('data', 'foo');
```

Now when you call `data()` the `data` event will receive `foo` as first argument
and the rest of the arguments would be the once that you've supplied the
`data()` function.

If you supply a function as last argument we assume that this is an argument
parser so you can modify arguments, prevent the emit of the event or just clear
all supplied arguments (except for the once that are curried in).

```js
var data = example.emits('data', function parser(arg) {
  return 'bar';
})
```

In the example above we've have transformed the incoming argument to `bar`. So
when call `data()` it will emit a `data` event with `bar` as only argument.

To prevent the emitting from happening you need to return the `parser` function
that you supplied. This is the only reliable way to determine if we need to
prevent an emit:

```js
var data = example.emits('data', function parser() {
  return parser;
});
```

If you return `undefined` from parser we assume that no modification have been
made to the arguments and we should emit our received arguments. If `null` is
returned function we assume that all received arguments should be removed.

### Patterns

One our most common patterns for this module is to proxy events from one
instance to another:

```js
eventemitter.on('data', example.emits('data'));
```

But also to re-format data so it becomes more usable. For example in the case of
WebSockets we don't want to reference `evt.data` every single time we just want
the data, so we can parse the argument as following:

```js
var ws = new WebSocket('wss://example.org/path');
ws.onmessage = example.emits('data', function parser(evt) {
  return evt.data;
});
```

In the example above we will now emit the `data` event with a direct reference
to `evt.data`. And as final example, you can also use it prevent events from
being emitted.

```js
var ws = new WebSocket('wss://example.org/path');
ws.onmessage = example.emits('data', function parser(evt) {
  var data;

  try { data = JSON.parse(evt.data); }
  catch (e) { return parser; }

  if ('object' !== typeof data || Array.isArray(data)) {
    return parser;
  }

  return data;
});
```

By returning a reference to the parser we tell the emits function that we should
prevent the emitting of the event. So the `data` event will only be fired if
we've received a valid JSON document from the server and it's an object.

## License

MIT
