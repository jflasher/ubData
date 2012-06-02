var http = require("http");
var url = require("url");

function start(cfPort, route, handle) {
  function onRequest(request, response) {
    var pathname = url.parse(request.url).pathname;
    route(handle, pathname, response, request);
  }

  http.createServer(onRequest).listen(cfPort || 3000);
}

exports.start = start;