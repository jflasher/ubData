var requestHandlers = require('./requestHandlers');

var routes = function (app) {
  ////
  //// Version 1
  ////
  app.get('/', function (req, res) {
    res.render('index', { page: 'root' });
  });

  app.get('/api', function (req, res) {
    res.render('api', { page: 'api' });
  });

  app.get('/1/mostRecent', function (req, res) {
    requestHandlers.getMostRecent(req, res);
  });

  app.get('/1/sendTweet', function (req, res) {
    var key = req.param('key');
    if (key && key == process.env.SERVER_KEY) {
      requestHandlers.sendTweet(req, res);
    } else {
      res.end('{"results": {"error": "incorrect key"}}');
    }
  });
};

module.exports = routes;