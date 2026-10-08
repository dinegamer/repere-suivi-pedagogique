import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: 'api-browser.spec.ts', workers: 1,
  reporter: [['list'], ['json', { outputFile: '.artifacts/verification/api-browser-results.json' }]],
  use: { baseURL: 'http://127.0.0.1:5173', channel: 'chrome', headless: true, launchOptions: { chromiumSandbox: true }, viewport: { width: 1440, height: 1100 } },
  webServer: [
    { command: 'node scripts/run-api.mjs', url: 'http://127.0.0.1:5050/api/health', reuseExistingServer: false, timeout: 30000 },
    { command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort', url: 'http://127.0.0.1:5173', env: { VITE_DATA_MODE: 'api', VITE_API_URL: 'http://127.0.0.1:5050' }, reuseExistingServer: false, timeout: 30000 }
  ]
});
