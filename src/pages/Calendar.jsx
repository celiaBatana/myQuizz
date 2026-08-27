import { useState, useEffect } from "react";
import {
  collection, addDoc, deleteDoc, updateDoc,
  doc, onSnapshot, serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

const CATEGORIES = {
  vacances:      { label: "Vacances",      icon: "🌴", color: "#3DFFD0" },
  travail:       { label: "Travail",       icon: "💼", color: "#9B6DFF" },
  loisirs:       { label: "Loisirs",       icon: "🎉", color: "#FFE14D" },
  administratif: { label: "Administratif", icon: "📋", color: "#FF7A3D" },
  sport:         { label: "Sport",         icon: "⚽", color: "#FF5FA0" },
};

const USER_SHAPES = ["●", "▲", "■", "◆", "★", "⬟"];
const USER_COLORS = ["#FF5FA0", "#3DFFD0", "#FFE14D", "#9B6DFF", "#FF7A3D", "#378ADD"];
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MOIS  = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const ROW_H = 56; // px par heure

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfMonth(y, m) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - day);
  return d;
}
function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}
function timeToY(t) { return (timeToMinutes(t) / 60) * ROW_H; }
function timeDuration(s, e) {
  if (!s || !e) return ROW_H;
  const diff = (timeToMinutes(e) - timeToMinutes(s)) / 60;
  return Math.max(diff * ROW_H, ROW_H * 0.4);
}

