import React, { useState } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { S } from './adminStyles';
import { QuestionForm } from './AdminForms';

const DIFF_FR = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' };

// Catégorie › Thème › Quiz · Niveau d'une question
export function questionOrigin(q, r, cats = [], themes = [], quizzes = []) {
  if (!q) return r?.quizName ? `Quiz : ${r.quizName}` : '';
  const cat = cats.find(c => c.id === q.category);
  const th = themes.find(t => t.id === q.theme);
  const quiz = quizzes.find(z => z.id === q.quizId) || (r?.quizName ? { name: r.quizName } : null);
  return [
    cat ? `${cat.icon || ''} ${cat.label}`.trim() : q.category,
    th ? th.label : q.theme,
    quiz ? quiz.name : 'sans quiz',
  ].filter(Boolean).join(' › ') + (q.diff ? ` · ${DIFF_FR[q.diff] || q.diff}` : '');
}

export default function AdminReports({ reports, setReports, questions, cats, themes, quizzes, onSaveQuestion, onDeleteQuestion, ok }) {
  const [editId, setEditId] = useState(null);

  async function resolve(r) {
    await deleteDoc(doc(db, 'reports', r.id));
    setReports(p => p.filter(x => x.id !== r.id));
    ok('✓ Signalement résolu');
  }

  async function removeQuestion(r, q) {
    if (!window.confirm('Supprimer définitivement cette question ?')) return;
    await onDeleteQuestion(q);
    await resolve(r);
  }

  if (reports.length === 0) {
    return <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 30, fontSize: 13 }}>Aucun signalement 🎉</div>;
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>{reports.length} signalement(s) de joueurs</div>
      {reports.map(r => {
        const q = questions.find(x => x.id === r.questionId);
        return (
          <div key={r.id} style={S.card}>
            <div style={{ fontSize: 11, color: 'var(--yellow)', fontWeight: 700, marginBottom: 4 }}>🚩 {r.reason || 'Signalé'}</div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{q?.text || r.text || '(question introuvable)'}</div>
            <div style={{ fontSize: 10, color: 'var(--cyan)', marginBottom: 6 }}>📍 {questionOrigin(q, r, cats, themes, quizzes) || 'Origine inconnue'}</div>
            {q && (
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
                {q.options?.map((o, i) => <div key={i} style={{ color: i === q.answer ? 'var(--cyan)' : undefined }}>{['A', 'B', 'C', 'D'][i]}. {o}{i === q.answer ? ' ✓' : ''}</div>)}
                {q.explanation && <div style={{ marginTop: 4 }}>💡 {q.explanation}</div>}
              </div>
            )}
            {q && editId === r.id ? (
              <QuestionForm q={q} onSave={async data => { await onSaveQuestion(q, data); setEditId(null); }} onCancel={() => setEditId(null)} />
            ) : (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {q && <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => setEditId(r.id)}>✏️ Corriger</button>}
                <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => resolve(r)}>✓ Ignorer / résolu</button>
                {q && <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 11, background: '#FF4D4D' }} onClick={() => removeQuestion(r, q)}>Supprimer la question</button>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
