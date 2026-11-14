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
  await a.patchDb(d => { d.friend_requests = { [`bob_${u}`]: { fromUid: 'bob', toUid: u, fromName: 'Bob', toName: 'Testeur', status: 'pending' } }; });
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
module.exports = { tests, seed };
