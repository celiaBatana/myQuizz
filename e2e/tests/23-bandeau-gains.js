// Bandeau « Tu as gagné » : XP, éclats, carte, cosmétique annoncés partout
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => b();
t('pas de bandeau XP sur un écran de résultat', async a => {
  const { page } = a;
  await a.signup('Gain', 'g@g.fr');
  await a.patchDb(d => { Object.values(d.users)[0].onboarded = true; });
  await a.go('/category/culture/theme/geographie'); await page.click('text=Relief'); await page.waitForTimeout(900);
  for (let i = 0; i < 10; i++) {
    await page.locator('text=Bonne').first().click({ timeout: 4000 }); await page.waitForTimeout(450);
    await page.locator('button:has-text("Suivant"), button:has-text("Terminer"), button:has-text("Résultat"), button:has-text("Voir")').first().click({ timeout: 3000 }); await page.waitForTimeout(350);
  }
  await page.waitForTimeout(1500);
  // le résultat du quiz est déjà affiché : pas de bandeau en doublon
  const b = page.locator('[data-testid="reward-banner"]');
  const txt = (await b.count()) ? await b.innerText() : '';
  a.assert.ok(!/XP|éclats/.test(txt), 'pas de gain XP/éclats en doublon sur le résultat : ' + txt);
});
module.exports = { tests, seed };
