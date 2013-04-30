/*
	Simple server to handle an incoming API call for data
*/
var express = require('express');
var app = express();

app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.use(express.static(__dirname + '/public'));

require("./router")(app);

app.listen(process.env.VCAP_APP_PORT || 3000);