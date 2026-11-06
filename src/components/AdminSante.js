import React, { useState, useMemo } from 'react';
import { S } from './adminStyles';
import { QuestionForm } from './AdminForms';
import { questionOrigin } from './AdminReports';
import { normText } from '../utils/csv';

const MIN_QUIZ = 10;      // nombre de questions attendu par quiz
const MIN_PLAYS = 10;     // vues minimum avant de juger une question

// Retire les guillemets droits ou courbes qui entourent un texte (pas les « » français)
const EDGE_Q = /^[\s"“”]+|[\s"“”]+$/g;
function cleanText(t) {
  const x = String(t ?? '');
  // On ne retire que si le texte est entouré de guillemets des deux côtés
  return /^\s*["“].*["”]\s*$/.test(x) ? x.replace(EDGE_Q, '') : t;
}
function cleanedFields(q) {
  const data = {};
  const opts = (q.options || []).map(cleanText);
  if (opts.some((o, i) => o !== q.options[i])) data.options = opts;
  const t = cleanText(q.text);
  if (t !== q.text) data.text = t;
  const e = cleanText(q.explanation);
  if (e !== q.explanation) data.explanation = e;
  return data;
}

function csvCell(v) { return `"${String(v ?? '').replace(/"/g, '""')}"`; }

