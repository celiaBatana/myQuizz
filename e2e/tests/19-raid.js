// Raid collectif
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => {
  const s = b();
  const cats = ['histoire', 'sciences', 'astronomie', 'mathematiques', 'cinema', 'theatre_culture', 'sport', 'anime_manga', 'culture', 'langues', 'gastronomie', 'nature', 'politique', 'economie'];
  cats.forEach(c => { for (let i = 0; i < 12; i++) s.questions[`r_${c}_${i}`] = { text: `Q ${c} ${i} ?`, options: ['Bonne', 'F1', 'F2', 'F3'], answer: 0, explanation: '', diff: ['easy', 'medium', 'hard'][i % 3], category: c, theme: 't', active: true }; });
  return s;
};
const wk = () => { const d = new Date(); const day = d.getDay(); const diff = (day + 6) % 7; d.setDate(d.getDate() - diff); const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
t('raid : attaque, dégâts ajoutés à la barre commune', async a => {
  await a.signup();
  await a.patchDb(d => { Object.values(d.users)[0].onboarded = true; });
  await a.go('/raid');
  await a.page.locator('[data-testid="raid-attack"]').click();
  for (let i = 0; i < 10; i++) {
    const o = a.page.locator('[data-testid="raid-opt"]'); await o.first().waitFor({ timeout: 5000 });
    const n = await o.count();
    for (let k = 0; k < n; k++) if ((await o.nth(k).innerText()).trim() === 'Bonne') { await o.nth(k).click(); break; }
    await a.page.waitForTimeout(950);
  }
  await a.page.locator('[data-testid="raid-over"]').waitFor({ timeout: 6000 });
  const dmg = parseInt((await a.page.locator('[data-testid="raid-result-dmg"]').innerText()).replace(/\D/g, ''), 10);
  a.assert.ok(dmg >= 100, 'dmg ' + dmg);
  await a.page.waitForTimeout(500);
  const db = await a.db();
  const u = Object.values(db.users)[0];
  a.assert.strictEqual(u.raid.dmg, dmg); a.assert.strictEqual(u.raidDay.runs, 1);
  a.assert.strictEqual(Object.values(db.leaderboard)[0].collDmg, dmg);
});
t('raid : boss vaincu par la communauté → récompense', async a => {
  await a.patchDb(d => { const me = Object.keys(d.users)[0]; d.users[me].gemsBonus = 0; d.users[me].unlocked = []; d.users[me].raidClaimed = null; });
  const W = wk();
  await a.page.evaluate(`(() => { const d = window.__DB(); const me = Object.keys(d.users)[0];
    d.users[me].raid = { week: '${W}', dmg: 400 }; d.leaderboard[me].collWeek = '${W}'; d.leaderboard[me].collDmg = 400;
    d.leaderboard.bob = { uid: 'bob', name: 'Bob', collWeek: '${W}', collDmg: 5000 };
    localStorage.setItem('fakedb', JSON.stringify(d)); })()`);
  await a.go('/raid'); await a.page.waitForTimeout(1200);
  a.assert.ok(/vaincu/.test(await a.body()));
  await a.page.locator('[data-testid="raid-claim"]').click(); await a.page.waitForTimeout(500);
  const u = Object.values((await a.db()).users)[0];
  a.assert.strictEqual(u.gemsBonus, 100); a.assert.ok(u.unlocked.includes('t_raid')); a.assert.strictEqual(u.raidClaimed, W);
  a.assert.ok(await a.page.locator('[data-testid="raid-row"]').count() >= 2);
});
module.exports = { tests, seed };
