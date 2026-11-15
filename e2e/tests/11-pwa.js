// Installation de l'appli
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => b();
t('manifeste valide et icônes présentes', async a => {
  await a.go('/');
  const m = await a.page.evaluate(async () => (await fetch('/manifest.json')).json());
  a.assert.strictEqual(m.display, 'standalone'); a.assert.ok(m.shortcuts.length >= 3);
  for (const i of m.icons) { const ok = await a.page.evaluate(async src => (await fetch(src)).ok, i.src); a.assert.ok(ok, i.src); }
});
t('pas d\'invitation sans événement d\'installation (bureau)', async a => {
  await a.go('/'); a.assert.strictEqual(await a.page.locator('[data-testid="install-prompt"]').count(), 0);
});
t('invitation affichée quand le navigateur propose l\'installation, puis masquée', async a => {
  await a.go('/');
  await a.page.evaluate(() => { const e = new Event('beforeinstallprompt'); e.prompt = () => { window.__prompted = true; }; e.userChoice = Promise.resolve({ outcome: 'accepted' }); window.dispatchEvent(e); });
  await a.page.waitForTimeout(300);
  a.assert.strictEqual(await a.page.locator('[data-testid="install-prompt"]').count(), 1);
  await a.page.locator('[data-testid="install-btn"]').click(); await a.page.waitForTimeout(300);
  a.assert.ok(await a.page.evaluate(() => window.__prompted === true));
  a.assert.strictEqual(await a.page.locator('[data-testid="install-prompt"]').count(), 0);
});
module.exports = { tests, seed };
