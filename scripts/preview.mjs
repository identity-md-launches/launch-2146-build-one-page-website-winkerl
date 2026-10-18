import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
};

// A bounded test server. Call stop() in finally; it never survives its owning script.
export async function startPreview(directory = 'dist') {
  const root = resolve(directory);
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      if (url.pathname === '/preview') {
        response.writeHead(302, { Location: '/preview/' });
        response.end();
        return;
      }
      if (!url.pathname.startsWith('/preview/')) {
        response.writeHead(404);
        response.end();
        return;
      }
      const relative = decodeURIComponent(url.pathname.slice('/preview/'.length)) || 'index.html';
      const path = resolve(root, relative);
      if (!path.startsWith(root + sep)) throw new Error('Outside preview');
      const info = await stat(path);
      if (!info.isFile()) throw new Error('Not a file');
      response.writeHead(200, {
        'Content-Type': types[extname(path)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      response.end(await readFile(path));
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  return {
    url: `http://127.0.0.1:${address.port}/preview/`,
    stop: () => new Promise((done) => server.close(done)),
  };
}
