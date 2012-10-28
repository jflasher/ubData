/*
	Simple server to handle an incoming API call for data
*/
var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");

var handle = {}
handle["/"] = requestHandlers.showInfo;
handle["/data24h"] = requestHandlers.data24h;
handle["/data30m"] = requestHandlers.data30m;
handle["/data"] = requestHandlers.data30m;
handle["/sendTweet"] = requestHandlers.sendTweet;

server.start(process.env.VCAP_APP_PORT, router.route, handle);