/*
 * node-http-cache.
 * Copyright © 2012 Chris Corbyn.
 *
 * See LICENSE file for details.
 */

var helper    = require('./test-helper')
  , httpCache = helper.httpCache
  , http      = require('http')
  , assert    = require('assert')
  ;

describe('http-cache', function(){
  describe('#createServer()', function(){
    function request(method, url, headers){
      var req = new http.IncomingMessage();

      req.method      = method  || 'GET';
      req.url         = url     || '/';
      req.headers     = headers || {};
      req.httpVersion = '1.1';

      return req;
    };

    function response(req){
      return new http.ServerResponse(req);
    };

    describe('with a callback', function(){
      function server(){
        return httpCache.createServer(function(req, res){
          res.setHeader('X-Foo', 'bar');
        });
      };

      it('returns a http.Server', function(){
        assert.ok(server() instanceof http.Server);
      });

      describe('when executed', function(){
        var req = request()
          , res = response(req)
          ;

        beforeEach(function(){
          server().emit('request', req, res);
        });

        it('invokes the callback', function(){
          assert.equal(res.getHeader('X-Foo'), 'bar');
        });
      });
    });
  });
});