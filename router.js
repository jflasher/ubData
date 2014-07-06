'use strict';

var requestHandlers = require('./requestHandlers');

var routes = function (app) {
  var s3Base = 'http://data.sciencerely.org/mongolia';
  ////
  //// Version 1
  ////
  app.get('/', function (req, res) {
    res.redirect(301, s3Base);
  });

  app.get('/api', function (req, res) {
    res.redirect(301, s3Base + '/api.html');
  });

  app.get('/charts', function (req, res) {
    res.redirect(301, s3Base + '/charts.html');
  });

  ////
  // Version 1
  ////
  app.get('/1/mostRecentMeasurements', function (req, res) {
    requestHandlers.getMostRecentMeasurements(function (err, data) {
      if (err) {
        res.end(undefined);
        return;
      }

      res.end(JSON.stringify(data));
    });
  });

  app.get('/1/dailyMeasurements', function (req, res) {
    requestHandlers.getDailyMeasurements(function (err, data) {
      if (err) {
        res.end(undefined);
        return;
      }

      res.end(JSON.stringify(data));
    });
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