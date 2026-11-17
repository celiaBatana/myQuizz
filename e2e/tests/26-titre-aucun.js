// Profil : on peut choisir « Aucun » comme titre
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => b();
t('titre « Aucun »', async a => {
  const { page } = a;
  await a.signup('Tit', 'ti@ti.fr');
  await a.patchDb(d => { const u = Object.values(d.users)[0]; u.onboarded = true; u.title = 't_rookie'; });
  await a.go('/profile'); await page.waitForTimeout(700);
  a.assert.ok(/Débutant/.test(await a.body()), 'titre affiché');
  await page.locator('text=Avatar et titre').click(); await page.waitForTimeout(300);
  await page.locator('[data-testid="title-none"]').click(); await page.waitForTimeout(700);
  const d = await a.db(); a.assert.strictEqual(Object.values(d.users)[0].title, '');
  a.assert.ok(!/Débutant/.test(await page.locator('[data-testid="profile-rank"]').locator('xpath=..').innerText()), 'titre retiré du profil');
});
module.exports = { tests, seed };
