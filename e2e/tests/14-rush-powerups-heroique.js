// Rush 60 s, power-ups, boss héroïque
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => {
  const s = b();
  s.quizzes.zB = { catId: 'sport', themeId: 'football', name: 'Quiz Boss', diff: 'easy' };
  for (let i = 0; i < 60; i++) s.questions['zB_q' + i] = { text: `Question ${i + 1} ?`, options: ['Bonne', 'F1', 'F2', 'F3'], answer: 0, explanation: 'Ok.', diff: 'easy', category: 'sport', theme: 'football', quizId: 'zB', active: true };
  return s;
};
const good = async (a, tid, to = 30000) => {
  const opts = a.page.locator(`[data-testid="${tid}"]`);
  await opts.first().waitFor({ timeout: 4000 });
  const n = await opts.count();
  for (let i = 0; i < n; i++) if ((await opts.nth(i).innerText()).trim() === 'Bonne') { await opts.nth(i).click({ timeout: to }); return; }
};
const setU = (a, fn) => a.patchDb(fn);

t('boutique : achat de power-ups', async a => {
  await a.signup();
  await setU(a, d => { const u = Object.values(d.users)[0]; u.onboarded = true; u.totalXP = 1000; });
  await a.go('/boutique');
  await a.page.locator('[data-testid="buy-fifty"]').click(); await a.page.waitForTimeout(400);
  await a.page.locator('[data-testid="buy-shield"]').click(); await a.page.waitForTimeout(400);
  const u = Object.values((await a.db()).users)[0];
  a.assert.strictEqual(u.powerups.fifty, 1); a.assert.strictEqual(u.powerups.shield, 1);
  a.assert.strictEqual(u.gemsSpent, 65);
});
t('rush : bonnes réponses comptées, 50/50 consomme un power-up', async a => {
  await setU(a, d => { const u = Object.values(d.users)[0]; u.powerups = { fifty: 1, skip: 0, time: 0, shield: 0 }; });
  await a.go('/rush');
  await a.page.locator('[data-testid="rush-start"]').click();
  await a.page.locator('[data-testid="rush-q"]').waitFor({ timeout: 6000 });
  await a.page.locator('[data-testid="pu-fifty"]').click();
  a.assert.strictEqual(await a.page.locator('[data-testid="rush-opt"]').count(), 2);
  for (let i = 0; i < 3; i++) { await good(a, 'rush-opt'); await a.page.waitForTimeout(600); }
  a.assert.ok(/^3/.test((await a.page.locator('main, .page').first().innerText()).match(/\d+ ⚡/)?.[0] || ''), 'score 3');
  const u = Object.values((await a.db()).users)[0];
  a.assert.strictEqual(u.powerups.fifty, 0);
});
t('rush : fin de partie, score au classement du jour', async a => {
  // la partie dure 60 s : on attend la fin réelle
  await a.page.waitForFunction(() => document.querySelector('[data-testid="rush-over"]'), null, { timeout: 75000 });
  a.assert.strictEqual((await a.page.locator('[data-testid="rush-score"]').innerText()).trim(), '3');
  await a.page.waitForTimeout(600);
  const u = Object.values((await a.db()).users)[0];
  a.assert.strictEqual(u.rushDay.best, 3);
  a.assert.ok(u.totalXP >= 1006, 'xp ' + u.totalXP);
  const lb = Object.values((await a.db()).leaderboard || {})[0];
  a.assert.strictEqual(lb.rushScore, 3);
  a.assert.ok(await a.page.locator('[data-testid="rush-row"]').count() >= 1);
});
t('boss héroïque : bouton après une victoire, 2× PV, récompenses', async a => {
  await setU(a, d => { const u = Object.values(d.users)[0]; u.bossWins = { minotaure: 1 }; u.heroWins = {}; u.gemsBonus = 0; u.unlocked = []; u.powerups = { fifty: 0, skip: 0, time: 0, shield: 1 }; });
  await a.go('/boss');
  a.assert.ok(await a.page.locator('[data-testid="boss-hero-btn"]').count() === 1);
  await a.go('/boss/minotaure?mode=h');
  await a.page.locator('[data-testid="hero-badge"]').waitFor({ timeout: 5000 });
  a.assert.ok(/200 PV/.test(await a.body()), '200 PV');
  // bouclier : une erreur ne coûte pas de cœur
  await a.page.locator('[data-testid="pu-shield"]').click();
  const wrong = a.page.locator('[data-testid="boss-opt"]');
  const n = await wrong.count();
  for (let i = 0; i < n; i++) if ((await wrong.nth(i).innerText()).trim() !== 'Bonne') { await wrong.nth(i).click(); break; }
  await a.page.waitForTimeout(300);
  const bd = await a.body(); a.assert.ok((bd.match(/❤/g) || []).length === 3 && !/🖤/.test(bd), 'cœurs intacts');
  await a.page.locator('[data-testid="boss-next"]').click();
  for (let k = 0; k < 40; k++) {
    if (await a.page.locator('[data-testid="boss-over"]').count()) break;
    await good(a, 'boss-opt', 1500).catch(() => {});
    const nx = a.page.locator('[data-testid="boss-next"]');
    await a.page.waitForTimeout(250);
    if (await nx.count()) await nx.click({ timeout: 1500 }).catch(() => {});
  }
  await a.page.locator('[data-testid="boss-over"]').waitFor({ timeout: 8000 });
  await a.page.locator('[data-testid="hero-reward"]').waitFor({ timeout: 4000 });
  await a.page.waitForTimeout(500);
  const u = Object.values((await a.db()).users)[0];
  a.assert.ok(u.unlocked.includes('t_h_minotaure'), JSON.stringify(u.unlocked));
  a.assert.strictEqual(u.heroWins.minotaure, 1);
  a.assert.strictEqual(u.gemsBonus, 30);
  a.assert.strictEqual(u.powerups.shield, 0);
});
module.exports = { tests, seed };
