import http.server

PORT = 8000

class AlwaysServeIndexHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if not self.path.endswith('js'):
            self.path = '/'
        if self.path.startswith('/html-api'):
            self.path = self.path.removeprefix('/html-api')
        return super().do_GET()

http.server.test(HandlerClass=AlwaysServeIndexHandler)
