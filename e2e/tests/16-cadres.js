// Cadres d'avatar visibles chez les autres joueurs
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => {
  const s = b();
  s.leaderboard = { lina: { uid: 'lina', name: 'Lina', totalXP: 900, level: 5, avatar: 'a_fox', frame: 'f_s1_b', weekKey: '2000-01-03', weekXP: 10, events: [{ k: '🔥', t: 'série de 7 jours', at: Date.now() - 60000 }] } };
  return s;
};
t('fil d\'activité : le cadre de l\'ami est affiché', async a => {
  await a.signup();
  await a.patchDb(d => { const me = Object.keys(d.users)[0]; d.users[me].onboarded = true; d.friend_requests = { x: { fromUid: 'lina', toUid: me, fromName: 'Lina', toName: 'Moi', status: 'accepted' } }; });
  await a.page.evaluate(() => sessionStorage.clear());
  await a.go('/'); await a.page.waitForTimeout(2000);
  const n = await a.page.locator('[data-testid="avatar"][data-frame="f_s1_b"]').count(); a.assert.ok(n >= 1, 'n=' + n + ' ' + (await a.page.locator('[data-testid="activity"]').innerText().catch(() => 'no feed')));
});
t('classement : le cadre est affiché', async a => {
  await a.go('/classement'); await a.page.getByText('Général', { exact: true }).click(); await a.page.waitForTimeout(1200);
  a.assert.ok(await a.page.locator('[data-testid="avatar"][data-frame="f_s1_b"]').count() >= 1);
});
module.exports = { tests, seed };
