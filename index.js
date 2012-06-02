/*
	Simple server to handle an incoming API call for data
*/
var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");

var handle = {}
handle["/"] = requestHandlers.showInfo;
handle["/data"] = requestHandlers.data;

server.start(8080, router.route, handle);