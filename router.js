var requestHandlers = require('./requestHandlers');
var keys = require('./twitterkeys');

var routes = function (app) {
  app.get('/', function (req, res) {
    res.render('index', function (err, html) {
      if (err) {
        console.log(err);
        res.end();
      } else {
        res.end(html);
      }
    });
  });

  ////
  //// Version 1
  ////
  app.get('/1/showInfo', function (req, res) {
    res.render('index', function (err, html) {
      if (err) {
        console.log(err);
        res.end();
      } else {
        res.end(html);
      }
    });
  });  

  app.get('/1/mostRecent', function (req, res) {
    requestHandlers.getMostRecent(req, res);
  });

  app.get('/1/sendTweet', function (req, res) {
    var key = req.param('key');
    if (key && key === keys.myServerKey) {
      requestHandlers.sendTweet(req, res);
    } else {
      res.end('{"results": {"error": "incorrect key"}}');
    }
  });
};

module.exports = routes;