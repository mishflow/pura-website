import os, http.server, socketserver, webbrowser, threading

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

PORT = 3333
URL  = f"http://localhost:{PORT}/pages/retreat.html"

Handler = http.server.SimpleHTTPRequestHandler

def open_browser():
    webbrowser.open(URL)

print(f"Pura — serving at {URL}")
print("Press Ctrl+C to stop.\n")

threading.Timer(0.5, open_browser).start()

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
