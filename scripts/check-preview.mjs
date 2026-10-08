import { spawn } from 'node:child_process';

// Vérifie le serveur de lecture livré sans installer de dépendance.
const server = spawn(process.execPath, ['scripts/serve-preview.mjs'], { windowsHide: true, stdio: 'ignore' });
let startupError;
server.on('error', error => { startupError = error; });
try {
  let response;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (startupError) throw startupError;
    try { response = await fetch('http://127.0.0.1:4173/'); if (response.ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!response?.ok) throw new Error('Aperçu indisponible.');
  const html = await response.text();
  if (!html.includes('id="root"')) throw new Error('HTML incorrect.');
  const asset = html.match(/<script[^>]+src="([^"]+)"/);
  if (!asset) throw new Error('Script absent.');
  const script = await fetch(new URL(asset[1], 'http://127.0.0.1:4173/'));
  if (!script.ok || !script.headers.get('Content-Type')?.includes('javascript')) throw new Error('JavaScript non servi.');
  console.log('Aperçu sans dépendances : HTML 200, JavaScript 200.');
} finally {
  server.kill();
}
