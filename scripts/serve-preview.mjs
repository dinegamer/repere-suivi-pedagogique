import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';

// Serveur de lecture local sans dépendance, pour ouvrir le livrable déjà compilé.
const root = path.resolve('preview');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
const server = http.createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405).end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const filename = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!filename.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    const content = await readFile(filename);
    response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Fichier introuvable.'); }
});
server.listen(4173, '127.0.0.1', () => console.log('Aperçu pédagogique : http://127.0.0.1:4173 — Ctrl+C pour arrêter.'));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
