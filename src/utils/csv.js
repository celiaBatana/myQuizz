export function parseCSV(text) {
  const rows = []; let row = [], cur = '', inQ = false;
  const t = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQ) {
      if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      row.push(cur); cur = '';
      if (row.some(x => x.trim())) rows.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur);
  if (row.some(x => x.trim())) rows.push(row);
  return rows;
}

// Clé de comparaison pour détecter les doublons (insensible à la casse, aux accents et à la ponctuation)
export function normText(t) {
  return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

// ── Export ── (même format que l'import : on peut le réimporter tel quel)
const esc = v => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
export const toCSV = rows => rows.map(r => r.map(esc).join(',')).join('\r\n');

export function questionsToCSV(questions, quizzes) {
  const qz = Object.fromEntries(quizzes.map(q => [q.id, q.name]));
  const head = ['categorie', 'theme', 'difficulte', 'question', 'optA', 'optB', 'optC', 'optD', 'reponse', 'explication', 'quiz', 'id'];
  const rows = [...questions]
    .sort((a, b) => (a.category + a.theme + a.diff).localeCompare(b.category + b.theme + b.diff))
    .map(q => [q.category, q.theme, q.diff, q.text, ...[0, 1, 2, 3].map(i => (q.options || [])[i] || ''), q.answer ?? 0, q.explanation || '', qz[q.quizId] || '', q.id]);
  return toCSV([head, ...rows]);
}

// Inventaire : combien de questions et de quiz par catégorie / thème / difficulté
export function inventoryCSV(questions, quizzes) {
  const m = {};
  const row = (c, t, d) => (m[`${c}|${t}|${d}`] = m[`${c}|${t}|${d}`] || { c, t, d, q: 0, z: 0 });
  questions.forEach(q => { row(q.category, q.theme, q.diff).q++; });
  quizzes.forEach(z => { row(z.catId, z.themeId, z.diff).z++; });
  const rows = Object.values(m).sort((a, b) => (a.c + a.t + a.d).localeCompare(b.c + b.t + b.d)).map(r => [r.c, r.t, r.d, r.q, r.z]);
  return toCSV([['categorie', 'theme', 'difficulte', 'nb_questions', 'nb_quiz'], ...rows]);
}

export function downloadText(name, text) {
  const url = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
