// Bandeau « Tu as gagné » : XP, éclats, carte, cosmétique annoncés partout
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => b();
t('fin de quiz : le bandeau annonce l\'XP gagnée', async a => {
  const { page } = a;
  await a.signup('Gain', 'g@g.fr');
  await a.patchDb(d => { Object.values(d.users)[0].onboarded = true; });
  await a.go('/category/culture/theme/geographie'); await page.click('text=Relief'); await page.waitForTimeout(900);
  for (let i = 0; i < 10; i++) {
    await page.locator('text=Bonne').first().click({ timeout: 4000 }); await page.waitForTimeout(450);
    await page.locator('button:has-text("Suivant"), button:has-text("Terminer"), button:has-text("Résultat"), button:has-text("Voir")').first().click({ timeout: 3000 }); await page.waitForTimeout(350);
  }
  await page.waitForTimeout(1500);
  const txt = await page.locator('[data-testid="reward-banner"]').innerText({ timeout: 4000 });
  a.assert.ok(/Tu as gagné/i.test(txt) && /\+\d+ XP/.test(txt), txt);
});
module.exports = { tests, seed };
