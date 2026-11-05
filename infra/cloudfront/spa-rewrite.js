function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri === "/api" || uri.indexOf("/api/") === 0 || uri.indexOf("/.well-known/") === 0) {
    return request;
  }

  var lastSegment = uri.substring(uri.lastIndexOf("/") + 1);
  var isClientRoute = uri.charAt(uri.length - 1) === "/" || lastSegment.indexOf(".") === -1;

  if (isClientRoute) {
    request.uri = "/index.html";
  }

  return request;
}