function download(name, content, type) {
  const blob = new Blob(['﻿' + content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AdminSante({ questions, quizzes, cats, themes, reports, stats, statsOk, onSaveQuestion, onDeleteQuestion, onBulkUpdate, setTab, ok }) {
  const [editId, setEditId] = useState(null);
  const [cleaning, setCleaning] = useState(false);

  const data = useMemo(() => {
    const countByQuiz = {};
    questions.forEach(q => { if (q.quizId) countByQuiz[q.quizId] = (countByQuiz[q.quizId] || 0) + 1; });

    const catLabel = id => cats.find(c => c.id === id)?.label || id;
    const themeLabel = id => themes.find(t => t.id === id)?.label || id;

    const smallQuizzes = quizzes
      .map(z => ({ ...z, n: countByQuiz[z.id] || 0 }))
      .filter(z => z.n < MIN_QUIZ)
      .sort((a, b) => a.n - b.n);

    const emptyThemes = themes.filter(t => !quizzes.some(z => z.themeId === t.id) || !questions.some(q => q.theme === t.id));

    // Doublons dans la base (même texte normalisé)
    const byText = {};
    questions.forEach(q => { const k = normText(q.text); (byText[k] = byText[k] || []).push(q); });
    const dups = Object.values(byText).filter(g => g.length > 1);

    // Questions les plus signalées
    const rep = {};
    reports.forEach(r => { if (r.questionId) rep[r.questionId] = (rep[r.questionId] || 0) + 1; });
    const reported = Object.entries(rep)
      .map(([id, n]) => ({ q: questions.find(x => x.id === id), n }))
      .filter(x => x.q).sort((a, b) => b.n - a.n).slice(0, 10);

    // Anomalies de difficulté
    const anomalies = questions.map(q => {
      const s = stats[q.id];
      if (!s || s.plays < MIN_PLAYS) return null;
      const rate = Math.round(100 * (s.correct || 0) / s.plays);
      let why = null;
      if (rate < 20) why = 'Très peu de bonnes réponses : réponse fausse ou question ambiguë ?';
      else if (q.diff === 'easy' && rate < 50) why = 'Classée facile mais souvent ratée';
      else if (q.diff === 'hard' && rate > 90) why = 'Classée difficile mais presque toujours réussie';
      else if (q.diff === 'medium' && (rate < 25 || rate > 95)) why = 'Niveau moyen mal calibré';
      return why ? { q, rate, plays: s.plays, why } : null;
    }).filter(Boolean).sort((a, b) => a.rate - b.rate);

    // Questions mal importées : explication coupée (virgule dans un champ non guillemeté), guillemets parasites dans les options
    const broken = questions.map(q => {
      const why = [];
      const e = (q.explanation || '').trim();
      if (e && !/[.!?)»"…]$/.test(e)) why.push(/[\d,;:]$/.test(e) ? 'explication coupée' : 'explication sans point final');
      if ((q.options || []).some(o => /^["“«]|["”»]$/.test(String(o).trim()))) why.push('guillemets dans les options');
      if ((q.options || []).some(o => !String(o).trim())) why.push('option vide');
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= (q.options || []).length) why.push('bonne réponse invalide');
      return why.length ? { q, why: why.join(' · ') } : null;
    }).filter(Boolean);

    const cleanable = questions.map(q => ({ q, data: cleanedFields(q) })).filter(x => Object.keys(x.data).length);

    const unlinked = questions.filter(q => !q.quizId).length;
    const tracked = questions.filter(q => stats[q.id]?.plays >= MIN_PLAYS).length;
    return { cleanable, countByQuiz, smallQuizzes, emptyThemes, dups, reported, anomalies, broken, unlinked, tracked, catLabel, themeLabel };
  }, [questions, quizzes, cats, themes, reports, stats]);

  const { cleanable, countByQuiz, smallQuizzes, emptyThemes, dups, reported, anomalies, broken, unlinked, tracked, catLabel, themeLabel } = data;
  const problems = smallQuizzes.length + emptyThemes.length + dups.length + anomalies.length + broken.length + (unlinked ? 1 : 0);

  function exportCSV() {
    const header = ['categorie', 'theme', 'difficulte', 'question', 'optionA', 'optionB', 'optionC', 'optionD', 'reponse_correcte', 'explication', 'quiz'];
    const rows = questions.map(q => {
      const quiz = quizzes.find(z => z.id === q.quizId);
      const o = q.options || [];
      return [q.category, q.theme, q.diff, q.text, o[0], o[1], o[2], o[3], q.answer ?? 0, q.explanation || '', quiz?.name || '']
        .map(csvCell).join(',');
    });
    download(`quizly_questions_${new Date().toISOString().slice(0, 10)}.csv`, [header.map(csvCell).join(','), ...rows].join('\n'), 'text/csv');
    ok(`✓ ${questions.length} questions exportées (réimportables en CSV)`);
  }

  function exportJSON() {
    const clean = arr => arr.map(({ createdAt, ...x }) => x);
    const all = { exportedAt: new Date().toISOString(), questions: clean(questions), quizzes: clean(quizzes), categories: cats, themes, reports: clean(reports) };
    download(`quizly_sauvegarde_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(all, null, 2), 'application/json');
    ok('✓ Sauvegarde complète téléchargée');
  }

  const Section = ({ title, count, children, good }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ ...S.secLabel, margin: '0 0 8px' }}>
        {title} <span style={{ color: count ? 'var(--yellow)' : 'var(--cyan)' }}>{count ? `(${count})` : '✓'}</span>
      </div>
      {count === 0 ? <div style={{ fontSize: 12, color: 'var(--muted)' }}>{good}</div> : children}
    </div>
  );

  return (
    <div>
      <div style={{ ...S.card, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
          {problems === 0 ? '✅ Tout est en ordre' : `🩺 ${problems} point${problems > 1 ? 's' : ''} à regarder`}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
          {questions.length} questions · {quizzes.length} quiz · {tracked} questions avec assez de parties pour être jugées
        </div>
      </div>

      <Section title={`Quiz avec moins de ${MIN_QUIZ} questions`} count={smallQuizzes.length} good="Tous les quiz ont leurs questions.">
        {smallQuizzes.map(z => (
          <div key={z.id} style={{ ...S.card, ...S.row }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{z.name}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>{catLabel(z.catId)} › {themeLabel(z.themeId)} · {z.diff}</div>
            </div>
            <span style={S.tag(z.n === 0 ? '#FF4D4D' : '#FFC857')}>{z.n}/{MIN_QUIZ}</span>
          </div>
        ))}
      </Section>

      <Section title="Thèmes vides (sans quiz ou sans question)" count={emptyThemes.length} good="Aucun thème vide.">
        {emptyThemes.map(t => (
          <div key={t.id} style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{t.icon} {t.label}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>
              {catLabel(t.catId)} · {quizzes.filter(z => z.themeId === t.id).length} quiz · {questions.filter(q => q.theme === t.id).length} questions
            </div>
          </div>
        ))}
      </Section>

      <Section title="Questions sans quiz" count={unlinked ? 1 : 0} good="Toutes les questions sont rattachées à un quiz.">
        <div style={S.card}>
          <span style={{ fontSize: 12 }}>{unlinked} question(s) ne sont dans aucun quiz (jamais jouées). </span>
          <span style={{ fontSize: 12, color: 'var(--cyan)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setTab('lier')}>Les lier</span>
        </div>
      </Section>

      <Section title="Questions mal importées (texte coupé, guillemets…)" count={broken.length || (cleanable.length ? 1 : 0)} good="Aucune anomalie de format détectée.">
        {cleanable.length > 0 && (
          <div style={{ ...S.card, borderColor: 'var(--cyan)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>🧹 {cleanable.length} question(s) ont des guillemets en trop</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
              Aperçu : {cleanable.slice(0, 3).map(({ q, data }) => {
                const before = (q.options || []).find((o, i) => data.options && o !== data.options[i]) ?? q.text;
                const after = data.options ? data.options[(q.options || []).findIndex((o, i) => o !== data.options[i])] : data.text;
                return `${before} → ${after}`;
              }).join(' · ')}
            </div>
            <button className="btn btn-primary" disabled={cleaning} style={{ padding: '6px 14px', fontSize: 12 }} onClick={async () => {
              if (!window.confirm(`Retirer les guillemets en trop sur ${cleanable.length} question(s) ?`)) return;
              setCleaning(true);
              try { await onBulkUpdate(cleanable.map(({ q, data }) => ({ id: q.id, data }))); ok(`✓ ${cleanable.length} questions nettoyées`); }
              catch (e) { console.error(e); ok('⚠️ Nettoyage impossible'); }
              setCleaning(false);
            }}>{cleaning ? '…' : `🧹 Tout nettoyer (${cleanable.length})`}</button>
          </div>
        )}
        {broken.slice(0, 40).map(({ q, why }) => (
          <div key={q.id} style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{q.text}</div>
            <div style={{ fontSize: 10, color: 'var(--cyan)', marginTop: 3 }}>📍 {questionOrigin(q, null, cats, themes, quizzes)}</div>
            <div style={{ fontSize: 10, color: 'var(--yellow)', margin: '3px 0 6px' }}>⚠️ {why}</div>
            {editId === q.id ? (
              <QuestionForm q={q} onSave={async d => { await onSaveQuestion(q, d); setEditId(null); }} onCancel={() => setEditId(null)} />
            ) : (
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
                  {q.options?.map((o, i) => <div key={i} style={{ color: i === q.answer ? 'var(--cyan)' : undefined }}>{['A', 'B', 'C', 'D'][i]}. {o}{i === q.answer ? ' ✓' : ''}</div>)}
                  {q.explanation && <div style={{ marginTop: 4 }}>💡 {q.explanation}</div>}
                </div>
                <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => setEditId(q.id)}>✏️ Corriger</button>
              </div>
            )}
          </div>
        ))}
        {broken.length > 40 && <div style={{ fontSize: 11, color: 'var(--muted)' }}>+{broken.length - 40} autres</div>}
      </Section>

      <Section title="Questions en double dans la base" count={dups.length} good="Aucun doublon.">
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, lineHeight: 1.6 }}>
          Pour ne pas laisser un quiz à 9 questions : <strong>✏️ Modifie</strong> un des exemplaires pour en faire une nouvelle question du même thème et du même niveau.
          Ne supprime que si le quiz garde ses 10 questions.
        </div>
        {dups.slice(0, 15).map((g, i) => (
          <div key={i} style={{ ...S.card, borderColor: 'var(--yellow)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{g[0].text} <span style={{ color: 'var(--yellow)' }}>· {g.length} exemplaires</span></div>
            {g.map((q, k) => {
              const nQuiz = q.quizId ? (countByQuiz[q.quizId] || 0) : null;
              const sameQuiz = q.quizId && g.filter(x => x.quizId === q.quizId).length > 1;
              return (
                <div key={q.id} style={{ background: 'var(--s2)', borderRadius: 9, padding: '8px 10px', marginTop: 6 }}>
                  <div style={{ fontSize: 10, color: 'var(--cyan)' }}>
                    Exemplaire {k + 1} · 📍 {questionOrigin(q, null, cats, themes, quizzes)}
                  </div>
                  <div style={{ fontSize: 10, color: nQuiz !== null && nQuiz <= MIN_QUIZ ? 'var(--yellow)' : 'var(--muted)', margin: '2px 0 4px' }}>
                    {nQuiz === null ? 'Dans aucun quiz (jamais jouée)' : `Son quiz compte ${nQuiz} question${nQuiz > 1 ? 's' : ''}${nQuiz <= MIN_QUIZ ? ` → ${nQuiz - 1} si tu la supprimes` : ''}`}
                    {sameQuiz && <strong style={{ color: '#FF4D4D' }}> · doublon dans le MÊME quiz</strong>}
                  </div>
                  {editId === q.id ? (
                    <QuestionForm q={q} onSave={async d => { await onSaveQuestion(q, d); setEditId(null); }} onCancel={() => setEditId(null)} />
                  ) : (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
                        {q.options?.map((o, n) => <div key={n} style={{ color: n === q.answer ? 'var(--cyan)' : undefined }}>{['A', 'B', 'C', 'D'][n]}. {o}{n === q.answer ? ' ✓' : ''}</div>)}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => setEditId(q.id)}>✏️ Modifier (en faire une autre)</button>
                        <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 11, color: '#FF4D4D' }} onClick={async () => {
                          const warn = nQuiz !== null && nQuiz <= MIN_QUIZ ? `\n\nAttention : son quiz passera à ${nQuiz - 1} question(s).` : '';
                          if (!window.confirm(`Supprimer cet exemplaire ?${warn}`)) return;
                          await onDeleteQuestion(q);
                        }}>🗑 Supprimer</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {dups.length > 15 && <div style={{ fontSize: 11, color: 'var(--muted)' }}>+{dups.length - 15} autres (corrige ceux-ci, la liste se met à jour)</div>}
      </Section>

      <Section title="Questions les plus signalées" count={reported.length} good="Aucun signalement en attente.">
        {reported.map(({ q, n }) => (
          <div key={q.id} style={S.card}>
            <div style={S.row}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{q.text}</div>
              <span style={S.tag('#FF4D4D')}>🚩 {n}</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--cyan)', marginTop: 3 }}>📍 {questionOrigin(q, null, cats, themes, quizzes)}</div>
          </div>
        ))}
        <div style={{ fontSize: 11, color: 'var(--cyan)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setTab('reports')}>Voir les signalements</div>
      </Section>

      <Section title="Questions au niveau douteux (taux de réussite)" count={anomalies.length}
        good={statsOk ? `Rien d'anormal pour l'instant (jugement à partir de ${MIN_PLAYS} parties par question).` : 'Stats indisponibles : publie les règles Firestore mises à jour.'}>
        {anomalies.slice(0, 30).map(({ q, rate, plays, why }) => (
          <div key={q.id} style={S.card}>
            <div style={S.row}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{q.text}</div>
              <span style={S.tag(rate < 20 ? '#FF4D4D' : '#FFC857')}>{rate} %</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--cyan)', marginTop: 3 }}>📍 {questionOrigin(q, null, cats, themes, quizzes)}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', margin: '3px 0 6px' }}>
              {plays} parties · {why}
            </div>
            {editId === q.id ? (
              <QuestionForm q={q} onSave={async d => { await onSaveQuestion(q, d); setEditId(null); }} onCancel={() => setEditId(null)} />
            ) : (
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
                  {q.options?.map((o, i) => <div key={i} style={{ color: i === q.answer ? 'var(--cyan)' : undefined }}>{['A', 'B', 'C', 'D'][i]}. {o}{i === q.answer ? ' ✓' : ''}</div>)}
                </div>
                <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => setEditId(q.id)}>✏️ Corriger</button>
              </div>
            )}
          </div>
        ))}
      </Section>

      <div style={S.divider} />
      <div style={S.secLabel}>Sauvegarde</div>
      <div style={S.card}>
        <div style={{ fontSize: 12, marginBottom: 8 }}>
          Télécharge ta base avant toute suppression en masse. Le CSV se réimporte tel quel (Ajouter → Import CSV questions) ; le JSON contient tout (questions, quiz, catégories, thèmes, signalements).
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={exportCSV}>⬇️ Questions (CSV)</button>
          <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={exportJSON}>⬇️ Sauvegarde complète (JSON)</button>
        </div>
      </div>
    </div>
  );
}
