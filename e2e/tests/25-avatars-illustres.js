// Avatars illustrés (SVG) : en-tête, profil, défaut
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => b();
t('avatar illustré par défaut et choisi', async a => {
  const { page } = a;
  await a.signup('Illu', 'il@il.fr');
  await a.patchDb(d => { Object.values(d.users)[0].onboarded = true; });
  await a.go('/profile'); await page.waitForTimeout(700);
  a.assert.ok(await page.locator('[data-testid="nav-profile"] svg').count() === 1, 'avatar par défaut illustré dans l\'en-tête');
  await a.patchDb(d => { Object.values(d.users)[0].avatar = 'a_fox'; });
  await a.go('/profile'); await page.waitForTimeout(700);
  a.assert.ok(await page.locator('[data-testid="nav-profile"] svg').count() === 1);
  await page.locator('text=Avatar et titre').click(); await page.waitForTimeout(300);
  a.assert.ok(await page.locator('[title="Renard"] svg').count() === 1, 'grille illustrée');
});
module.exports = { tests, seed };
