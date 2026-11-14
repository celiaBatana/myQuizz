// Blind test : parcours complet avec extraits simulés
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => b();
t('10 extraits → écran de score', async a => {
  await a.go('/blindtest');
  a.assert.strictEqual(await a.page.locator('[data-testid="bt-cat"]').count(), 8);
  await a.page.locator('[data-cat="rapfr"]').click();
  await a.page.evaluate(() => { window.__ITUNES_MOCK = async () => 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='; });
  await a.page.locator('[data-testid="bt-start"]').click();
  for (let k = 0; k < 10; k++) {
    await a.page.locator('[data-testid="bt-play"]').waitFor({ timeout: 4000 });
    a.assert.strictEqual(await a.page.locator('[data-testid="bt-opt"]').count(), 4);
    await a.page.locator('[data-testid="bt-opt"]').first().click();
    await a.page.locator('[data-testid="bt-next"]').click();
  }
  a.assert.ok(/\/10/.test(await a.page.locator('[data-testid="bt-result"]').innerText()));
});
t('extrait indisponible → on peut passer', async a => {
  await a.go('/blindtest/animes');
  await a.page.evaluate(() => { window.__ITUNES_MOCK = async () => null; });
  await a.page.locator('[data-testid="bt-start"]').click();
  await a.page.locator('[data-testid="bt-skip"]').click();
  a.assert.ok(/Extrait 2\/10/.test(await a.body()));
});
t('carte Blind test sur l\'accueil', async a => {
  await a.go('/'); await a.page.locator('[data-testid="home-blindtest"]').click(); await a.page.waitForTimeout(300);
  a.assert.ok(a.page.url().endsWith('/blindtest'), a.page.url());
});
t('lien depuis Jouer', async a => {
  await a.go('/jouer'); await a.page.locator('[data-testid="bt-link"]').click(); await a.page.waitForTimeout(300);
  a.assert.ok(a.page.url().endsWith('/blindtest'), a.page.url());
});
t('connecté : XP gagné et record enregistré', async a => {
  await a.signup();
  await a.go('/blindtest/rapfr');
  await a.page.evaluate(() => { window.__ITUNES_MOCK = async () => 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='; });
  await a.page.locator('[data-testid="bt-start"]').click();
  for (let k = 0; k < 10; k++) {
    await a.page.locator('[data-testid="bt-play"]').waitFor({ timeout: 4000 });
    await a.page.locator('[data-testid="bt-opt"]').first().click();
    await a.page.locator('[data-testid="bt-next"]').click();
  }
  await a.page.locator('[data-testid="bt-gain"]').waitFor({ timeout: 4000 });
  await a.page.waitForTimeout(800);
  const d = await a.db(); const u = Object.values(d.users)[0];
  a.assert.ok(u.blindBest && typeof u.blindBest.rapfr === 'number', JSON.stringify(u.blindBest));
  a.assert.strictEqual(u.blindPlayed, 1);
  a.assert.ok(/XP/.test(await a.page.locator('[data-testid="bt-gain"]').innerText()));
});
module.exports = { tests, seed };
