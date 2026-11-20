// Admin → Organisation : renommer, ajouter, déplacer, masquer, et effet côté joueurs
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => {
  const s = b();
  s.quizzes.zq = { catId: 'sport', themeId: 'football', name: 'Quiz foot', diff: 'easy' };
  s.questions.o1 = { text: 'Question A ?', options: ['A', 'B', 'C', 'D'], answer: 0, explanation: '', diff: 'easy', category: 'sport', theme: 'football', quizId: 'zq', active: true };
  s.questions.o2 = { text: 'Question B ?', options: ['A', 'B', 'C', 'D'], answer: 1, explanation: '', diff: 'easy', category: 'sport', theme: 'football', quizId: 'zq', active: true };
  return s;
};
t('organisation : renommer, créer, déplacer', async a => {
  const { page } = a;
  await a.signup('Adm', 'a@a.fr');
  await a.patchDb(d => { const u = Object.values(d.users)[0]; u.isAdmin = true; u.onboarded = true; });
  await a.go('/admin'); await page.locator('text=Organisation').first().click(); await page.waitForTimeout(700);

  // renommer la catégorie sport
  await page.locator('[data-testid="org-cat-sport"] [data-testid="org-cat-edit"]').first().click();
  await page.locator('[data-testid="org-edit-input"]').fill('Sports du monde');
  await page.locator('[data-testid="org-edit-save"]').click(); await page.waitForTimeout(800);
  let d = await a.db();
  a.assert.strictEqual(d.categories.sport.label, 'Sports du monde');

  // nouvelle catégorie + nouveau thème dedans
  await page.locator('[data-testid="org-add-cat"]').click();
  await page.locator('[data-testid="org-add-input"]').fill('Mythologie');
  await page.locator('[data-testid="org-add-ok"]').click(); await page.waitForTimeout(800);
  d = await a.db();
  a.assert.ok(d.categories.mythologie && d.categories.mythologie.label === 'Mythologie', 'catégorie créée (id = slug)');
  await page.locator('[data-testid="org-cat-mythologie"] >> text=Mythologie').first().click(); await page.waitForTimeout(300);
  await page.locator('[data-testid="org-add-theme"]').click();
  await page.locator('[data-testid="org-add-input"]').fill('Dieux grecs');
  await page.locator('[data-testid="org-add-ok"]').click(); await page.waitForTimeout(800);
  d = await a.db();
  a.assert.strictEqual(d.themes.dieux_grecs.catId, 'mythologie');

  // déplacer le thème football (avec son quiz et ses questions) vers Mythologie
  await page.locator('[data-testid="org-cat-sport"] >> text=Sports du monde').first().click(); await page.waitForTimeout(300);
  await page.locator('[data-testid="org-theme-football"] [data-testid="org-theme-move"]').first().click();
  await page.locator('[data-testid="org-theme-target"]').selectOption('mythologie');
  await page.locator('[data-testid="org-theme-move-ok"]').click(); await page.waitForTimeout(300);
  await page.locator('[data-testid="org-confirm-ok"]').click(); await page.waitForTimeout(1200);
  d = await a.db();
  a.assert.strictEqual(d.themes.football.catId, 'mythologie');
  a.assert.strictEqual(d.themes.football.cardCat, 'sport', 'catégorie d\'origine gardée pour les cartes');
  a.assert.strictEqual(d.quizzes.zq.catId, 'mythologie');
  a.assert.strictEqual(d.questions.o1.category, 'mythologie');

  // côté joueur : la catégorie renommée et la nouvelle sont visibles
  await a.go('/'); await page.waitForTimeout(1200);
  const body = await a.body();
  a.assert.ok(/Sports du monde/.test(body) && /Mythologie/.test(body), 'accueil mis à jour');
});
t('organisation : déplacer un quiz et des questions, masquer', async a => {
  const { page } = a;
  await a.go('/admin'); await page.locator('text=Organisation').first().click(); await page.waitForTimeout(700);
  await page.locator('[data-testid="org-cat-mythologie"] >> text=Mythologie').first().click(); await page.waitForTimeout(300);
  await page.locator('[data-testid="org-theme-dieux_grecs"] >> text=Dieux grecs').first().click(); await page.waitForTimeout(200);
  await page.locator('[data-testid="org-add-quiz"]').click();
  await page.locator('[data-testid="org-add-input"]').fill('Quiz Zeus');
  await page.locator('[data-testid="org-add-ok"]').click(); await page.waitForTimeout(800);
  let d = await a.db();
  const zeus = Object.entries(d.quizzes).find(([, z]) => z.name === 'Quiz Zeus');
  a.assert.ok(zeus && zeus[1].themeId === 'dieux_grecs' && zeus[1].catId === 'mythologie', 'quiz créé');
  // déplacer 1 question de « Quiz foot » vers « Quiz Zeus »
  await page.locator('[data-testid="org-theme-football"] >> text=Football').first().click(); await page.waitForTimeout(200);
  await page.locator('[data-testid="org-quiz-zq"] >> text=Quiz foot').first().click(); await page.waitForTimeout(200);
  await page.locator('[data-testid="org-q"] input[type=checkbox]').first().check();
  await page.locator('[data-testid="org-q-target"]').selectOption(zeus[0]);
  await page.locator('[data-testid="org-q-move"]').click(); await page.waitForTimeout(1000);
  d = await a.db();
  const moved = Object.values(d.questions).filter(q => q.quizId === zeus[0]);
  a.assert.strictEqual(moved.length, 1); a.assert.strictEqual(moved[0].theme, 'dieux_grecs');
  // masquer la catégorie Mythologie → plus visible chez les joueurs
  await page.locator('[data-testid="org-cat-mythologie"] button:has-text("🙈")').first().click(); await page.waitForTimeout(800);
  d = await a.db(); a.assert.strictEqual(d.categories.mythologie.hidden, true);
  await a.go('/'); await page.waitForTimeout(1200);
  a.assert.ok(!/Mythologie/.test(await a.body()), 'catégorie masquée');
});
module.exports = { tests, seed };
