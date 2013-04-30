/*
	Simple server to handle an incoming API call for data
*/
var express = require('express');
var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').__express);
app.set('view engine', 'html');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(__dirname + '/public'));

require("./router")(app);

app.listen(app.get('port'), function () {
  console.log("Listening on " + app.get('port'));
});