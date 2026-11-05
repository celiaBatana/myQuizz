import React, { useState } from 'react';
import { S } from './adminStyles';

// ── Formulaire édition question ───────────────────────────────────────────────
export function QuestionForm({ q, onSave, onCancel }) {
  const [text, setText] = useState(q.text);
  const [opts, setOpts] = useState([...q.options]);
  const [ans, setAns]   = useState(q.answer);
  const [expl, setExpl] = useState(q.explanation || '');
  const [diff, setDiff] = useState(q.diff);
  const inp = { width: '100%', background: 'var(--s2)', border: '1px solid var(--purple)', borderRadius: 8, padding: '7px 10px', color: 'var(--text)', fontFamily: 'Josefin Sans', fontSize: 12, outline: 'none', marginBottom: 7 };
  return (
    <div>
      <textarea style={{ ...inp, minHeight: 56, resize: 'vertical' }} value={text} onChange={e => setText(e.target.value)} />
      <select style={inp} value={diff} onChange={e => setDiff(e.target.value)}>
        <option value="easy">Facile</option><option value="medium">Moyen</option><option value="hard">Expert</option>
      </select>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 7 }}>
        {opts.map((o, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <input value={o} onChange={e => { const a = [...opts]; a[i] = e.target.value; setOpts(a); }}
              style={{ ...inp, marginBottom: 0, paddingRight: 28, borderColor: ans === i ? 'var(--cyan)' : 'var(--purple)' }} />
            <button type="button" onClick={() => setAns(i)} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 11, cursor: 'pointer', color: 'var(--cyan)', opacity: ans === i ? 1 : 0.3 }}>✓</button>
          </div>
        ))}
      </div>
      <label style={{ fontSize:10, color:'var(--muted)', marginBottom:3, display:'block' }}>Explication</label>
      <textarea style={{ ...inp, minHeight:60, resize:'vertical' }} value={expl} onChange={e => setExpl(e.target.value)} placeholder="Explication de la bonne réponse..." />
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => onSave({ text, options: opts, answer: ans, explanation: expl, diff })}>Enregistrer</button>
        <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}

// ── Formulaire édition quiz ───────────────────────────────────────────────────
export function QuizForm({ quiz, cats, themes, onSave, onCancel }) {
  const [name,    setName]    = useState(quiz.name);
  const [diff,    setDiff]    = useState(quiz.diff);
  const [catId,   setCatId]   = useState(quiz.catId);
  const [themeId, setThemeId] = useState(quiz.themeId);
  const inp = { width: '100%', background: 'var(--s2)', border: '1px solid var(--purple)', borderRadius: 8, padding: '7px 10px', color: 'var(--text)', fontFamily: 'Josefin Sans', fontSize: 12, outline: 'none', marginBottom: 7 };
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <select style={inp} value={catId} onChange={e => { setCatId(e.target.value); setThemeId(''); }}>
          {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
        <select style={inp} value={themeId} onChange={e => setThemeId(e.target.value)}>
          <option value="">Thème</option>
          {themes.filter(t => t.catId === catId).map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>
      <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Nom du quiz" />
      <select style={inp} value={diff} onChange={e => setDiff(e.target.value)}>
        <option value="easy">Facile</option><option value="medium">Moyen</option><option value="hard">Expert</option>
      </select>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => onSave({ name, diff, catId, themeId })}>Enregistrer</button>
        <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}

// ── Édition inline ────────────────────────────────────────────────────────────
export function InlineEdit({ data, fields, onSave, onCancel }) {
  const [form, setForm] = useState({ ...data });
  const inp = { width: '100%', background: 'var(--s2)', border: '1px solid var(--purple)', borderRadius: 8, padding: '7px 10px', color: 'var(--text)', fontFamily: 'Josefin Sans', fontSize: 12, outline: 'none', marginBottom: 6 };
  return (
    <div>
      {fields.map(f => <input key={f} style={inp} value={form[f] || ''} onChange={e => setForm({ ...form, [f]: e.target.value })} placeholder={f} />)}
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => onSave(form)}>Enregistrer</button>
        <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}
