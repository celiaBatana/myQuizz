// Saisons automatiques : thème, récompenses générées, objets visibles au profil
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => b();
t('saison 2 (décembre) : thème Océan, récompenses générées', async a => {
  await a.signup();
  await a.patchDb(d => { const u = Object.values(d.users)[0]; u.onboarded = true; u.chestDay = new Date().toISOString().slice(0, 10); });
  await a.page.addInitScript(() => {
    const R = Date, off = new R('2026-12-20T10:00:00').getTime() - R.now();
    class D extends R { constructor(...x) { x.length ? super(...x) : super(R.now() + off); } static now() { return R.now() + off; } }
    window.Date = D;
  });
  await a.go('/'); await a.page.waitForTimeout(800);
  a.assert.ok(/Saison 2 · Océan/.test(await a.body()), 'titre saison');
  await a.patchDb(d => { const u = Object.values(d.users)[0]; u.chestDay = '2026-12-20'; u.gemsBonus = 0; u.unlocked = []; u.totalXP = (u.season.base || 0) + 300; });
  await a.go('/'); await a.page.waitForTimeout(500);
  await a.page.locator('[data-testid="season-claim"]').click(); await a.page.waitForTimeout(500);
  const u = Object.values((await a.db()).users)[0];
  a.assert.strictEqual(u.season.id, 2);
  a.assert.ok(u.unlocked.includes('f_s2_a'), JSON.stringify(u.unlocked));
  a.assert.strictEqual(u.gemsBonus, 22); // 20 éclats × 1,1
});
t('profil : le cadre de saison 2 est équipable et listé', async a => {
  await a.go('/profile'); await a.page.waitForTimeout(500);
  await a.page.getByText('Avatar et titre').first().click().catch(() => {});
  await a.page.waitForTimeout(300);
  const txt = await a.page.locator('[data-testid="frames"]').innerText().catch(() => '');
  a.assert.ok(/Cadre Océan I/.test(txt), txt);
});
module.exports = { tests, seed };
