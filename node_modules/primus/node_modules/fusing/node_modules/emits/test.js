/* istanbul ignore next */
describe('emits', function () {
  'use strict';

  var EventEmitter = require('events').EventEmitter
    , assume = require('assume')
    , emits = require('./')
    , example;

  function Example() {
    EventEmitter.call(this);
  }

  require('util').inherits(Example, EventEmitter);
  Example.prototype.emits = emits;

  beforeEach(function () {
    example = new Example();
  });

  it('is exported as a function', function () {
    assume(emits).is.a('function');
  });

  it('has the context of the prototype', function (next) {
    var fn = example.emits('data');

    example.on('data', function () {
      assume(this).equals(example);

      next();
    });

    assume(fn()).is.true();
  });

  it('merges the arguments', function (next) {
    var fn = example.emits('data', 'foo');

    example.on('data', function (foo, bar) {
      assume(foo).equals('foo');
      assume(bar).equals('bar');

      next();
    });

    assume(fn('bar')).is.true();
  });

  it('returns false if no listeners are present', function () {
    var fn = example.emits('data');
    assume(fn()).is.false();
  });

  it('returns false if the parser function is returned', function () {
    var fn = example.emits('data', function parser() {
      return parser;
    });

    example.on('data', function () {
      throw new Error('I should never be called');
    });

    assume(fn()).is.false();
  });

  it('returns only the supplied arguments when null is returned', function (next) {
    var fn = example.emits('data', 'bar', function () {
      return null;
    });

    example.on('data', function (bar, foo) {
      assume(foo).equals(undefined);
      assume(bar).equals('bar');

      next();
    });

    assume(fn('foo')).is.true();
  });

  it('returns all recieved arguments when undefined is returned', function (next) {
    var fn = example.emits('data', 'sup', function () {

    });

    example.on('data', function (sup, foo, bar) {
      assume('sup').equals(sup);
      assume(bar).equals('bar');
      assume(foo).equals('foo');

      next();
    });

    assume(fn('foo', 'bar')).is.true();
  });

  it('can modify the data', function (next) {
    var fn = example.emits('data', 'sup', function () {
      return 'bar';
    });

    example.on('data', function (sup, foo) {
      assume(sup).equals('sup');
      assume(foo).equals('bar');

      next();
    });

    assume(fn('foo')).is.true();
  });
});
