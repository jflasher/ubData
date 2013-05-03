var requestHandlers = require('./requestHandlers');
var keys = require('./twitterkeys');

var routes = function (app) { 
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