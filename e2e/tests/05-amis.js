// Amis : code, demandes, acceptation
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => {
  const s = b();
  s.friend_codes = { ZOE234: { uid: 'zoe', name: 'Zoé' } };
  s.leaderboard = Object.assign(s.leaderboard || {}, { zoe: { uid: 'zoe', name: 'Zoé', level: 3 } });
  return s;
};
const uid = async a => Object.keys((await a.db()).users)[0];

t('la page Amis crée mon code', async a => {
  await a.signup(); await a.go('/amis'); await a.page.waitForTimeout(800);
  const c = (await a.page.locator('[data-testid="my-code"]').innerText()).trim();
  a.assert.ok(/^[A-Z2-9]{6}$/.test(c), c);
  a.assert.ok(Object.keys((await a.db()).friend_codes).includes(c));
});
t('ajout par code → demande envoyée', async a => {
  const u = await uid(a);
  await a.page.locator('[data-testid="friend-input"]').fill('zoe234');
  await a.page.locator('[data-testid="friend-add"]').click(); await a.page.waitForTimeout(800);
  const r = (await a.db()).friend_requests;
  a.assert.ok(r && r[`${u}_zoe`] && r[`${u}_zoe`].status === 'pending', JSON.stringify(r));
  a.assert.ok(/en attente/.test(await a.body()));
});
t('demande reçue → accepter → ami + bouton Défier', async a => {
  const u = await uid(a);
  await a.page.evaluate(u => { const d = window.__DB(); d.friend_requests = d.friend_requests || {}; d.friend_requests['bob_' + u] = { fromUid: 'bob', toUid: u, fromName: 'Bob', toName: 'Testeur', status: 'pending' }; localStorage.setItem('fakedb', JSON.stringify(d)); }, u);
  await a.go('/amis'); await a.page.waitForTimeout(800);
  a.assert.strictEqual(await a.page.locator('[data-testid="friend-incoming"]').count(), 1);
  await a.page.locator('[data-testid="friend-accept"]').click(); await a.page.waitForTimeout(800);
  a.assert.strictEqual((await a.db()).friend_requests[`bob_${u}`].status, 'accepted');
  a.assert.strictEqual(await a.page.locator('[data-testid="friend-challenge"]').count(), 1);
});
t('ajout par pseudo exact', async a => {
  await a.patchDb(d => { d.leaderboard.max = { uid: 'max', name: 'Max', level: 2 }; });
  await a.go('/amis'); await a.page.waitForTimeout(500);
  await a.page.locator('[data-testid="friend-input"]').fill('Max');
  await a.page.locator('[data-testid="friend-add"]').click(); await a.page.waitForTimeout(800);
  a.assert.ok(Object.keys((await a.db()).friend_requests).some(k => k.endsWith('_max')));
});
t('Défier crée un duel avec invitedUid', async a => {
  await a.go('/amis'); await a.page.waitForTimeout(600);
  await a.page.locator('[data-testid="friend-challenge"]').first().click(); await a.page.waitForTimeout(500);
  a.assert.ok(/duel=bob/.test(a.page.url()), a.page.url());
  await a.page.getByText('Créer le duel').click(); await a.page.waitForTimeout(1500);
  const d = Object.values((await a.db()).duels || {});
  a.assert.ok(d.some(x => x.invitedUid === 'bob'), JSON.stringify(d).slice(0, 200));
});
t('invitation visible sur l\'accueil', async a => {
  const u = await uid(a);
  await a.page.evaluate(u => { const d = window.__DB(); d.duels = d.duels || {}; d.duels.inv1 = { questionIds: [], cat: 'all', diff: 'all', creatorUid: 'zoe', creatorName: 'Zoé', invitedUid: u }; localStorage.setItem('fakedb', JSON.stringify(d)); }, u);
  await a.go('/'); await a.page.waitForTimeout(800);
  a.assert.strictEqual(await a.page.locator('[data-testid="duel-invite"]').count(), 1);
});
t('bandeau en haut pour une demande reçue + accepter', async a => {
  const u = await uid(a);
  await a.page.evaluate(u => { const d = window.__DB(); d.friend_requests = d.friend_requests || {}; d.friend_requests['cam_' + u] = { fromUid: 'cam', toUid: u, fromName: 'Cam', toName: 'Testeur', status: 'pending' }; localStorage.setItem('fakedb', JSON.stringify(d)); }, u);
  await a.go('/classement'); await a.page.waitForTimeout(900);
  a.assert.strictEqual(await a.page.locator('[data-testid="friend-banner"]').count(), 1);
  await a.page.locator('[data-testid="banner-accept"]').click(); await a.page.waitForTimeout(900);
  a.assert.strictEqual((await a.db()).friend_requests['cam_' + u].status, 'accepted');
  a.assert.strictEqual(await a.page.locator('[data-testid="friend-banner"]').count(), 0);
});
t('popup des défis reçus → Relever mène au bon duel', async a => {
  await a.go('/classement'); await a.page.waitForTimeout(900);
  a.assert.strictEqual(await a.page.locator('[data-testid="duel-popup"]').count(), 1);
  await a.page.locator('[data-testid="popup-accept"]').click(); await a.page.waitForTimeout(600);
  a.assert.ok(a.page.url().endsWith('/duel/inv1'), a.page.url());
});
t('duel : « pas encore joué » puis score de l\'autre dès qu\'il a fini', async a => {
  const u = await uid(a);
  await a.page.evaluate(u => { const d = window.__DB(); d.duels.inv1.invitedUid = 'zoe'; d.duels.inv1.invitedName = 'Zoé'; d.duel_results = d.duel_results || {}; d.duel_results['inv1_' + u] = { uid: u, name: 'Testeur', duelId: 'inv1', score: 6, total: 10 }; localStorage.setItem('fakedb', JSON.stringify(d)); }, u);
  await a.go('/duel/inv1'); await a.page.waitForTimeout(800);
  a.assert.ok(await a.page.locator('[data-testid="duel-waiting"]').count() === 1, (await a.body()).slice(0, 300));
  await a.patchDb(d => { d.duel_results.inv1_zoe = { uid: 'zoe', name: 'Zoé', duelId: 'inv1', score: 8, total: 10 }; });
  await a.page.waitForTimeout(4600);
  a.assert.ok(/8\/10/.test(await a.body()) && await a.page.locator('[data-testid="duel-waiting"]').count() === 0, (await a.body()).slice(0, 300));
});
module.exports = { tests, seed };
