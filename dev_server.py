"""Dependency-free local development server with browser live reload."""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import argparse
import hashlib
import json
import mimetypes
import os

ROOT = Path(__file__).resolve().parent
WATCH_EXTENSIONS = {'.html', '.css', '.js', '.mjs', '.json', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.wav', '.mp3', '.ogg'}
IGNORED_DIRS = {'.git', 'node_modules', '__pycache__', '.venv', 'venv'}

RELOAD_CLIENT = """<script>
(function setupDevReload() {
  let lastRevision = null;
  async function checkRevision() {
    try {
      const response = await fetch('/__dev/revision', { cache: 'no-store' });
      if (!response.ok) return;
      const result = await response.json();
      if (lastRevision !== null && result.revision !== lastRevision) {
        window.location.reload();
        return;
      } // end changed revision check
      lastRevision = result.revision;
    } catch (_error) {
      // The server may be restarting. Retry on the next interval.
    } // end revision polling error handling
  } // end checkRevision
  checkRevision();
  setInterval(checkRevision, 1000);
})(); // end setupDevReload
</script>"""


def revision():
    """Fingerprint development files without touching the Git metadata directory."""
    digest = hashlib.sha256()
    for directory, dirs, files in os.walk(ROOT):
        dirs[:] = sorted(d for d in dirs if d not in IGNORED_DIRS and not d.startswith('.'))
        for filename in sorted(files):
            path = Path(directory) / filename
            if path.suffix.lower() not in WATCH_EXTENSIONS:
                continue
            try:
                stat = path.stat()
            except OSError:
                continue
            digest.update(str(path.relative_to(ROOT)).encode('utf-8'))
            digest.update(str(stat.st_mtime_ns).encode('ascii'))
            digest.update(str(stat.st_size).encode('ascii'))
    return digest.hexdigest()[:16]


class DevelopmentHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == '/__dev/revision':
            payload = json.dumps({'revision': revision()}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        if path in ('/', '/index.html'):
            html = (ROOT / 'index.html').read_text(encoding='utf-8')
            html = html.replace('</body>', RELOAD_CLIENT + '\n</body>')
            payload = html.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        super().do_GET()


def main():
    parser = argparse.ArgumentParser(description='Platformer Engine development server with live browser reload')
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    mimetypes.add_type('text/javascript', '.mjs', strict=True)
    handler = partial(DevelopmentHandler, directory=str(ROOT))
    with ThreadingHTTPServer(('localhost', args.port), handler) as server:
        print(f'Platformer Engine development server: http://localhost:{args.port}', flush=True)
        print('The browser reloads automatically when local project files change.', flush=True)
        print('Press Ctrl+C to stop.', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print('\nStopping development server.', flush=True)


if __name__ == '__main__':
    main()
