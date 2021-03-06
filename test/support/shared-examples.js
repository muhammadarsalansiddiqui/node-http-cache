/*
 * node-http-cache.
 * Copyright © 2012 Chris Corbyn.
 *
 * See LICENSE file for details.
 */

var helper    = require('../test-helper')
  , httpCache = helper.httpCache
  , http      = require('http')
  , assert    = require('assert')
  , sinon     = helper.sinon
  , memo      = helper.memo
  ;

/**
 * Shared behaviour specs for all Storage implementations.
 */
exports.behavesLikeACacheStorage = function(storage) {
  describe('on "request" event', function(){
    var method  = memo().is(function(){ return 'GET' });
    var headers = memo().is(function(){ return {} });

    var req = memo().is(function(){
      return helper.createRequest({
        method:  method(),
        headers: headers()
      });
    });

    var res = memo().is(function(){
      return helper.createResponse(req());
    });

    var evaluator = memo().is(function(){
      return new httpCache.RequestEvaluationContext(req());
    });

    beforeEach(function(){
      storage().emit('request', req(), res(), evaluator());
    });

    context('without user-defined listeners', function(){
      /* RFC 2616 Section 13.9 & 13.10 */
      context('given a GET request', function(){
        method.is(function(){ return 'GET' });

        it('evaluates as storable', function(){
          assert(evaluator().storable);
        });

        it('evaluates as retrievable', function(){
          assert(evaluator().retrievable);
        });
      });

      /* RFC 2616 Section 13.9 & 13.10 */
      context('given a HEAD request', function(){
        method.is(function(){ return 'HEAD' });

        it('evaluates as storable', function(){
          assert(evaluator().storable);
        });

        it('evaluates as retrievable', function(){
          assert(evaluator().retrievable);
        });
      });

      /* RFC 2616 Section 13.1.6 */
      context('with cache-control: max-age=0', function(){
        headers.is(function(){ return {'cache-control': 'max-age=0'} });

        it('evaluates as storable', function(){
          assert(evaluator().storable);
        });

        it('evaluates as not retrievable', function(){
          assert(!evaluator().retrievable);
        });
      });

      /* RFC 2616 Section 13.1.6 (logical, but not stated) */
      context('with cache-control: max-age < 0', function(){
        headers.is(function(){ return {'cache-control': 'max-age=-9999'} });

        it('evaluates as storable', function(){
          assert(evaluator().storable);
        });

        it('evaluates as not retrievable', function(){
          assert(!evaluator().retrievable);
        });
      });

      /* RFC 2616 Section 14.9 */
      context('with cache-control: no-cache', function(){
        headers.is(function(){ return {'cache-control': 'no-cache'} });

        it('evaluates as not storable', function(){
          assert(!evaluator().storable);
        });

        it('evaluates as not retrievable', function(){
          assert(!evaluator().retrievable);
        });
      });

      /* RFC 2616 Section 14.9 */
      context('with cache-control: no-store', function(){
        headers.is(function(){ return {'cache-control': 'no-store'} });

        it('evaluates as not storable', function(){
          assert(!evaluator().storable);
        });

        it('evaluates as not retrievable', function(){
          assert(!evaluator().retrievable);
        });
      });

      /* RFC 2616 Section 14.9 */
      context('with pragma: no-cache', function(){
        headers.is(function(){ return {'pragma': 'no-cache'} });

        it('evaluates as not storable', function(){
          assert(!evaluator().storable);
        });

        it('evaluates as not retrievable', function(){
          assert(!evaluator().retrievable);
        });
      });
    });

    context('with a user-defined listener', function(){
      var flag = memo().is(function(){ return; });

      context('that sets storable', function(){
        before(function(){
          storage().on('request', function(req, res, evaluation){
            evaluation.flagStorable(flag());
          });
        });

        describe('to false', function(){
          flag.is(function(){ return false; });

          it('evaluates as not storable', function(){
            assert(!evaluator().storable);
          });
        });

        describe('to true', function(){
          flag.is(function(){ return true; });

          it('evaluates as storable', function(){
            assert(evaluator().storable);
          });
        });
      });

      context('that sets retrievable', function(){
        before(function(){
          storage().on('request', function(req, res, evaluation){
            evaluation.flagRetrievable(flag());
          });
        });

        describe('to false', function(){
          flag.is(function(){ return false; });

          it('evaluates as not retrievable', function(){
            assert(!evaluator().retrievable);
          });
        });

        describe('to true', function(){
          flag.is(function(){ return true; });

          it('evaluates as retrievable', function(){
            assert(evaluator().retrievable);
          });
        });
      });
    });
  });

  describe('on "response" event', function(){
    var statusCode = memo().is(function(){ return 200 });
    var headers    = memo().is(function(){ return {} });

    var req = memo().is(function(){ return helper.createRequest() });
    var res = memo().is(function(){ return helper.createResponse(req()) });

    var evaluator = memo().is(function(){
      return new httpCache.ResponseEvaluationContext(
        res(), statusCode(), headers()
      );
    });

    beforeEach(function(){
      storage().emit('response', req(), res(), evaluator());
    });

    context('without user-defined listeners', function(){
      /* RFC 2616 Section 14.9 */
      context('with cache-control: private', function(){
        headers.is(function(){ return {'cache-control':'private, max-age=60'} });

        it('evaluates as not storable', function(){
          assert(!evaluator().storable);
        });
      });

      /* RFC 2616 Section 14.9 */
      context('with cache-control: no-cache', function(){
        headers.is(function(){ return {'cache-control':'no-cache'} });

        it('evaluates as not storable', function(){
          assert(!evaluator().storable);
        });
      });

      /* RFC 2616 Section 14.9 */
      context('with cache-control: max-age=60', function(){
        headers.is(function(){ return {'cache-control':'max-age=60'} });

        it('evaluates as storable', function(){
          assert(evaluator().storable);
        });
      });

      /* RFC 2616 Section 14.9 */
      context('with cache-control: max-age=0', function(){
        headers.is(function(){ return {'cache-control':'max-age=0'} });

        it('evaluates as not storable', function(){
          assert(!evaluator().storable);
        });
      });

      /* RFC 2616 Section 14.9 */
      context('with cache-control: max-age=-60', function(){
        headers.is(function(){ return {'cache-control':'max-age=-60'} });

        it('evaluates as not storable', function(){
          assert(!evaluator().storable);
        });
      });

      /* RFC 2616 Section 14.9 */
      context('with cache-control: no-cache="x-something", max-age=60', function(){
        headers.is(function(){ return {'cache-control':'no-cache="x-something", max-age=60'} });

        it('evaluates as storable', function(){
          assert(evaluator().storable);
        });
      });

      /* RFC 2616 Section 13.4 */
      context('with a 302 status code', function(){
        statusCode.is(function(){ return 302 });

        it('evaluates as not storable', function(){
          assert(!evaluator().storable);
        });
      });

      /* RFC 2616 Section 13.4 */
      context('with a 404 status code', function(){
        statusCode.is(function(){ return 404 });

        it('evaluates as not storable', function(){
          assert(!evaluator().storable);
        });
      });

      /* RFC 2616 Section 13.4 */
      context('with a 500 status code', function(){
        statusCode.is(function(){ return 500 });

        it('evaluates as not storable', function(){
          assert(!evaluator().storable);
        });
      });

      /* note that caches MAY store 200, 203, 206, 300, 301, 401 even without
         cache-control headers, but node-http-cache chooses not to do this */

      /* RFC 2616 Section 13.3.1 */
      context('with last-modified: anything-at-all', function(){
        headers.is(function(){ return {'last-modified':'anything-at-all'} });

        it('evaluates as storable', function(){
          assert(evaluator().storable);
        });
      });

      /* RFC 2616 Section 13.3.2 */
      context('with etag: anything-at-all', function(){
        headers.is(function(){ return {'etag':'anything-at-all'} });

        it('evaluates as storable', function(){
          assert(evaluator().storable);
        });
      });
    });
  });
};
