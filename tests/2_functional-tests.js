/* *
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!) */

'use strict'
var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  suite('GET /api/stock-prices => stockData object', function() {

    test('1 stock', function(done) {
      chai.request(server).get('/api/stock-prices').query({stock: 'goog'}).end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isObject(res.body, 'response should be an object');
        assert.property(res.body.stockData, 'ticker', 'stockData should contain ticker');
        assert.property(res.body.stockData, 'price', 'stockData should contain price');
        assert.property(res.body.stockData, 'likes', 'stockData should contain likes');
        assert.isString(res.body.stockData.ticker, 'ticker name should be a string');
        assert.isNumber(res.body.stockData.price, 'price should be a string');
        assert.isNumber(res.body.stockData.likes, 'likes should be a number');
        assert.equal(res.body.stockData.ticker, 'GOOG');
        assert.equal(res.body.stockData.likes, 0);
        done();
      });
    });

    test('1 stock with like', function(done) {
      chai.request(server).get('/api/stock-prices?stock=goog&like=true').end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isObject(res.body, 'response should be an object');
        assert.property(res.body, 'stockData', 'response should contain stockData');
        assert.isNumber(res.body.stockData.price);
        assert.equal(res.body.stockData.ticker, 'GOOG');
        assert.equal(res.body.stockData.likes, 1);
        done();
      });
    });

    test('1 stock with like again (ensure likes arent double counted)', function(done) {
      chai.request(server).get('/api/stock-prices?stock=goog&like=true').end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.stockData.ticker, "GOOG");
        assert.isNumber(res.body.stockData.price);
        assert.equal(res.body.stockData.likes, 1);
        done();
      });
    });

    test('2 stocks', function(done) {
      chai.request(server).get('/api/stock-prices/?stock=GOOG&stock=T').end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isObject(res.body, 'response should be an object');
        assert.isArray(res.body.stockData, 'stockData should be an array');
        assert.isObject(res.body.stockData[0], 'the first item in stockData should be an object');
        assert.isObject(res.body.stockData[1], 'the second item in stockData should be an object');
        assert.equal(res.body.stockData[0].stock, 'GOOG');
        assert.equal(res.body.stockData[1].stock, 'T');
        assert.isNumber(res.body.stockData[0].price, 'price of the first stock should be a string');
        assert.isNumber(res.body.stockData[1].price, 'price of the second stock should be a string');
        assert.equal(res.body.stockData[0].rel_likes, 1);
        assert.equal(res.body.stockData[1].rel_likes, -1);
        done();
      });
    });

    test('2 stocks with like', function(done) {
      chai.request(server).get('/api/stock-prices/?stock=GOOG&stock=T&like=true').end(function(err, res) {
        if (err)
          done(err);
        assert.equal(res.status, 200);
        assert.isArray(res.body.stockData);
        assert.equal(res.body.stockData[0].stock, 'GOOG');
        assert.equal(res.body.stockData[1].stock, 'T');
        assert.isNumber(res.body.stockData[0].price);
        assert.isNumber(res.body.stockData[1].price)
        assert.equal(res.body.stockData[0].rel_likes, 0);
        assert.equal(res.body.stockData[0].rel_likes, 0);
        done();
      });
    });

  });

});
