// Catégories de l'accueil : progression
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => { const s = b(); s.quizzes.zC1 = { catId: 'sport', themeId: 'football', name: 'Q1', diff: 'easy' }; s.quizzes.zC2 = { catId: 'sport', themeId: 'football', name: 'Q2', diff: 'medium' }; s.questions.zC1_q0 = { text: 'x?', options: ['a', 'b'], answer: 0, diff: 'easy', category: 'sport', theme: 'football', quizId: 'zC1', active: true }; return s; };
t('progression par catégorie (1 quiz réussi sur 2 = 50 %)', async a => {
  await a.signup();
  await a.page.evaluate(() => { const d = window.__DB(); const u = Object.keys(d.users)[0]; d.users[u].bestScores = { zC1: 80 }; localStorage.setItem('fakedb', JSON.stringify(d)); });
  await a.go('/');
  await a.page.waitForTimeout(800);
  a.assert.ok(await a.page.locator('[data-testid="cat-card"]').count() >= 15);
  a.assert.ok(/1\/2 réussis/.test(await a.body()), (await a.body()).slice(-300));
});
module.exports = { tests, seed };
