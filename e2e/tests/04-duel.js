// Duel : nouvelle manche, bandeau « manche suivante », redirection de l'ancien lien
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => {
  const s = b();
  s.duels = { d1: { questionIds: Array.from({ length: 10 }, (_, i) => `z1_q${i}`), cat: 'culture', diff: 'all', creatorUid: 'ami', creatorName: 'Zoé' } };
  return s;
};
const uid = async a => Object.keys((await a.db()).users)[0];

t('manche déjà jouée : bouton « Nouvelle manche »', async a => {
  await a.signup();
  const u = await uid(a);
  await a.patchDb(d => { d.duel_results = d.duel_results || {}; });
  await a.page.evaluate(u => { const d = window.__DB(); d.duel_results = d.duel_results || {}; d.duel_results['d1_' + u] = { uid: u, name: 'Testeur', duelId: 'd1', score: 7, total: 10 }; localStorage.setItem('fakedb', JSON.stringify(d)); }, u);
  await a.go('/duel/d1');
  a.assert.ok(/Tu as déjà joué/.test(await a.body()) && /Nouvelle manche/.test(await a.body()), (await a.body()).slice(0, 300));
});
t('« Nouvelle manche » crée la manche 2 et la relie à la manche 1', async a => {
  await a.page.locator('[data-testid="next-round-new"]').click(); await a.page.waitForTimeout(1500);
  const d = (await a.db()).duels; const ids = Object.keys(d);
  a.assert.strictEqual(ids.length, 2, 'deux duels');
  const n = ids.find(x => x !== 'd1');
  a.assert.strictEqual(d.d1.nextId, n); a.assert.strictEqual(d[n].prevId, 'd1'); a.assert.strictEqual(d[n].round, 2);
  a.assert.strictEqual(d[n].questionIds.length, 10);
  a.assert.ok(!d[n].questionIds.some(q => d.d1.questionIds.includes(q)), 'questions différentes');
  a.assert.ok(a.page.url().endsWith('/duel/' + n), a.page.url());
  a.assert.ok(/manche 2/.test(await a.body()), (await a.body()).slice(0, 200));
});
t('l\'ancien lien mène à la dernière manche', async a => {
  const n = (await a.db()).duels.d1.nextId;
  await a.go('/duel/d1'); await a.page.waitForTimeout(600);
  a.assert.ok(a.page.url().endsWith('/duel/' + n), a.page.url());
});
t('bandeau « Manche suivante disponible » pour qui est sur les résultats', async a => {
  await a.patchDb(d => { d.duels.d9 = { questionIds: Object.keys(d.questions).slice(0, 10), cat: 'culture', diff: 'all', creatorUid: 'ami', creatorName: 'Zoé' }; });
  const u = await uid(a);
  await a.page.evaluate(u => { const d = window.__DB(); d.duel_results['d9_' + u] = { uid: u, name: 'Testeur', duelId: 'd9', score: 5, total: 10 }; localStorage.setItem('fakedb', JSON.stringify(d)); }, u);
  await a.go('/duel/d9');
  a.assert.ok(await a.page.locator('[data-testid="next-round-new"]').count() === 1, 'bouton nouvelle manche');
  await a.patchDb(d => { d.duels.d9.nextId = 'dX'; d.duels.dX = { questionIds: Object.keys(d.questions).slice(10, 20), cat: 'culture', diff: 'all', creatorUid: 'ami', creatorName: 'Zoé', round: 2, prevId: 'd9' }; });
  await a.page.waitForTimeout(3800);
  a.assert.ok(/Manche suivante disponible/.test(await a.body()), (await a.body()).slice(0, 300));
  await a.page.locator('[data-testid="next-round-join"]').click(); await a.page.waitForTimeout(800);
  a.assert.ok(a.page.url().endsWith('/duel/dX'), a.page.url());
});
module.exports = { tests, seed };
