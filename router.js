function route(handle, pathname, response, request) {
  if (typeof handle[pathname] === 'function') {
    handle[pathname](response, request);
  } else {
    response.writeHead(404, {"Content-Type": "text/html"});
    response.end("404 Not found");
  }
}

exports.route = route;