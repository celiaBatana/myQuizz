// Mises de duel : paiement avant de jouer, gain / perte / égalité, remboursement
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => {
  const s = b();
  for (let i = 1; i <= 6; i++) s.questions['mq' + i] = { text: `Q${i} ?`, options: ['Bonne', 'F1', 'F2', 'F3'], answer: 0, explanation: '', diff: 'easy', category: 'sport', theme: 'football', active: true };
  return s;
};
const ids = ['mq1', 'mq2', 'mq3', 'mq4', 'mq5', 'mq6'];
t('mise : affichée, payée avant de jouer', async a => {
  await a.signup();
  await a.page.evaluate(`(() => { const d = window.__DB(); const me = Object.keys(d.users)[0]; d.users[me].onboarded = true; d.users[me].totalXP = 1000; d.users[me].gemsSpent = 0;
    d.duels = d.duels || {}; d.duels.dp = { questionIds: ${JSON.stringify(ids)}, cat: 'all', diff: 'all', creatorUid: 'alice', creatorName: 'Alice', invitedUid: me, invitedName: 'Moi', stake: 25 };
    localStorage.setItem('fakedb', JSON.stringify(d)); })()`);
  await a.go('/duel/dp');
  await a.page.locator('[data-testid="stake-info"]').waitFor({ timeout: 6000 });
  await a.page.locator('[data-testid="stake-pay"]').click(); await a.page.waitForTimeout(600);
  const u = Object.values((await a.db()).users)[0];
  a.assert.strictEqual(u.gemsSpent, 25); a.assert.strictEqual(u.duelStakes.dp.s, 25);
});
t('mise : le gagnant empoche 2× la mise', async a => {
  await a.page.evaluate(`(() => { const d = window.__DB(); const me = Object.keys(d.users)[0]; d.users[me].gemsBonus = 0;
    d.duels.dw = { questionIds: ${JSON.stringify(ids)}, cat: 'all', diff: 'all', creatorUid: 'alice', creatorName: 'Alice', invitedUid: me, invitedName: 'Moi', stake: 25 };
    d.users[me].duelStakes = { dw: { s: 25 } };
    d.duel_results = d.duel_results || {};
    d.duel_results['dw_' + me] = { uid: me, name: 'Moi', duelId: 'dw', score: 8, total: 10 };
    d.duel_results.dw_alice = { uid: 'alice', name: 'Alice', duelId: 'dw', score: 5, total: 10 };
    localStorage.setItem('fakedb', JSON.stringify(d)); })()`);
  await a.go('/duel/dw');
  await a.page.locator('[data-testid="stake-result"]').waitFor({ timeout: 6000 });
  a.assert.ok(/remportes 50/.test(await a.page.locator('[data-testid="stake-result"]').innerText()));
  await a.page.waitForTimeout(500);
  const u = Object.values((await a.db()).users)[0];
  a.assert.strictEqual(u.gemsBonus, 50); a.assert.strictEqual(u.duelStakes.dw.settled, 'win');
});
t('mise : perdant ne reçoit rien, égalité rembourse', async a => {
  await a.page.evaluate(`(() => { const d = window.__DB(); const me = Object.keys(d.users)[0]; d.users[me].gemsBonus = 0;
    d.duels.dl = { questionIds: ${JSON.stringify(ids)}, cat: 'all', diff: 'all', creatorUid: 'alice', invitedUid: me, stake: 10 };
    d.duels.dd = { questionIds: ${JSON.stringify(ids)}, cat: 'all', diff: 'all', creatorUid: 'alice', invitedUid: me, stake: 10 };
    d.users[me].duelStakes = { dl: { s: 10 }, dd: { s: 10 } };
    d.duel_results['dl_' + me] = { uid: me, duelId: 'dl', score: 2, total: 10 }; d.duel_results.dl_alice = { uid: 'alice', duelId: 'dl', score: 6, total: 10 };
    d.duel_results['dd_' + me] = { uid: me, duelId: 'dd', score: 4, total: 10 }; d.duel_results.dd_alice = { uid: 'alice', duelId: 'dd', score: 4, total: 10 };
    localStorage.setItem('fakedb', JSON.stringify(d)); })()`);
  await a.go('/duel/dl'); await a.page.waitForTimeout(1500);
  a.assert.ok(/perds/.test(await a.page.locator('[data-testid="stake-result"]').innerText()));
  await a.go('/duel/dd'); await a.page.waitForTimeout(1500);
  a.assert.ok(/Égalité/.test(await a.page.locator('[data-testid="stake-result"]').innerText()));
  const u = Object.values((await a.db()).users)[0];
  a.assert.strictEqual(u.gemsBonus, 10);
});
t('mise : remboursement si l\'autre n\'a pas joué après 48 h', async a => {
  await a.page.evaluate(`(() => { const d = window.__DB(); const me = Object.keys(d.users)[0]; d.users[me].gemsBonus = 0;
    d.duels.dr = { questionIds: ${JSON.stringify(ids)}, cat: 'all', diff: 'all', creatorUid: me, invitedUid: 'alice', invitedName: 'Alice', stake: 25, createdAt: { seconds: Math.floor(Date.now() / 1000) - 3 * 86400 } };
    d.users[me].duelStakes = { dr: { s: 25 } };
    d.duel_results['dr_' + me] = { uid: me, duelId: 'dr', score: 7, total: 10 };
    localStorage.setItem('fakedb', JSON.stringify(d)); })()`);
  await a.go('/duel/dr');
  await a.page.locator('[data-testid="stake-refund"]').click({ timeout: 6000 }); await a.page.waitForTimeout(500);
  const u = Object.values((await a.db()).users)[0];
  a.assert.strictEqual(u.gemsBonus, 25);
});
module.exports = { tests, seed };
