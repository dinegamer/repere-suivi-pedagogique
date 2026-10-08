import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { existsSync } from 'node:fs';

const base = 'http://127.0.0.1:5051/api';
const portable = path.resolve('.tools/dotnet/dotnet.exe');
const dotnet = process.env.DOTNET_EXE || (existsSync(portable) ? portable : 'dotnet');
let server; let output = ''; let exitError;
const valid = { title: 'Exercice API entièrement fictif', description: 'Une description inventée pour le test réel de l’API.', unit: 'Cellule Test', kind: 'demande', priority: 'normale', dueDate: '2099-10-20' };
const call = (route, role = 'lecteur', body) => fetch(base + route, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'X-Demo-Role': role }, body: body ? JSON.stringify(body) : undefined });
const create = async () => { const response = await call('/requests', 'redacteur', valid); assert.equal(response.status, 201); return response.json(); };
before(async () => {
  server = spawn(dotnet, ['api/bin/Debug/net10.0/Repere.Api.dll'], { windowsHide: true, env: { ...process.env, DemoUrl: 'http://127.0.0.1:5051', DOTNET_CLI_HOME: path.resolve('.tools/dotnet-home'), DOTNET_CLI_TELEMETRY_OPTOUT: '1', DOTNET_GENERATE_ASPNET_CERTIFICATE: 'false' }, stdio: ['ignore', 'pipe', 'pipe'] });
  server.on('error', error => { exitError = error; });
  server.stdout.on('data', data => { output += data; }); server.stderr.on('data', data => { output += data; });
  for (let attempt = 0; attempt < 50; attempt++) {
    if (exitError) throw exitError;
    try { const response = await call('/health'); if (response.ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error('API indisponible : ' + output);
});
after(() => server?.kill());
test('health annonce mémoire, rôles simulés et absence de SQL', async () => assert.deepEqual(await (await call('/health')).json(), { status: 'ok', mode: 'demo-memory', authentication: 'simulated', sqlServerConnected: false }));
test('liste initiale de six dossiers fictifs', async () => assert.equal((await (await call('/requests')).json()).length, 6));
test('recherche serveur sans accents et avec filtres combinés', async () => assert.equal((await (await call('/requests?q=beta&status=nouvelle&kind=demande')).json()).length, 1));
test('filtre serveur invalide renvoie 400', async () => assert.equal((await call('/requests?status=autre')).status, 400));
test('lecteur simulé ne crée pas de dossier', async () => assert.equal((await call('/requests', 'lecteur', valid)).status, 403));
test('absence de rôle équivaut à lecteur', async () => assert.equal((await fetch(base + '/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(valid) })).status, 403));
test('rôle inconnu est rejeté', async () => assert.equal((await call('/requests', 'admin', valid)).status, 400));
test('validation serveur rejette titre et date impossibles', async () => { const response = await call('/requests', 'redacteur', { ...valid, title: 'court', dueDate: '2026-02-30' }); assert.equal(response.status, 400); const body = await response.json(); assert.ok(body.errors.title); assert.ok(body.errors.dueDate); });
test('création retourne 201, titre normalisé et historique initial', async () => { const response = await call('/requests', 'redacteur', { ...valid, title: '  Un dossier inventé pour les tests  ' }); const item = await response.json(); assert.equal(response.status, 201); assert.equal(item.title, 'Un dossier inventé pour les tests'); assert.equal(item.status, 'nouvelle'); assert.equal(item.history.length, 1); assert.equal((await call('/requests/' + item.id)).status, 200); });
test('circuit complet et historique, clôture réservée au superviseur', async () => {
  let item = await create();
  for (const [status, role] of [['en_cours', 'redacteur'], ['a_valider', 'redacteur'], ['cloturee', 'superviseur']]) {
    if (status === 'cloturee') assert.equal((await call(`/requests/${item.id}/transitions`, 'redacteur', { status, expectedStatus: item.status, comment: 'Validation fictive demandée.' })).status, 403);
    const response = await call(`/requests/${item.id}/transitions`, role, { status, expectedStatus: item.status, comment: 'Changement fictif expliqué.' }); assert.equal(response.status, 200); item = await response.json();
  }
  assert.equal(item.history.length, 4); assert.equal(item.status, 'cloturee'); assert.equal(item.history[3].actor, 'Superviseur démo');
});
test('saut de statut interdit ne modifie pas l’historique', async () => { const item = await create(); const response = await call(`/requests/${item.id}/transitions`, 'superviseur', { status: 'cloturee', expectedStatus: 'nouvelle', comment: 'Tentative de saut de statut.' }); assert.equal(response.status, 409); assert.equal((await (await call('/requests/' + item.id)).json()).history.length, 1); });
test('commentaire court renvoie 400', async () => { const item = await create(); assert.equal((await call(`/requests/${item.id}/transitions`, 'redacteur', { status: 'en_cours', expectedStatus: 'nouvelle', comment: 'court' })).status, 400); });
test('état périmé renvoie 409', async () => { const item = await create(); assert.equal((await call(`/requests/${item.id}/transitions`, 'redacteur', { status: 'en_cours', expectedStatus: 'en_cours', comment: 'Conflit fictif de modification.' })).status, 409); });
test('lecteur ne change pas un statut', async () => { const item = await create(); assert.equal((await call(`/requests/${item.id}/transitions`, 'lecteur', { status: 'en_cours', expectedStatus: 'nouvelle', comment: 'Tentative du lecteur fictif.' })).status, 403); });
test('dossier absent retourne 404', async () => assert.equal((await call('/requests/11111111-1111-1111-1111-111111111111')).status, 404));
test('tableau de bord total cohérent avec le registre', async () => { const items = await (await call('/requests')).json(); const stats = await (await call('/dashboard')).json(); assert.equal(stats.total, items.length); assert.equal(stats.active + stats.closed, stats.total); });
