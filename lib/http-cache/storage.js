/*
 * node-http-cache.
 * Copyright © 2012 Chris Corbyn.
 *
 * See LICENSE file for details.
 */

var util         = require('util')
  , EventEmitter = require('events').EventEmitter
  , context      = require('./evaluation-context')
  , validators   = require('./validators')
  ;

/**
 * Get an in-memory cache with sensible defaults.
 */
var defaultStorage = exports.defaultStorage = function() {
  return new exports.MemoryStorage({ memLimit: 512 });
};

/**
 * Initialize a new Storage.
 *
 * @param [Object] options
 *   a JSON object providing basic config.
 */
function Storage(options) {
  this.options = options || {};
}

util.inherits(Storage, EventEmitter);

exports.Storage = Storage;

/**
 * Convenience method to be used as a guard in a [http.Server] handler.
 *
 * @example
 *   var storage = httpCache.storage.defaultStorage();
 *   http.createServer(function(req, res) {
 *     if (!storage.handleRequest(req, res)) {
 *       // actually handle the request
 *     }
 *   });
 *
 * If no cached resource was served, the response is patched to cache the
 * data as it is served, if needed.
 *
 * @param [http.ServerRequest] req
 *   the request to be handled
 *
 * @param [http.ServerResponse] res
 *   the response to serve
 *
 * @return [Boolean]
 *   true if a cached resource was served
 */
Storage.prototype.handleRequest = function(req, res) {
  var evaluator = new context.RequestEvaluationContext(req);

  this.emit('request', req, res, evaluator);
  if (!!evaluator.cacheable) {
    if (this.serveCached(req, res)) {
      return true;
    } else {
      this.prepareWrappers(req, res);
    }
  }

  return false;
};

/**
 * Serve a cached resource matching this request.
 *
 * Returns true if a resource was served, or false otherwise.
 *
 * @param [http.ServerRequest] req
 *   the request to serve
 *
 * @param [http.ServerResponse] res
 *   the current, unmodified response
 *
 * @return [Boolean]
 *   true if a cached resource was served
 */
Storage.prototype.serveCached = function(req, res) {
  return false;
};

/**
 * Patch the response in order to store data, if cacheable.
 *
 * This method overrides the writeHead(), write() and end() methods.
 *
 * @param [http.ServerRequest] req
 *   the incoming request
 *
 * @param [http.ServerResponse] res
 *   the response that will be served
 */
Storage.prototype.prepareWrappers = function(req, res) {
};

/**
 * Overriden emit() to run built-in listeners after custom ones.
 */
Storage.prototype.emit = function(event) {
  if (event == 'request') {
    this._addDefaultRequestListeners();
  } else if (event == 'response') {
    this._addDefaultResponseListeners();
  }

  return EventEmitter.prototype.emit.apply(this, arguments);
};

/* -- Private Methods -- */


Storage.prototype._addDefaultRequestListeners = function() {
  var self = this;
  validators.requestValidators.forEach(function(fn){
    self.once('request', fn);
  });
};

Storage.prototype._addDefaultResponseListeners = function() {
  var self = this;
  validators.responseValidators.forEach(function(fn){
    self.once('response', fn);
  });
};

/* -- Component exports -- */

exports.MemoryStorage = require('./storage/memory');
