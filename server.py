import http.server

PORT = 8000

class AlwaysServeIndexHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if not self.path.endswith('js'):
            self.path = '/'
        return super().do_GET()

http.server.test(HandlerClass=AlwaysServeIndexHandler)