export default function Calendar() {
  const today = new Date();
  const [users,       setUsers]       = useState([]);
  const [allEvents,   setAllEvents]   = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [view,        setView]        = useState("month");
  const [curDate,     setCurDate]     = useState(today);
  const [selectedDay, setSelDay]      = useState(null);
  const [modal,       setModal]       = useState(null);
  const [filterUsers, setFU]          = useState([]);
  const [filterCats,  setFC]          = useState([]);
  const [form,        setForm]        = useState({ title:"", cat:"vacances", userIds:[], dateStart:"", dateEnd:"", timeStart:"", timeEnd:"", allDay:true, note:"" });
  const [editId,      setEditId]      = useState(null);
  const [uName,       setUName]       = useState("");

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'calendar_users'), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubEvts = onSnapshot(
      query(collection(db, 'calendar_events'), orderBy('dateStart')),
      snap => { setAllEvents(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoadingData(false); },
      () => setLoadingData(false)
    );
    return () => { unsubUsers(); unsubEvts(); };
  }, []);

  const events = allEvents.filter(e => {
    if (filterUsers.length && !e.userIds?.some(u => filterUsers.includes(u))) return false;
    if (filterCats.length  && !filterCats.includes(e.cat)) return false;
    return true;
  });

  function eventsOnDay(key) {
    return events
      .filter(e => {
        const s = e.dateStart, en = e.dateEnd || e.dateStart;
        return key >= s && key <= en;
      })
      .sort((a, b) => {
        // Journées entières en premier
        if ((a.allDay || !a.timeStart) && !(b.allDay || !b.timeStart)) return -1;
        if (!(a.allDay || !a.timeStart) && (b.allDay || !b.timeStart)) return 1;
        // Puis trier par heure
        return timeToMinutes(a.timeStart) - timeToMinutes(b.timeStart);
      });
  }

  async function addUser() {
    if (!uName.trim()) return;
    const idx = users.length % USER_COLORS.length;
    await addDoc(collection(db, 'calendar_users'), { name: uName.trim(), color: USER_COLORS[idx], shape: USER_SHAPES[idx] });
    setUName("");
  }

  async function deleteUser(id) {
    await deleteDoc(doc(db, 'calendar_users', id));
    for (const e of allEvents.filter(ev => ev.userIds?.includes(id))) {
      await updateDoc(doc(db, 'calendar_events', e.id), { userIds: e.userIds.filter(u => u !== id) });
    }
  }

  function openNewEvent(dateStr, prefill = {}) {
    setForm({
      title:     prefill.title     || "",
      cat:       prefill.cat       || "vacances",
      userIds:   prefill.userIds   || (users.length === 1 ? [users[0].id] : []),
      dateStart: dateStr           || toKey(today),
      dateEnd:   dateStr           || toKey(today),
      timeStart: prefill.timeStart || "",
      timeEnd:   prefill.timeEnd   || "",
      allDay:    prefill.allDay !== undefined ? prefill.allDay : true,
      note:      "",
    });
    setEditId(null);
    setModal("event");
  }

  function openEditEvent(e) {
    setForm({ title: e.title, cat: e.cat, userIds: [...(e.userIds||[])], dateStart: e.dateStart, dateEnd: e.dateEnd || e.dateStart, timeStart: e.timeStart||"", timeEnd: e.timeEnd||"", allDay: e.allDay !== false, note: e.note||"" });
    setEditId(e.id);
    setModal("event");
  }

  async function saveEvent() {
    if (!form.title.trim() || !form.dateStart) return;
    const payload = { ...form, updatedAt: serverTimestamp() };
    if (editId) {
      await updateDoc(doc(db, 'calendar_events', editId), payload);
    } else {
      await addDoc(collection(db, 'calendar_events'), { ...payload, createdAt: serverTimestamp() });
    }
    setModal(null);
  }

  async function deleteEvent(id) {
    await deleteDoc(doc(db, 'calendar_events', id));
    setModal(null);
  }

  function prev() {
    if (view === "month") setCurDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    else setCurDate(d => addDays(d, -7));
  }
  function next() {
    if (view === "month") setCurDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    else setCurDate(d => addDays(d, 7));
  }

  // ── Calcul colonnes pour chevauchement ────────────────────────────────────
  function computeColumns(evts) {
    // Trier par heure de début
    const sorted = [...evts].sort((a, b) => timeToMinutes(a.timeStart) - timeToMinutes(b.timeStart));
    const cols = []; // cols[i] = minute de fin du dernier event dans colonne i

    return sorted.map(e => {
      const endMin = timeToMinutes(e.timeEnd || addOneHour(e.timeStart));
      let col = 0;
      while (cols[col] !== undefined && cols[col] > timeToMinutes(e.timeStart)) col++;
      cols[col] = endMin;
      return { ...e, col };
    });
  }

  // ── Render mois ───────────────────────────────────────────────────────────
  function renderMonth() {
    const y = curDate.getFullYear(), m = curDate.getMonth();
    const total = daysInMonth(y, m), first = firstDayOfMonth(y, m);
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(new Date(y, m, d));
    return (
      <div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:2 }}>
          {JOURS.map(j => <div key={j} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:"var(--muted)", padding:"6px 0", textTransform:"uppercase", letterSpacing:".06em" }}>{j}</div>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
          {cells.map((date, i) => {
            if (!date) return <div key={i} />;
            const key = toKey(date), dayEvts = eventsOnDay(key);
            const isToday = key === toKey(today), isSel = key === selectedDay;
            return (
              <div key={key} onClick={() => { setSelDay(key); setModal("day"); }}
                style={{ minHeight:70, borderRadius:10, padding:"5px 5px 3px", background: isSel?"rgba(155,109,255,.18)":"var(--s1)", border:`1px solid ${isToday||isSel?"var(--purple)":"var(--s2)"}`, cursor:"pointer", transition:"all .15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor="var(--purple)"}
                onMouseLeave={e => !isToday && !isSel && (e.currentTarget.style.borderColor="var(--s2)")}>
                <div style={{ fontSize:11, fontWeight:isToday?800:500, color:isToday?"var(--purple)":"var(--text)", marginBottom:3, textAlign:"right" }}>
                  {isToday ? <span style={{ background:"var(--purple)", color:"#fff", borderRadius:"50%", width:18, height:18, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:10 }}>{date.getDate()}</span> : date.getDate()}
                </div>
                {dayEvts.slice(0,3).map(e => <EventPill key={e.id} event={e} users={users} compact />)}
                {dayEvts.length > 3 && <div style={{ fontSize:9, color:"var(--muted)", paddingLeft:2 }}>+{dayEvts.length-3}</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Render semaine avec vue horaire ───────────────────────────────────────
  function renderWeek() {
    const start = startOfWeek(curDate);
    const days  = Array.from({ length:7 }, (_, i) => addDays(start, i));
    const HOURS = Array.from({ length:24 }, (_, i) => i);
    const COL_W = 120;

    return (
      <div style={{ overflowX:"auto", overflowY:"auto", maxHeight:"72vh", position:"relative", borderRadius:12, border:"1px solid var(--s2)" }}>
        {/* Header jours — sticky */}
        <div style={{ display:"grid", gridTemplateColumns:`44px repeat(7, ${COL_W}px)`, position:"sticky", top:0, zIndex:20, background:"var(--bg,#0f0e17)", borderBottom:"1px solid var(--s2)" }}>
          <div style={{ borderRight:"1px solid var(--s2)" }} />
          {days.map((date, idx) => {
            const key = toKey(date), isToday = key === toKey(today);
            return (
              <div key={key} style={{ textAlign:"center", padding:"8px 4px", borderRight:"1px solid var(--s2)" }}>
                <div style={{ fontSize:10, color:"var(--muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>{JOURS[idx]}</div>
                <div style={{ marginTop:2, display:"inline-flex", alignItems:"center", justifyContent:"center",
                  width:24, height:24, borderRadius:"50%",
                  background: isToday ? "var(--purple)" : "transparent",
                  color: isToday ? "#fff" : "var(--text)",
                  fontSize:13, fontWeight:800 }}>{date.getDate()}</div>
              </div>
            );
          })}
        </div>

        {/* Corps horaire */}
        <div style={{ display:"grid", gridTemplateColumns:`44px repeat(7, ${COL_W}px)` }}>
          {/* Colonne heures */}
          <div style={{ borderRight:"1px solid var(--s2)" }}>
            {HOURS.map(h => (
              <div key={h} style={{ height:ROW_H, display:"flex", alignItems:"flex-start", justifyContent:"flex-end", paddingRight:6, paddingTop:3, borderTop: h===0?"none":"1px solid rgba(255,255,255,.05)" }}>
                <span style={{ fontSize:9, color:"var(--muted)", fontWeight:500 }}>{h===0?"":String(h).padStart(2,'0')+"h"}</span>
              </div>
            ))}
          </div>

          {/* Colonnes jours */}
          {days.map((date) => {
            const key       = toKey(date);
            const dayEvts   = eventsOnDay(key);
            const timedEvts = dayEvts.filter(e => !e.allDay && e.timeStart);
            const allDayEvts= dayEvts.filter(e => e.allDay || !e.timeStart);
            const withCols  = computeColumns(timedEvts);
            const totalCols = withCols.length > 0 ? Math.max(...withCols.map(e => e.col + 1)) : 1;

            return (
              <div key={key} style={{ borderRight:"1px solid var(--s2)", position:"relative", height: 24 * ROW_H }}>
                {/* Lignes horaires cliquables */}
                {HOURS.map(h => (
                  <div key={h} style={{
                    position:"absolute", top: h * ROW_H, left:0, right:0, height:ROW_H,
                    borderTop: h===0?"none":"1px solid rgba(255,255,255,.05)",
                    cursor:"pointer", zIndex:1,
                  }}
                    onClick={() => {
                      const ts = String(h).padStart(2,'0') + ":00";
                      const te = h < 23 ? String(h+1).padStart(2,'0') + ":00" : "23:59";
                      setSelDay(key);
                      openNewEvent(key, { allDay:false, timeStart:ts, timeEnd:te });
                    }}
                    onMouseEnter={e => e.currentTarget.style.background="rgba(155,109,255,.06)"}
                    onMouseLeave={e => e.currentTarget.style.background=""}
                  />
                ))}

                {/* Events journée entière */}
                {allDayEvts.map(e => {
                  const cat = CATEGORIES[e.cat] || CATEGORIES.loisirs;
                  return (
                    <div key={e.id} onClick={() => openEditEvent(e)}
                      style={{ position:"absolute", top:2, left:2, right:2, zIndex:5,
                        background:cat.color+"33", borderLeft:`2px solid ${cat.color}`,
                        borderRadius:4, padding:"2px 5px", fontSize:10, fontWeight:600, cursor:"pointer",
                        whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {cat.icon} {e.title}
                    </div>
                  );
                })}

                {/* Events horaires — zIndex inversement proportionnel à l'heure */}
                {withCols.map(e => {
                  const cat    = CATEGORIES[e.cat] || CATEGORIES.loisirs;
                  const top    = timeToY(e.timeStart);
                  const height = timeDuration(e.timeStart, e.timeEnd);
                  const colW   = 100 / totalCols;
                  const left   = `calc(${e.col * colW}% + 1px)`;
                  const width  = `calc(${colW}% - 2px)`;
                  // zIndex basé sur heure : 09h → zIndex 1009, 20h → zIndex 980
                  // Ainsi les events du matin sont visuellement au-dessus
                  const zIdx   = 1000 - timeToMinutes(e.timeStart);
                  const evtUsers = users.filter(u => e.userIds?.includes(u.id));
                  return (
                    <div key={e.id} onClick={() => openEditEvent(e)}
                      style={{
                        position:"absolute", top, left, width, height,
                        zIndex: zIdx,
                        background: cat.color + "30",
                        borderLeft: `3px solid ${cat.color}`,
                        borderRadius: 6,
                        padding: "3px 5px",
                        cursor: "pointer",
                        overflow: "hidden",
                        boxSizing: "border-box",
                      }}
                      onMouseEnter={el => { el.currentTarget.style.opacity=".75"; el.currentTarget.style.zIndex=2000; }}
                      onMouseLeave={el => { el.currentTarget.style.opacity="1"; el.currentTarget.style.zIndex=zIdx; }}
                    >
                      <div style={{ fontSize:9, fontWeight:700, color:cat.color, lineHeight:1.3, whiteSpace:"nowrap" }}>
                        {e.timeStart}{e.timeEnd ? ` → ${e.timeEnd}` : ""}
                      </div>
                      <div style={{ fontSize:11, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", color:"var(--text)" }}>
                        {cat.icon} {e.title}
                      </div>
                      {evtUsers.length > 0 && (
                        <div style={{ fontSize:9, marginTop:1 }}>
                          {evtUsers.map(u => <span key={u.id} style={{ color:u.color, marginRight:2 }}>{u.shape}</span>)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function navTitle() {
    if (view === "month") return `${MOIS[curDate.getMonth()]} ${curDate.getFullYear()}`;
    const start = startOfWeek(curDate), end = addDays(start, 6);
    return `${start.getDate()} – ${end.getDate()} ${MOIS[end.getMonth()]} ${end.getFullYear()}`;
  }

  function renderDayModal() {
    if (!selectedDay) return null;
    const d = parseDate(selectedDay);
    const sorted = [...eventsOnDay(selectedDay)].sort((a, b) => {
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;
      return timeToMinutes(a.timeStart) - timeToMinutes(b.timeStart);
    });
    return (
      <ModalWrap onClose={() => setModal(null)} wide>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ fontFamily:"'Raleway',sans-serif", fontWeight:800, fontSize:16 }}>
            {d.toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })}
          </div>
          <span style={{ fontSize:11, color:"var(--muted)", background:"var(--s2)", padding:"3px 8px", borderRadius:6 }}>
            {sorted.length} événement{sorted.length > 1 ? "s" : ""}
          </span>
        </div>
        {sorted.length === 0
          ? <div style={{ textAlign:"center", color:"var(--muted)", padding:"12px 0 16px", fontSize:13 }}>Aucun événement ce jour</div>
          : sorted.map(e => {
              const cat = CATEGORIES[e.cat] || CATEGORIES.loisirs;
              return (
                <div key={e.id} style={{ background:cat.color+"18", border:`1px solid ${cat.color}44`, borderLeft:`3px solid ${cat.color}`, borderRadius:8, padding:"9px 11px", marginBottom:7, cursor:"pointer" }}
                  onClick={() => openEditEvent(e)}
                  onMouseEnter={el => el.currentTarget.style.opacity=".8"}
                  onMouseLeave={el => el.currentTarget.style.opacity="1"}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:3 }}>
                    <div style={{ fontWeight:700, fontSize:13 }}>{cat.icon} {e.title}</div>
                    {!e.allDay && e.timeStart
                      ? <span style={{ fontSize:11, fontWeight:700, color:cat.color, background:cat.color+"22", padding:"2px 7px", borderRadius:6, whiteSpace:"nowrap" }}>{e.timeStart}{e.timeEnd?` → ${e.timeEnd}`:""}</span>
                      : <span style={{ fontSize:10, color:"var(--muted)", background:"var(--s2)", padding:"2px 7px", borderRadius:6 }}>Journée</span>
                    }
                  </div>
                  <div style={{ fontSize:11, color:"var(--muted)", display:"flex", gap:8, flexWrap:"wrap" }}>
                    <span>{cat.label}</span>
                    {e.dateStart !== e.dateEnd && <span>→ {e.dateEnd}</span>}
                    {e.userIds?.length > 0 && <span>{e.userIds.map(uid => users.find(u=>u.id===uid)?.name).filter(Boolean).join(", ")}</span>}
                  </div>
                  {e.note && <div style={{ fontSize:11, color:"var(--muted)", marginTop:4, fontStyle:"italic" }}>{e.note}</div>}
                </div>
              );
            })
        }
        <QuickAdd
          dateStr={selectedDay} users={users}
          onAdd={async (evt) => { await addDoc(collection(db, 'calendar_events'), { ...evt, createdAt: serverTimestamp() }); }}
          onOpenFull={(prefill) => { setModal(null); setTimeout(() => openNewEvent(selectedDay, prefill), 50); }}
        />
      </ModalWrap>
    );
  }

  function renderEventModal() {
    return (
      <ModalWrap onClose={() => setModal(null)} wide>
        <div style={{ fontFamily:"'Raleway',sans-serif", fontWeight:800, fontSize:16, marginBottom:14 }}>
          {editId ? "Modifier l'événement" : "Nouvel événement"}
        </div>
        <label style={lbl}>Titre</label>
        <input style={inp} value={form.title} onChange={e => setForm(f=>({...f, title:e.target.value}))} placeholder="Ex: Réunion, Congés, Cinéma…" />
        <label style={lbl}>Catégorie</label>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <div key={k} onClick={() => setForm(f=>({...f, cat:k}))} style={{ padding:"6px 12px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", background:form.cat===k?v.color:"var(--s2)", color:form.cat===k?"#0f0e17":"var(--muted)", border:`1px solid ${form.cat===k?v.color:"var(--s2)"}`, transition:"all .15s" }}>{v.icon} {v.label}</div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
          <div><label style={lbl}>Début</label><input type="date" style={inp} value={form.dateStart} onChange={e => setForm(f=>({...f, dateStart:e.target.value, dateEnd:e.target.value>f.dateEnd?e.target.value:f.dateEnd}))} /></div>
          <div><label style={lbl}>Fin</label><input type="date" style={inp} value={form.dateEnd} onChange={e => setForm(f=>({...f, dateEnd:e.target.value}))} min={form.dateStart} /></div>
        </div>
        {users.length > 0 && <>
          <label style={lbl}>Participants</label>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
            {users.map(u => {
              const sel = form.userIds.includes(u.id);
              return <div key={u.id} onClick={() => setForm(f=>({...f, userIds:sel?f.userIds.filter(x=>x!==u.id):[...f.userIds,u.id]}))} style={{ padding:"6px 12px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${sel?u.color:"var(--s2)"}`, background:sel?u.color+"22":"var(--s2)", color:sel?u.color:"var(--muted)", transition:"all .15s" }}><span style={{ marginRight:4 }}>{u.shape}</span>{u.name}</div>;
            })}
          </div>
        </>}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, padding:"9px 12px", background:"var(--s2)", borderRadius:9 }}>
          <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:600 }}>Journée entière</div><div style={{ fontSize:10, color:"var(--muted)" }}>Désactive pour ajouter des horaires</div></div>
          <label className="toggle"><input type="checkbox" checked={form.allDay} onChange={e => setForm(f=>({...f, allDay:e.target.checked, timeStart:"", timeEnd:""}))} /><span className="toggle-slider" /></label>
        </div>
        {!form.allDay && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            <div>
              <label style={lbl}>Heure de début</label>
              <TimeInput value={form.timeStart} onChange={v => {
                const endAuto = addOneHour(v);
                setForm(f => ({ ...f, timeStart:v, timeEnd: f.timeEnd && f.timeEnd > v ? f.timeEnd : endAuto }));
              }} />
            </div>
            <div>
              <label style={lbl}>Heure de fin</label>
              <TimeInput value={form.timeEnd} onChange={v => setForm(f=>({...f, timeEnd:v}))} />
            </div>
          </div>
        )}
        <label style={lbl}>Note (optionnel)</label>
        <textarea style={{ ...inp, minHeight:56, resize:"vertical" }} value={form.note} onChange={e => setForm(f=>({...f, note:e.target.value}))} placeholder="Détails, lieu, lien…" />
        <div style={{ display:"flex", gap:8, marginTop:4 }}>
          <button className="btn btn-primary" style={{ flex:1, fontFamily:"'Raleway'", fontWeight:700 }} onClick={saveEvent}>{editId ? "Enregistrer" : "Ajouter"}</button>
          {editId && <button className="btn btn-secondary" style={{ padding:"0 14px", color:"var(--pink)", fontFamily:"'Raleway'", fontWeight:700 }} onClick={() => deleteEvent(editId)}>Supprimer</button>}
        </div>
      </ModalWrap>
    );
  }

  function renderUserModal() {
    return (
      <ModalWrap onClose={() => setModal(null)}>
        <div style={{ fontFamily:"'Raleway',sans-serif", fontWeight:800, fontSize:16, marginBottom:14 }}>👥 Gérer les utilisateurs</div>
        {users.map(u => (
          <div key={u.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 11px", background:"var(--s2)", borderRadius:10, marginBottom:6 }}>
            <span style={{ fontSize:16, color:u.color }}>{u.shape}</span>
            <div style={{ flex:1, fontWeight:600, fontSize:13 }}>{u.name}</div>
            <div style={{ width:12, height:12, borderRadius:"50%", background:u.color }} />
            <button style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:16, padding:"0 4px" }}
              onMouseEnter={e=>e.currentTarget.style.color="var(--pink)"}
              onMouseLeave={e=>e.currentTarget.style.color="var(--muted)"}
              onClick={() => deleteUser(u.id)}>×</button>
          </div>
        ))}
        {users.length === 0 && <div style={{ color:"var(--muted)", fontSize:13, textAlign:"center", padding:"12px 0" }}>Aucun utilisateur — ajoute-en un !</div>}
        <div style={{ display:"flex", gap:8, marginTop:12 }}>
          <input style={{ ...inp, margin:0, flex:1 }} value={uName} onChange={e=>setUName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addUser()} placeholder="Prénom ou pseudo…" />
          <button className="btn btn-primary" style={{ fontFamily:"'Raleway'", fontWeight:700, whiteSpace:"nowrap" }} onClick={addUser}>Ajouter</button>
        </div>
      </ModalWrap>
    );
  }

  function renderLegend() {
    return (
      <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:14, padding:"10px 12px", background:"var(--s1)", border:"1px solid var(--s2)", borderRadius:12 }}>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", flex:1 }}>
          {Object.entries(CATEGORIES).map(([k, v]) => {
            const active = !filterCats.length || filterCats.includes(k);
            return <div key={k} onClick={() => setFC(p=>p.includes(k)?p.filter(x=>x!==k):[...p,k])} style={{ display:"flex", alignItems:"center", gap:5, cursor:"pointer", opacity:active?1:0.35, transition:"opacity .2s" }}><div style={{ width:10, height:10, borderRadius:3, background:v.color }} /><span style={{ fontSize:11, fontWeight:600, color:"var(--text)" }}>{v.icon} {v.label}</span></div>;
          })}
        </div>
        {users.length > 0 && (
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {users.map(u => {
              const active = !filterUsers.length || filterUsers.includes(u.id);
              return <div key={u.id} onClick={() => setFU(p=>p.includes(u.id)?p.filter(x=>x!==u.id):[...p,u.id])} style={{ display:"flex", alignItems:"center", gap:4, cursor:"pointer", opacity:active?1:0.35, transition:"opacity .2s" }}><span style={{ color:u.color, fontSize:12 }}>{u.shape}</span><span style={{ fontSize:11, fontWeight:600, color:u.color }}>{u.name}</span></div>;
            })}
          </div>
        )}
      </div>
    );
  }

  if (loadingData) return (
    <div style={{ textAlign:"center", paddingTop:80, color:"var(--muted,#888)", fontFamily:"Josefin Sans,sans-serif" }}>
      <div style={{ fontSize:32, marginBottom:12 }}>📅</div>
      <div>Chargement du calendrier…</div>
    </div>
  );

  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding:"16px 12px 80px", fontFamily:"Josefin Sans, sans-serif", color:"var(--text, #f0eeff)", minHeight:"100vh" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:8 }}>
        <div style={{ fontFamily:"'Raleway',sans-serif", fontWeight:800, fontSize:22 }}>📅 Calendrier</div>
        <div style={{ display:"flex", gap:6 }}>
          <button style={tabBtn(view==="month")} onClick={()=>setView("month")}>Mois</button>
          <button style={tabBtn(view==="week")}  onClick={()=>setView("week")}>Semaine</button>
          <button style={{ ...tabBtn(false), background:"rgba(155,109,255,.15)", color:"var(--purple,#9B6DFF)" }} onClick={()=>setModal("user")}>👥</button>
          <button style={{ ...tabBtn(false), background:"rgba(61,255,208,.15)", color:"var(--cyan,#3DFFD0)" }} onClick={()=>openNewEvent(toKey(today))}>+</button>
        </div>
      </div>
      {renderLegend()}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <button onClick={prev} style={navBtn}>‹</button>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontFamily:"'Raleway',sans-serif", fontWeight:800, fontSize:15 }}>{navTitle()}</span>
          <button onClick={() => setCurDate(today)} style={{ fontSize:10, padding:"3px 9px", borderRadius:6, border:"1px solid var(--s3,#333)", background:"none", color:"var(--muted,#888)", cursor:"pointer", fontFamily:"inherit" }}>Aujourd'hui</button>
        </div>
        <button onClick={next} style={navBtn}>›</button>
      </div>
      {view === "month" ? renderMonth() : renderWeek()}
      {modal === "day"   && renderDayModal()}
      {modal === "event" && renderEventModal()}
      {modal === "user"  && renderUserModal()}
    </div>
  );
}

// ── Helpers temps ─────────────────────────────────────────────────────────────
function addOneHour(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(':').map(Number);
  const newH = h + 1;
  if (newH >= 24) return "23:59";
  return String(newH).padStart(2,'0') + ":" + String(m||0).padStart(2,'0');
}

function parseTimeInput(raw) {
  const s = raw.replace(/\s/g, '').toLowerCase();
  if (!s) return "";
  if (/^\d{1,2}:\d{2}$/.test(s)) {
    const [h, m] = s.split(':').map(Number);
    if (h < 24 && m < 60) return String(h).padStart(2,'0') + ":" + String(m).padStart(2,'0');
    return "";
  }
  const hm = s.match(/^(\d{1,2})h(\d{0,2})$/);
  if (hm) {
    const h = parseInt(hm[1]), m = parseInt(hm[2]||"0");
    if (h < 24 && m < 60) return String(h).padStart(2,'0') + ":" + String(m).padStart(2,'0');
  }
  if (/^\d{3,4}$/.test(s)) {
    const str = s.padStart(4,'0');
    const h = parseInt(str.slice(0,-2)), m = parseInt(str.slice(-2));
    if (h < 24 && m < 60) return String(h).padStart(2,'0') + ":" + String(m).padStart(2,'0');
  }
  if (/^\d{1,2}$/.test(s)) {
    const h = parseInt(s);
    if (h < 24) return String(h).padStart(2,'0') + ":00";
  }
  return "";
}

function TimeInput({ value, onChange, compact }) {
  const [raw, setRaw] = useState(value || "");
  const [focused, setFocused] = useState(false);
  useEffect(() => { if (!focused) setRaw(value || ""); }, [value, focused]);

  function handleBlur() {
    setFocused(false);
    const parsed = parseTimeInput(raw);
    if (parsed) { setRaw(parsed); onChange(parsed); }
    else { setRaw(value || ""); }
  }

  return (
    <input type="text" value={focused ? raw : (value || "")} placeholder="09:00"
      style={{ background:"var(--s2)", border:"1px solid var(--purple,#9B6DFF)", borderRadius: compact?7:9, padding: compact?"5px 8px":"9px 12px", color:"var(--text)", fontFamily:"Josefin Sans", fontSize:12, outline:"none", textAlign:"center", width: compact?"auto":"100%", flex: compact?1:undefined, boxSizing:"border-box" }}
      onFocus={() => { setFocused(true); setRaw(value || ""); }}
      onChange={e => setRaw(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
    />
  );
}

function EventPill({ event, users, compact, onClick }) {
  const cat = CATEGORIES[event.cat] || CATEGORIES.loisirs;
  const evtUsers = users.filter(u => event.userIds?.includes(u.id));
  return (
    <div onClick={onClick} style={{ background:cat.color+"22", borderLeft:`2px solid ${cat.color}`, borderRadius:4, padding:compact?"1px 4px":"4px 7px", marginBottom:2, cursor:onClick?"pointer":"default", fontSize:compact?10:11, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", display:"flex", alignItems:"center", gap:3 }}>
      <span>{cat.icon}</span>
      <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis" }}>{event.title}</span>
      {!event.allDay && event.timeStart && <span style={{ fontSize:9, opacity:.7, flexShrink:0 }}>{event.timeStart}</span>}
      {evtUsers.map(u => <span key={u.id} style={{ color:u.color, fontSize:8, flexShrink:0 }}>{u.shape}</span>)}
    </div>
  );
}

function QuickAdd({ dateStr, users, onAdd, onOpenFull }) {
  const [title,     setTitle]     = useState("");
  const [cat,       setCat]       = useState("vacances");
  const [allDay,    setAllDay]    = useState(true);
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd,   setTimeEnd]   = useState("");
  const [userIds,   setUserIds]   = useState(users.length === 1 ? [users[0].id] : []);

  function submit() {
    if (!title.trim()) return;
    onAdd({ title:title.trim(), cat, dateStart:dateStr, dateEnd:dateStr, allDay, timeStart:allDay?"":timeStart, timeEnd:allDay?"":timeEnd, userIds, note:"" });
    setTitle(""); setTimeStart(""); setTimeEnd(""); setAllDay(true);
  }

  return (
    <div style={{ marginTop:12, borderTop:"1px solid var(--s2,#222)", paddingTop:14 }}>
      <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:10 }}>Ajouter rapidement</div>
      <input style={{ width:"100%", background:"var(--s2)", border:"1px solid var(--s3,#333)", borderRadius:9, padding:"9px 12px", color:"var(--text)", fontFamily:"Josefin Sans", fontSize:12, outline:"none", marginBottom:8, boxSizing:"border-box" }}
        value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Titre de l'événement…" />
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:8 }}>
        {Object.entries(CATEGORIES).map(([k,v]) => (
          <div key={k} onClick={()=>setCat(k)} style={{ padding:"4px 9px", borderRadius:16, fontSize:11, fontWeight:600, cursor:"pointer", background:cat===k?v.color:"var(--s2)", color:cat===k?"#0f0e17":"var(--muted)", border:`1px solid ${cat===k?v.color:"var(--s3,#333)"}`, transition:"all .15s" }}>{v.icon} {v.label}</div>
        ))}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <div onClick={()=>setAllDay(p=>!p)} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", padding:"5px 10px", borderRadius:8, background:"var(--s2)", border:`1px solid ${!allDay?"var(--purple,#9B6DFF)":"var(--s3,#333)"}`, transition:"all .15s" }}>
          <span style={{ fontSize:12 }}>⏰</span>
          <span style={{ fontSize:11, fontWeight:600, color:!allDay?"var(--purple,#9B6DFF)":"var(--muted)" }}>{allDay?"Journée entière":"Avec horaires"}</span>
        </div>
        {!allDay && (
          <div style={{ display:"flex", alignItems:"center", gap:6, flex:1 }}>
            <TimeInput value={timeStart} onChange={v => { setTimeStart(v); if (!timeEnd || timeEnd <= v) setTimeEnd(addOneHour(v)); }} compact />
            <span style={{ color:"var(--muted)", fontSize:11 }}>→</span>
            <TimeInput value={timeEnd} onChange={setTimeEnd} compact />
          </div>
        )}
      </div>
      {users.length > 1 && (
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:8 }}>
          {users.map(u => {
            const sel = userIds.includes(u.id);
            return <div key={u.id} onClick={()=>setUserIds(p=>sel?p.filter(x=>x!==u.id):[...p,u.id])} style={{ padding:"3px 9px", borderRadius:16, fontSize:11, fontWeight:600, cursor:"pointer", border:`1px solid ${sel?u.color:"var(--s3,#333)"}`, background:sel?u.color+"22":"var(--s2)", color:sel?u.color:"var(--muted)", transition:"all .15s" }}><span style={{ marginRight:3 }}>{u.shape}</span>{u.name}</div>;
          })}
        </div>
      )}
      <div style={{ display:"flex", gap:8, marginTop:10 }}>
        <button onClick={submit} style={{ flex:1, padding:"9px 0", borderRadius:9, border:"none", background:"linear-gradient(135deg, var(--purple,#9B6DFF), var(--pink,#FF5FA0))", color:"#fff", fontFamily:"'Raleway'", fontWeight:700, fontSize:13, cursor:"pointer", opacity:title.trim()?1:0.5 }}>Ajouter</button>
        <button onClick={()=>onOpenFull({title,cat,allDay,timeStart,timeEnd,userIds})} style={{ padding:"9px 14px", borderRadius:9, border:"1px solid var(--s3,#333)", background:"var(--s2)", color:"var(--muted)", fontFamily:"Josefin Sans", fontSize:11, cursor:"pointer", whiteSpace:"nowrap" }}>Plus d'options →</button>
      </div>
    </div>
  );
}

function ModalWrap({ children, onClose, wide }) {
  function handleBackdropMouseDown(e) { if (e.target === e.currentTarget) onClose(); }
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }} onMouseDown={handleBackdropMouseDown}>
      <div style={{ background:"var(--bg,#0f0e17)", border:"1px solid var(--s2,#222)", borderRadius:20, padding:"20px 16px 24px", width:"100%", maxWidth:wide?520:400, maxHeight:"85vh", overflowY:"auto" }} onMouseDown={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

const lbl    = { fontSize:11, color:"var(--muted,#888)", fontWeight:500, marginBottom:4, display:"block" };
const inp    = { width:"100%", background:"var(--s2,#1a1a2e)", border:"1px solid var(--s3,#333)", borderRadius:9, padding:"9px 12px", color:"var(--text,#f0eeff)", fontFamily:"Josefin Sans, sans-serif", fontSize:12, outline:"none", marginBottom:10, boxSizing:"border-box" };
const navBtn = { width:34, height:34, borderRadius:8, border:"1px solid var(--s2,#222)", background:"var(--s1,#111)", color:"var(--text,#f0eeff)", fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit" };
const tabBtn = (active) => ({ padding:"6px 14px", borderRadius:8, border:"none", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:active?"linear-gradient(135deg, var(--purple,#9B6DFF), var(--pink,#FF5FA0))":"var(--s2,#1a1a2e)", color:active?"#fff":"var(--muted,#888)", transition:"all .2s" });
