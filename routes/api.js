/* *
*
*       Complete the API routing below
*
* */

'use strict';
var request = require('request')
var expect = require('chai').expect
var MongoClient = require('mongodb')

const CONNECTION_STRING = process.env.DB

module.exports = function(app) {
  app.route('/api/stock-prices').get(function(req, res) {
    var myTicker = typeof req.query.stock === "string"
      ? req.query.stock.toUpperCase()
      : req.query.stock.join(",").toUpperCase()
    var myUrl = typeof req.query.stock === "string"
      ? 'https://api.iextrading.com/1.0/stock/' + myTicker + '/batch?types=quote&range=1m&last=1'
      : 'https://api.iextrading.com/1.0/stock/market/batch?symbols=' + myTicker + '&types=quote&range=1m&last=1'
    var stock = {
      stockData: {}
    }

    if (req.query.like === 'true') {
      var ip = req.ip
      if (typeof req.query.stock === "string") {
        var likes = {}
        likes.ticker = req.query.stock.toUpperCase()
        likes.ip = ip
      } else if (typeof req.query.stock === "object") {
        var likes1 = {}
        var likes2 = {}
        likes1.ticker = req.query.stock[0].toUpperCase()
        likes1.ip = ip
        likes2.ticker = req.query.stock[1].toUpperCase()
        likes2.ip = ip
      }
    }
    MongoClient.connect(CONNECTION_STRING, function(err, db) {
      var qty = 0,
        qty1 = 0,
        qty2 = 0
      //the command below was run only once to create a unique index on the collection
      //db.collection('tickerlikes').createIndex( { "ticker": 1, "ip": 1 }, { unique: true } )
      if (likes) {
        db.collection('tickerlikes').insertOne(likes, (err, response) => {
          if (err) {
            db.close();
            console.log(err);
          }
        })
      } else if (likes1 && likes2) {
        db.collection('tickerlikes').insertMany([
          likes1, likes2
        ], {
          ordered: false
        }, (err, response) => {
          if (err) {
            db.close();
            console.log(err);
          }
        })
      }

      db.collection('tickerlikes').find().toArray((err, docs) => {
        if (err) {
          console.log(err)
        }
        var regex = /^.*[,].*$/
        if (myTicker.match(regex) === null) {
          qty = getLikes(docs, myTicker)
        } else {
          qty1 = getLikes(docs, myTicker.split(",")[0])
          qty2 = getLikes(docs, myTicker.split(",")[1])
        }
        db.close()
      })

      request({
        method: 'GET',
        uri: myUrl,
        headers: {
          'Authorization': 'Bearer ' + 'TOKEN HERE'
        }
      }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          var reqBody = body.toString()
          reqBody = JSON.parse(reqBody)
          var size = Object.keys(reqBody).length
          if (size === 1) {
            var ticker = myTicker
            var price = reqBody["quote"]["latestPrice"]
            stock.stockData.ticker = ticker
            stock.stockData.price = price
            stock.stockData.likes = qty
          } else if (size === 2) {
            var ticker1 = myTicker.split(",")[0]
            var ticker2 = myTicker.split(",")[1]
            var price1 = reqBody[ticker1]["quote"]["latestPrice"]
            var price2 = reqBody[ticker2]["quote"]["latestPrice"]
            var diff1 = qty1 - qty2
            var diff2 = qty2 - qty1
            stock.stockData = []
            var item1 = {
              stock: ticker1,
              price: price1,
              rel_likes: diff1
            }
            stock.stockData.push(item1)
            var item2 = {
              stock: ticker2,
              price: price2,
              rel_likes: diff2
            }
            stock.stockData.push(item2)
          }
          res.json(stock)
        }
      })
    })

    function getLikes(arr, str) {
      var total = 0
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].ticker === str) {
          total += 1
        }
      }
      return total
    }
  })
}
