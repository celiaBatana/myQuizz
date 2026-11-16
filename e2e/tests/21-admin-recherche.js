// Admin : recherche, filtres, export avec id, import de corrections
const tests = [];
const t = (n, f) => tests.push([n, f]);
const seed = b => {
  const s = b();
  s.quizzes.zq = { catId: 'histoire', themeId: 'geo_monde', name: 'Pays et Frontières', diff: 'medium' };
  s.quizzes.zr = { catId: 'cinema', themeId: 'musique', name: 'Pop et Rock', diff: 'easy' };
  s.questions.m1 = { text: 'Quel est le nom de la mer entre l\'Italie et la Grèce ?', options: ['Mer Tyrrhénienne', 'Mer Adriatique', 'Mer Ionienne', 'Mer Égée'], answer: 1, explanation: 'Ionienne.', diff: 'medium', category: 'histoire', theme: 'geo_monde', quizId: 'zq', active: true };
  s.questions.m2 = { text: 'Quel groupe a chanté Hotel California ?', options: ['Eagles', 'Doors', 'Queen', 'ABBA'], answer: 0, explanation: '', diff: 'easy', category: 'cinema', theme: 'musique', quizId: 'zr', active: true };
  return s;
};
const openQ = async a => { await a.go('/admin'); await a.page.locator('text=Questions (').first().click(); await a.page.waitForTimeout(700); };
t('recherche et filtres', async a => {
  await a.signup('Adm', 'a@a.fr');
  await a.patchDb(d => { const u = Object.values(d.users)[0]; u.isAdmin = true; u.onboarded = true; });
  await openQ(a);
  await a.page.locator('[data-testid="q-search"]').fill('ionienne');
  await a.page.waitForTimeout(300);
  let b = await a.body();
  a.assert.ok(/mer entre l'Italie/i.test(b) && !/Hotel California/.test(b), 'recherche sur une option');
  await a.page.locator('[data-testid="q-search"]').fill('pop rock');
  await a.page.waitForTimeout(300);
  b = await a.body();
  a.assert.ok(/Hotel California/.test(b) && !/mer entre/i.test(b), 'recherche sur le nom du quiz');
  await a.page.locator('[data-testid="q-search"]').fill('');
  await a.page.locator('[data-testid="q-quiz"]').selectOption({ label: 'Pays et Frontières (medium)' });
  await a.page.waitForTimeout(300);
  b = await a.body();
  a.assert.ok(/mer entre/i.test(b) && !/Hotel California/.test(b), 'filtre quiz');
  a.assert.ok(/✓ Mer Adriatique/.test(b), 'bonne réponse affichée');
});
t('import de corrections par ancienne question', async a => {
  const rows = [
    ['categorie', 'theme', 'difficulte', 'question', 'optA', 'optB', 'optC', 'optD', 'reponse', 'explication', 'quiz', 'id', 'ancienne_question'],
    ['histoire', 'geo_monde', 'medium', "Quelle mer sépare le sud de l'Italie de la Grèce ?", 'Mer Tyrrhénienne', 'Mer Adriatique', 'Mer Ionienne', 'Mer Égée', '2', 'La mer Ionienne.', '', '', "Quel est le nom de la mer entre l'Italie et la Grèce ?"],
    ['cinema', 'musique', 'easy', 'Question corrigée ?', 'A', 'B', 'C', 'D', '1', '', '', 'm2', ''],
    ['cinema', 'musique', 'easy', 'Introuvable ?', 'A', 'B', 'C', 'D', '0', '', '', 'zzz', ''],
  ].map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
  require('fs').writeFileSync('/tmp/corr.csv', rows);
  const before = Object.keys((await a.db()).questions).length;
  await openQ(a);
  await a.page.locator('text=Ajouter').first().click(); await a.page.waitForTimeout(500);
  await a.page.locator('#csv-q-in').setInputFiles('/tmp/corr.csv');
  await a.page.waitForTimeout(500);
  await a.page.locator('text=Importer 3 questions').click(); await a.page.waitForTimeout(1200);
  const db = await a.db();
  a.assert.strictEqual(db.questions.m1.text, "Quelle mer sépare le sud de l'Italie de la Grèce ?");
  a.assert.strictEqual(db.questions.m1.answer, 2);
  a.assert.strictEqual(db.questions.m1.quizId, 'zq');
  a.assert.strictEqual(db.questions.m2.text, 'Question corrigée ?');
  a.assert.strictEqual(Object.keys(db.questions).length, before, 'pas de nouvelle question créée');
  a.assert.ok(/2 questions corrigées/.test(await a.body()) && /1 introuvable/.test(await a.body()));
});
module.exports = { tests, seed };
