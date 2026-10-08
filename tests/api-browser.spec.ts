import { test, expect } from '@playwright/test';

test('React utilise réellement l’API C# et conserve la création au rechargement', async ({ page, request }) => {
  await page.goto('/'); await expect(page.getByText('Mode API C# · mémoire temporaire du serveur')).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(6);
  await page.getByRole('button', { name: 'Nouveau dossier', exact: true }).click();
  await page.getByLabel('Titre', { exact: true }).fill('Dossier fictif créé depuis React'); await page.getByLabel('Cellule fictive', { exact: true }).fill('Cellule Intégration');
  await page.getByLabel('Échéance', { exact: true }).fill('2099-10-20'); await page.getByLabel('Description', { exact: true }).fill('Exercice inventé pour vérifier React vers C# de bout en bout.');
  await page.getByRole('button', { name: 'Créer le dossier', exact: true }).click(); await expect(page.locator('tbody tr')).toHaveCount(7);
  const response = await request.get('http://127.0.0.1:5050/api/requests'); expect((await response.json()).some((item: { title: string }) => item.title === 'Dossier fictif créé depuis React')).toBe(true);
  await page.reload(); await expect(page.getByRole('button', { name: 'Dossier fictif créé depuis React', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Dossier fictif créé depuis React', exact: true }).click(); await page.getByLabel('Commentaire obligatoire').fill('Traitement fictif démarré via React et C#.'); await page.getByRole('button', { name: 'Enregistrer le statut' }).click();
  await expect(page.locator('.timeline li')).toHaveCount(2);
  await page.setViewportSize({ width: 1440, height: 1400 });
  await page.screenshot({ path: 'docs/captures/06-api-csharp.png' });
});
test('API inaccessible affiche une erreur sans substitution silencieuse', async ({ page }) => {
  await page.route('**/api/requests', route => route.abort()); await page.goto('/'); await expect(page.getByRole('alert')).toContainText('API C# inaccessible');
  await expect(page.getByText('Mode API C# · mémoire temporaire du serveur')).toBeVisible(); await expect(page.locator('tbody tr')).toHaveCount(0);
});
