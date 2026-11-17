"""Serve Imagination Land so the Unity build can load.

Opening the site as a file:// page is blocked by the browser. This server
also marks the .br build files as Brotli so the game can decompress them.
"""
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 8080

BROTLI_TYPES = (
    (".framework.js.br", "application/javascript"),
    (".wasm.br", "application/wasm"),
    (".js.br", "application/javascript"),
    (".data.br", "application/octet-stream"),
)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def guess_type(self, path):
        for suffix, mime in BROTLI_TYPES:
            if path.endswith(suffix):
                return mime
        return super().guess_type(path)

    def end_headers(self):
        path = self.path.split("?", 1)[0]
        if any(path.endswith(suffix) for suffix, _mime in BROTLI_TYPES):
            self.send_header("Content-Encoding", "br")
        super().end_headers()


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Imagination Land is at http://127.0.0.1:{PORT}/games.html")
    print("Leave this window open while you play. Press Ctrl+C to stop.")
    server.serve_forever()
