// Blind test : parcours complet avec extraits simulés
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => b();
t('10 extraits → écran de score', async a => {
  await a.go('/blindtest');
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
  await a.go('/blindtest');
  await a.page.evaluate(() => { window.__ITUNES_MOCK = async () => null; });
  await a.page.locator('[data-testid="bt-start"]').click();
  await a.page.locator('[data-testid="bt-skip"]').click();
  a.assert.ok(/Extrait 2\/10/.test(await a.body()));
});
t('lien depuis Jouer', async a => {
  await a.go('/jouer'); await a.page.locator('[data-testid="bt-link"]').click(); await a.page.waitForTimeout(300);
  a.assert.ok(a.page.url().endsWith('/blindtest'), a.page.url());
});
module.exports = { tests, seed };
