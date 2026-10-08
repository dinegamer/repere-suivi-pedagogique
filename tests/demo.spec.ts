import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/'); await expect(page.getByRole('heading', { name: 'Registre des dossiers' })).toBeVisible(); });
test('registre, mentions pédagogiques et absence d’erreurs JavaScript', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message)); await page.reload();
  await expect(page.locator('tbody tr')).toHaveCount(6);
  await expect(page.getByText('Mode navigateur · données conservées sur cet appareil')).toBeVisible();
  await expect(page.getByText('Démonstration fictive.')).toBeVisible();
  await page.screenshot({ path: 'docs/captures/01-registre-desktop.png', fullPage: true }); expect(errors).toEqual([]);
});
test('recherche, filtres et état vide', async ({ page }) => {
  await page.getByLabel('Rechercher un dossier').fill('beta');
  await page.getByLabel('Filtrer par statut').selectOption('nouvelle');
  await page.getByLabel('Filtrer par type').selectOption('demande');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByLabel('Rechercher un dossier').fill('introuvable');
  await expect(page.getByRole('heading', { name: 'Aucun dossier trouvé' })).toBeVisible();
  await page.getByRole('button', { name: 'Effacer les filtres' }).click(); await expect(page.locator('tbody tr')).toHaveCount(6);
});
test('formulaire validé et persistance navigateur après rechargement', async ({ page }) => {
  await page.getByRole('button', { name: 'Nouveau dossier', exact: true }).click();
  await page.getByRole('button', { name: 'Créer le dossier', exact: true }).click();
  await expect(page.getByText('Le titre doit contenir 8 à 120 caractères.')).toBeVisible();
  await expect(page.getByLabel('Titre', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel('Titre', { exact: true }).fill('Vérifier une procédure fictive');
  await page.getByLabel('Cellule fictive', { exact: true }).fill('Cellule Delta');
  await page.getByLabel('Échéance', { exact: true }).fill('2099-10-20');
  await page.getByLabel('Description', { exact: true }).fill('Une description inventée pour vérifier le formulaire pédagogique.');
  await page.screenshot({ path: 'docs/captures/02-formulaire.png' });
  await page.getByRole('button', { name: 'Créer le dossier', exact: true }).click(); await expect(page.locator('tbody tr')).toHaveCount(7);
  await page.reload(); await expect(page.getByRole('button', { name: 'Vérifier une procédure fictive', exact: true })).toBeVisible();
});
test('circuit de statut, commentaire et clôture par superviseur', async ({ page }) => {
  await page.getByRole('button', { name: 'Centraliser les pièces de suivi', exact: true }).click();
  await page.getByRole('button', { name: 'Enregistrer le statut' }).click(); await expect(page.getByRole('alert')).toContainText('8 à 500 caractères');
  await page.getByLabel('Commentaire obligatoire').fill('Le traitement de l’exercice fictif a démarré.'); await page.getByRole('button', { name: 'Enregistrer le statut' }).click();
  await expect(page.locator('.timeline li')).toHaveCount(2);
  await page.getByLabel('Commentaire obligatoire').fill('Le résultat fictif est prêt pour validation.'); await page.getByRole('button', { name: 'Enregistrer le statut' }).click();
  await expect(page.getByText('Ce dossier attend le superviseur simulé pour sa validation.')).toBeVisible();
  await page.getByRole('button', { name: 'Fermer', exact: true }).click(); await page.getByLabel('Rôle simulé').selectOption('superviseur');
  await page.getByRole('button', { name: 'Centraliser les pièces de suivi', exact: true }).click(); await page.getByLabel('Nouveau statut').selectOption('cloturee');
  await page.getByLabel('Commentaire obligatoire').fill('Résultat fictif relu et validé.'); await page.getByRole('button', { name: 'Enregistrer le statut' }).click();
  await expect(page.locator('.timeline li')).toHaveCount(4); await expect(page.getByText('Ce dossier est clôturé. Son historique reste consultable.')).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1400 });
  await page.screenshot({ path: 'docs/captures/03-historique.png' });
});
test('lecteur simulé en consultation et navigation au clavier', async ({ page }) => {
  await page.getByLabel('Rôle simulé').selectOption('lecteur'); await expect(page.getByRole('button', { name: 'Nouveau dossier', exact: true })).toBeDisabled();
  const button = page.getByRole('button', { name: 'Clarifier le circuit de validation', exact: true }); await button.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible(); await expect(page.getByText('Le lecteur simulé consulte les dossiers sans les modifier.')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0); await expect(button).toBeFocused();
});
test('tableau de bord et présentation honnête', async ({ page }) => {
  await page.getByRole('button', { name: 'Tableau de bord', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Répartition par statut' })).toBeVisible();
  await page.screenshot({ path: 'docs/captures/04-tableau-de-bord.png', fullPage: true });
  await page.getByRole('button', { name: 'À propos', exact: true }).click(); await expect(page.getByText(/Il ne constitue ni une expérience professionnelle antérieure/)).toBeVisible();
});
test('mobile sans débordement global et formulaire accessible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'docs/captures/05-registre-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Nouveau dossier', exact: true }).click(); await expect(page.getByLabel('Titre', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
