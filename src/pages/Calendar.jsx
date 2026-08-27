import { useState, useEffect, useCallback } from "react";

// ── Config ────────────────────────────────────────────────────────────────────

const CATEGORIES = {
  vacances:      { label: "Vacances",      icon: "🌴", color: "#3DFFD0" },
  travail:       { label: "Travail",       icon: "💼", color: "#9B6DFF" },
  loisirs:       { label: "Loisirs",       icon: "🎉", color: "#FFE14D" },
  administratif: { label: "Administratif", icon: "📋", color: "#FF7A3D" },
};

const USER_SHAPES = ["●", "▲", "■", "◆", "★", "⬟"];
const USER_COLORS = ["#FF5FA0", "#3DFFD0", "#FFE14D", "#9B6DFF", "#FF7A3D", "#378ADD"];

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MOIS  = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

// ── Storage helpers ───────────────────────────────────────────────────────────
const STORAGE_KEY = "quizly_calendar";

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || { users: [], events: [] };
  } catch { return { users: [], events: [] }; }
}
function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

// ── Helpers date ──────────────────────────────────────────────────────────────
function toKey(date) {
  // Utiliser les méthodes locales pour éviter le décalage UTC
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfMonth(y, m) {
  let d = new Date(y, m, 1).getDay();
  return d === 0 ? 6 : d - 1; // lundi = 0
}
function addDays(date, n) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d;
}
function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - day);
  return d;
}
function parseDate(str) {
  // Parser sans décalage UTC en forçant minuit heure locale
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Calendar() {
  const today = new Date();
  const [data, setData]           = useState(load);
  const [view, setView]           = useState("month"); // month | week
  const [curDate, setCurDate]     = useState(today);
  const [selectedDay, setSelDay]  = useState(null);
  const [modal, setModal]         = useState(null); // null | 'event' | 'user' | 'day'
  const [filterUsers, setFU]      = useState([]);  // vide = tous
  const [filterCats,  setFC]      = useState([]);  // vide = toutes

  // Formulaire événement
  const [form, setForm] = useState({ title:"", cat:"vacances", userIds:[], dateStart:"", dateEnd:"", note:"" });
  const [editId, setEditId] = useState(null);

  // Formulaire utilisateur
  const [uName, setUName] = useState("");

  // Persistance
  useEffect(() => { save(data); }, [data]);

  // Filtered events
  const events = data.events.filter(e => {
    if (filterUsers.length && !e.userIds.some(u => filterUsers.includes(u))) return false;
    if (filterCats.length  && !filterCats.includes(e.cat)) return false;
    return true;
  });

  function eventsOnDay(key) {
    return events.filter(e => {
      const s = e.dateStart, en = e.dateEnd || e.dateStart;
      return key >= s && key <= en;
    });
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  function addUser() {
    if (!uName.trim()) return;
    const idx = data.users.length % USER_COLORS.length;
    const u = { id: Date.now().toString(), name: uName.trim(), color: USER_COLORS[idx], shape: USER_SHAPES[idx] };
    setData(d => ({ ...d, users: [...d.users, u] }));
    setUName("");
  }
  function deleteUser(id) {
    setData(d => ({ ...d, users: d.users.filter(u => u.id !== id), events: d.events.filter(e => !e.userIds.includes(id) || e.userIds.length > 1) }));
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  function openNewEvent(dateStr, prefill = {}) {
    setForm({
      title:     prefill.title     || "",
      cat:       prefill.cat       || "vacances",
      userIds:   prefill.userIds   || (data.users.length === 1 ? [data.users[0].id] : []),
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
    setForm({ title: e.title, cat: e.cat, userIds: [...e.userIds], dateStart: e.dateStart, dateEnd: e.dateEnd || e.dateStart, timeStart: e.timeStart || "", timeEnd: e.timeEnd || "", allDay: e.allDay !== false, note: e.note || "" });
    setEditId(e.id);
    setModal("event");
  }
  function saveEvent() {
    if (!form.title.trim() || !form.dateStart) return;
    if (editId) {
      setData(d => ({ ...d, events: d.events.map(e => e.id === editId ? { ...e, ...form } : e) }));
    } else {
      setData(d => ({ ...d, events: [...d.events, { id: Date.now().toString(), ...form }] }));
    }
    setModal(null);
  }
  function deleteEvent(id) {
    setData(d => ({ ...d, events: d.events.filter(e => e.id !== id) }));
    setModal(null);
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  function prev() {
    if (view === "month") setCurDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    else setCurDate(d => addDays(d, -7));
  }
  function next() {
    if (view === "month") setCurDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    else setCurDate(d => addDays(d, 7));
  }
  function goToday() { setCurDate(today); }

  // ── Render mois ────────────────────────────────────────────────────────────
  function renderMonth() {
    const y = curDate.getFullYear(), m = curDate.getMonth();
    const total = daysInMonth(y, m);
    const first = firstDayOfMonth(y, m);
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(new Date(y, m, d));

    return (
      <div>
        {/* Header jours */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:2 }}>
          {JOURS.map(j => (
            <div key={j} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:"var(--muted)", padding:"6px 0", textTransform:"uppercase", letterSpacing:".06em" }}>{j}</div>
          ))}
        </div>
        {/* Grille */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
          {cells.map((date, i) => {
            if (!date) return <div key={i} />;
            const key = toKey(date);
            const dayEvts = eventsOnDay(key);
            const isToday = key === toKey(today);
            const isSel   = key === selectedDay;
            return (
              <div key={key}
                onClick={() => { setSelDay(key); setModal("day"); }}
                style={{
                  minHeight:70, borderRadius:10, padding:"5px 5px 3px",
                  background: isSel ? "rgba(155,109,255,.18)" : "var(--s1)",
                  border: `1px solid ${isToday ? "var(--purple)" : isSel ? "var(--purple)" : "var(--s2)"}`,
                  cursor:"pointer", transition:"all .15s", position:"relative",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor="var(--purple)"}
                onMouseLeave={e => !isToday && !isSel && (e.currentTarget.style.borderColor="var(--s2)")}
              >
                <div style={{ fontSize:11, fontWeight: isToday ? 800 : 500, color: isToday ? "var(--purple)" : "var(--text)", marginBottom:3, textAlign:"right" }}>
                  {isToday ? <span style={{ background:"var(--purple)", color:"#fff", borderRadius:"50%", width:18, height:18, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:10 }}>{date.getDate()}</span> : date.getDate()}
                </div>
                {dayEvts.slice(0, 3).map(e => <EventPill key={e.id} event={e} users={data.users} compact />)}
                {dayEvts.length > 3 && <div style={{ fontSize:9, color:"var(--muted)", paddingLeft:2 }}>+{dayEvts.length-3}</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Render semaine ─────────────────────────────────────────────────────────
  function renderWeek() {
    const start = startOfWeek(curDate);
    const days  = Array.from({ length:7 }, (_, i) => addDays(start, i));

    return (
      <div style={{ overflowX:"auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, minWidth:500 }}>
          {days.map(date => {
            const key     = toKey(date);
            const dayEvts = eventsOnDay(key);
            const isToday = key === toKey(today);
            return (
              <div key={key} style={{ borderRadius:12, overflow:"hidden", border:`1px solid ${isToday?"var(--purple)":"var(--s2)"}` }}>
                {/* Header jour */}
                <div style={{ background: isToday ? "rgba(155,109,255,.15)" : "var(--s2)", padding:"8px 8px 6px", textAlign:"center" }}>
                  <div style={{ fontSize:10, color:"var(--muted)", fontWeight:600, textTransform:"uppercase" }}>{JOURS[days.indexOf(date)]}</div>
                  <div style={{ fontSize:16, fontWeight:800, color: isToday?"var(--purple)":"var(--text)" }}>{date.getDate()}</div>
                </div>
                {/* Événements */}
                <div style={{ padding:"4px 4px 6px", minHeight:80, background:"var(--s1)" }}>
                  {dayEvts.map(e => <EventPill key={e.id} event={e} users={data.users} onClick={() => openEditEvent(e)} />)}
                  <div onClick={() => openNewEvent(key)} style={{ marginTop:4, cursor:"pointer", textAlign:"center", fontSize:16, color:"var(--s3)", lineHeight:1 }}
                    onMouseEnter={e => e.currentTarget.style.color="var(--purple)"}
                    onMouseLeave={e => e.currentTarget.style.color="var(--s3)"}
                  >+</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Title navigation ───────────────────────────────────────────────────────
  function navTitle() {
    if (view === "month") return `${MOIS[curDate.getMonth()]} ${curDate.getFullYear()}`;
    const start = startOfWeek(curDate);
    const end   = addDays(start, 6);
    return `${start.getDate()} – ${end.getDate()} ${MOIS[end.getMonth()]} ${end.getFullYear()}`;
  }

  // ── Modal jour ─────────────────────────────────────────────────────────────
  function renderDayModal() {
    if (!selectedDay) return null;
    const dayEvts = eventsOnDay(selectedDay);
    const d = parseDate(selectedDay);

    // Trier les événements par heure
    const sorted = [...dayEvts].sort((a, b) => {
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;
      return (a.timeStart || "").localeCompare(b.timeStart || "");
    });

    return (
      <ModalWrap onClose={() => setModal(null)} wide>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ fontFamily:"'Raleway',sans-serif", fontWeight:800, fontSize:16 }}>
            {d.toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })}
          </div>
          <span style={{ fontSize:11, color:"var(--muted)", background:"var(--s2)", padding:"3px 8px", borderRadius:6 }}>
            {sorted.length} événement{sorted.length > 1 ? "s" : ""}
          </span>
        </div>

        {/* Liste événements triés */}
        {sorted.length === 0 ? (
          <div style={{ textAlign:"center", color:"var(--muted)", padding:"12px 0 16px", fontSize:13 }}>
            Aucun événement ce jour
          </div>
        ) : sorted.map(e => (
          <div key={e.id}
            style={{ background:CATEGORIES[e.cat].color+"18", border:`1px solid ${CATEGORIES[e.cat].color}44`, borderLeft:`3px solid ${CATEGORIES[e.cat].color}`, borderRadius:8, padding:"9px 11px", marginBottom:7, cursor:"pointer", transition:"opacity .15s" }}
            onClick={() => openEditEvent(e)}
            onMouseEnter={el => el.currentTarget.style.opacity=".8"}
            onMouseLeave={el => el.currentTarget.style.opacity="1"}
          >
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:3 }}>
              <div style={{ fontWeight:700, fontSize:13 }}>{CATEGORIES[e.cat].icon} {e.title}</div>
              {!e.allDay && e.timeStart ? (
                <span style={{ fontSize:11, fontWeight:700, color:CATEGORIES[e.cat].color, background:CATEGORIES[e.cat].color+"22", padding:"2px 7px", borderRadius:6, whiteSpace:"nowrap" }}>
                  {e.timeStart}{e.timeEnd ? ` → ${e.timeEnd}` : ""}
                </span>
              ) : (
                <span style={{ fontSize:10, color:"var(--muted)", background:"var(--s2)", padding:"2px 7px", borderRadius:6 }}>Journée</span>
              )}
            </div>
            <div style={{ fontSize:11, color:"var(--muted)", display:"flex", gap:8, flexWrap:"wrap" }}>
              <span>{CATEGORIES[e.cat].label}</span>
              {e.dateStart !== e.dateEnd && <span>→ {e.dateEnd}</span>}
              {e.userIds.length > 0 && <span>{e.userIds.map(uid => data.users.find(u=>u.id===uid)?.name).filter(Boolean).join(", ")}</span>}
            </div>
            {e.note && <div style={{ fontSize:11, color:"var(--muted)", marginTop:4, fontStyle:"italic" }}>{e.note}</div>}
          </div>
        ))}

        {/* Quick-add avec heure */}
        <QuickAdd
          dateStr={selectedDay}
          users={data.users}
          onAdd={(evt) => {
            setData(d => ({ ...d, events: [...d.events, { id: Date.now().toString(), ...evt }] }));
          }}
          onOpenFull={(prefill) => { setModal(null); setTimeout(() => openNewEvent(selectedDay, prefill), 50); }}
        />
      </ModalWrap>
    );
  }

  // ── Modal événement ────────────────────────────────────────────────────────
  function renderEventModal() {
    return (
      <ModalWrap onClose={() => setModal(null)} wide>
        <div style={{ fontFamily:"'Raleway',sans-serif", fontWeight:800, fontSize:16, marginBottom:14 }}>
          {editId ? "Modifier l'événement" : "Nouvel événement"}
        </div>

        {/* Titre */}
        <label style={lbl}>Titre</label>
        <input style={inp} value={form.title} onChange={e => setForm(f=>({...f, title:e.target.value}))} placeholder="Ex: Réunion, Congés, Cinéma…" />

        {/* Catégorie */}
        <label style={lbl}>Catégorie</label>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <div key={k} onClick={() => setForm(f=>({...f, cat:k}))} style={{
              padding:"6px 12px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer",
              background: form.cat===k ? v.color : "var(--s2)",
              color: form.cat===k ? "#0f0e17" : "var(--muted)",
              border: `1px solid ${form.cat===k ? v.color : "var(--s2)"}`,
              transition:"all .15s",
            }}>{v.icon} {v.label}</div>
          ))}
        </div>

        {/* Dates */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
          <div>
            <label style={lbl}>Début</label>
            <input type="date" style={inp} value={form.dateStart} onChange={e => setForm(f=>({...f, dateStart:e.target.value, dateEnd: e.target.value > f.dateEnd ? e.target.value : f.dateEnd}))} />
          </div>
          <div>
            <label style={lbl}>Fin</label>
            <input type="date" style={inp} value={form.dateEnd} onChange={e => setForm(f=>({...f, dateEnd:e.target.value}))} min={form.dateStart} />
          </div>
        </div>

        {/* Utilisateurs */}
        {data.users.length > 0 && <>
          <label style={lbl}>Participants</label>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
            {data.users.map(u => {
              const sel = form.userIds.includes(u.id);
              return (
                <div key={u.id} onClick={() => setForm(f => ({ ...f, userIds: sel ? f.userIds.filter(x=>x!==u.id) : [...f.userIds, u.id] }))}
                  style={{ padding:"6px 12px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${sel?u.color:"var(--s2)"}`, background:sel?u.color+"22":"var(--s2)", color:sel?u.color:"var(--muted)", transition:"all .15s" }}>
                  <span style={{ marginRight:4 }}>{u.shape}</span>{u.name}
                </div>
              );
            })}
          </div>
        </>}

        {/* Journée entière toggle */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, padding:"9px 12px", background:"var(--s2,#1a1a2e)", borderRadius:9 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:600 }}>Journée entière</div>
            <div style={{ fontSize:10, color:"var(--muted,#888)" }}>Désactive pour ajouter des horaires</div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={form.allDay} onChange={e => setForm(f=>({...f, allDay:e.target.checked, timeStart:"", timeEnd:""}))} />
            <span className="toggle-slider" />
          </label>
        </div>

        {/* Horaires */}
        {!form.allDay && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            <div>
              <label style={lbl}>Heure de début</label>
              <input type="time" style={inp} value={form.timeStart} onChange={e => setForm(f=>({...f, timeStart:e.target.value}))} />
            </div>
            <div>
              <label style={lbl}>Heure de fin</label>
              <input type="time" style={inp} value={form.timeEnd} onChange={e => setForm(f=>({...f, timeEnd:e.target.value}))} min={form.timeStart} />
            </div>
          </div>
        )}

        {/* Note */}
        <label style={lbl}>Note (optionnel)</label>
        <textarea style={{ ...inp, minHeight:56, resize:"vertical" }} value={form.note} onChange={e => setForm(f=>({...f, note:e.target.value}))} placeholder="Détails, lieu, lien…" />

        <div style={{ display:"flex", gap:8, marginTop:4 }}>
          <button className="btn btn-primary" style={{ flex:1, fontFamily:"'Raleway'", fontWeight:700 }} onClick={saveEvent}>
            {editId ? "Enregistrer" : "Ajouter"}
          </button>
          {editId && (
            <button className="btn btn-secondary" style={{ padding:"0 14px", color:"var(--pink)", fontFamily:"'Raleway'", fontWeight:700 }} onClick={() => deleteEvent(editId)}>
              Supprimer
            </button>
          )}
        </div>
      </ModalWrap>
    );
  }

  // ── Modal utilisateurs ─────────────────────────────────────────────────────
  function renderUserModal() {
    return (
      <ModalWrap onClose={() => setModal(null)}>
        <div style={{ fontFamily:"'Raleway',sans-serif", fontWeight:800, fontSize:16, marginBottom:14 }}>
          👥 Gérer les utilisateurs
        </div>

        {/* Liste */}
        {data.users.map((u, i) => (
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

        {data.users.length === 0 && <div style={{ color:"var(--muted)", fontSize:13, textAlign:"center", padding:"12px 0" }}>Aucun utilisateur — ajoute-en un !</div>}

        {/* Ajouter */}
        <div style={{ display:"flex", gap:8, marginTop:12 }}>
          <input style={{ ...inp, margin:0, flex:1 }} value={uName} onChange={e=>setUName(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&addUser()} placeholder="Prénom ou pseudo…" />
          <button className="btn btn-primary" style={{ fontFamily:"'Raleway'", fontWeight:700, whiteSpace:"nowrap" }} onClick={addUser}>
            Ajouter
          </button>
        </div>
      </ModalWrap>
    );
  }

  // ── Légende ────────────────────────────────────────────────────────────────
  function renderLegend() {
    return (
      <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:14, padding:"10px 12px", background:"var(--s1)", border:"1px solid var(--s2)", borderRadius:12 }}>
        {/* Catégories */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", flex:1 }}>
          {Object.entries(CATEGORIES).map(([k, v]) => {
            const active = !filterCats.length || filterCats.includes(k);
            return (
              <div key={k} onClick={() => setFC(p => p.includes(k) ? p.filter(x=>x!==k) : [...p,k])}
                style={{ display:"flex", alignItems:"center", gap:5, cursor:"pointer", opacity:active?1:0.35, transition:"opacity .2s" }}>
                <div style={{ width:10, height:10, borderRadius:3, background:v.color }} />
                <span style={{ fontSize:11, fontWeight:600, color:"var(--text)" }}>{v.icon} {v.label}</span>
              </div>
            );
          })}
        </div>
        {/* Users */}
        {data.users.length > 0 && (
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {data.users.map(u => {
              const active = !filterUsers.length || filterUsers.includes(u.id);
              return (
                <div key={u.id} onClick={() => setFU(p => p.includes(u.id) ? p.filter(x=>x!==u.id) : [...p,u.id])}
                  style={{ display:"flex", alignItems:"center", gap:4, cursor:"pointer", opacity:active?1:0.35, transition:"opacity .2s" }}>
                  <span style={{ color:u.color, fontSize:12 }}>{u.shape}</span>
                  <span style={{ fontSize:11, fontWeight:600, color:u.color }}>{u.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Rendu principal ────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth:780, margin:"0 auto", padding:"16px 12px 80px", fontFamily:"Josefin Sans, sans-serif", color:"var(--text, #f0eeff)", minHeight:"100vh" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:8 }}>
        <div style={{ fontFamily:"'Raleway',sans-serif", fontWeight:800, fontSize:22 }}>📅 Calendrier</div>
        <div style={{ display:"flex", gap:6 }}>
          <button style={tabBtn(view==="month")} onClick={()=>setView("month")}>Mois</button>
          <button style={tabBtn(view==="week")}  onClick={()=>setView("week")}>Semaine</button>
          <button style={{ ...tabBtn(false), background:"rgba(155,109,255,.15)", color:"var(--purple, #9B6DFF)" }} onClick={()=>setModal("user")}>👥</button>
          <button style={{ ...tabBtn(false), background:"rgba(61,255,208,.15)", color:"var(--cyan, #3DFFD0)" }} onClick={()=>openNewEvent(toKey(today))}>+</button>
        </div>
      </div>

      {/* Légende + filtres */}
      {renderLegend()}

      {/* Navigation mois/semaine */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <button onClick={prev} style={navBtn}>‹</button>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontFamily:"'Raleway',sans-serif", fontWeight:800, fontSize:15 }}>{navTitle()}</span>
          <button onClick={goToday} style={{ fontSize:10, padding:"3px 9px", borderRadius:6, border:"1px solid var(--s3,#333)", background:"none", color:"var(--muted,#888)", cursor:"pointer", fontFamily:"inherit" }}>
            Aujourd'hui
          </button>
        </div>
        <button onClick={next} style={navBtn}>›</button>
      </div>

      {/* Calendrier */}
      {view === "month" ? renderMonth() : renderWeek()}

      {/* Modals */}
      {modal === "day"   && renderDayModal()}
      {modal === "event" && renderEventModal()}
      {modal === "user"  && renderUserModal()}
    </div>
  );
}

// ── Sous-composants ───────────────────────────────────────────────────────────

function EventPill({ event, users, compact, onClick }) {
  const cat   = CATEGORIES[event.cat];
  const evtUsers = users.filter(u => event.userIds.includes(u.id));
  return (
    <div onClick={onClick} style={{
      background: cat.color + "22",
      borderLeft: `2px solid ${cat.color}`,
      borderRadius: 4,
      padding: compact ? "1px 4px" : "4px 7px",
      marginBottom: 2,
      cursor: onClick ? "pointer" : "default",
      fontSize: compact ? 10 : 11,
      fontWeight: 600,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "flex",
      alignItems: "center",
      gap: 3,
    }}>
      <span>{cat.icon}</span>
      <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis" }}>{event.title}</span>
      {!event.allDay && event.timeStart && <span style={{ fontSize:9, opacity:.7, flexShrink:0 }}>{event.timeStart}</span>}
      {evtUsers.map(u => <span key={u.id} style={{ color:u.color, fontSize:8, flexShrink:0 }}>{u.shape}</span>)}
    </div>
  );
}

// ── QuickAdd — barre rapide avec heure ────────────────────────────────────────
function QuickAdd({ dateStr, users, onAdd, onOpenFull }) {
  const [title,     setTitle]     = useState("");
  const [cat,       setCat]       = useState("vacances");
  const [allDay,    setAllDay]    = useState(true);
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd,   setTimeEnd]   = useState("");
  const [userIds,   setUserIds]   = useState(users.length === 1 ? [users[0].id] : []);

  function submit() {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), cat, dateStart: dateStr, dateEnd: dateStr, allDay, timeStart: allDay ? "" : timeStart, timeEnd: allDay ? "" : timeEnd, userIds, note: "" });
    setTitle(""); setTimeStart(""); setTimeEnd(""); setAllDay(true);
  }

  return (
    <div style={{ marginTop:12, borderTop:"1px solid var(--s2,#222)", paddingTop:14 }}>
      <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:10 }}>
        Ajouter rapidement
      </div>

      {/* Titre */}
      <input
        style={{ ...lbl2, width:"100%", background:"var(--s2,#1a1a2e)", border:"1px solid var(--s3,#333)", borderRadius:9, padding:"9px 12px", color:"var(--text,#f0eeff)", fontFamily:"Josefin Sans,sans-serif", fontSize:12, outline:"none", marginBottom:8, boxSizing:"border-box" }}
        value={title} onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === "Enter" && submit()}
        placeholder="Titre de l'événement…"
      />

      {/* Catégorie rapide */}
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:8 }}>
        {Object.entries(CATEGORIES).map(([k, v]) => (
          <div key={k} onClick={() => setCat(k)} style={{
            padding:"4px 9px", borderRadius:16, fontSize:11, fontWeight:600, cursor:"pointer",
            background: cat===k ? v.color : "var(--s2,#1a1a2e)",
            color: cat===k ? "#0f0e17" : "var(--muted,#888)",
            border:`1px solid ${cat===k ? v.color : "var(--s3,#333)"}`,
            transition:"all .15s",
          }}>{v.icon} {v.label}</div>
        ))}
      </div>

      {/* Toggle journée entière + horaires */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom: allDay ? 8 : 0 }}>
        <div
          onClick={() => setAllDay(p => !p)}
          style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", padding:"5px 10px", borderRadius:8, background:"var(--s2,#1a1a2e)", border:`1px solid ${!allDay ? "var(--purple,#9B6DFF)" : "var(--s3,#333)"}`, transition:"all .15s" }}
        >
          <span style={{ fontSize:12 }}>⏰</span>
          <span style={{ fontSize:11, fontWeight:600, color: !allDay ? "var(--purple,#9B6DFF)" : "var(--muted,#888)" }}>
            {allDay ? "Journée entière" : "Avec horaires"}
          </span>
        </div>

        {!allDay && (
          <div style={{ display:"flex", alignItems:"center", gap:6, flex:1 }}>
            <input type="time" value={timeStart} onChange={e => setTimeStart(e.target.value)}
              style={{ flex:1, background:"var(--s2,#1a1a2e)", border:"1px solid var(--purple,#9B6DFF)", borderRadius:7, padding:"5px 8px", color:"var(--text,#f0eeff)", fontFamily:"Josefin Sans,sans-serif", fontSize:12, outline:"none" }} />
            <span style={{ color:"var(--muted)", fontSize:11 }}>→</span>
            <input type="time" value={timeEnd} onChange={e => setTimeEnd(e.target.value)} min={timeStart}
              style={{ flex:1, background:"var(--s2,#1a1a2e)", border:"1px solid var(--purple,#9B6DFF)", borderRadius:7, padding:"5px 8px", color:"var(--text,#f0eeff)", fontFamily:"Josefin Sans,sans-serif", fontSize:12, outline:"none" }} />
          </div>
        )}
      </div>

      {/* Participants rapides */}
      {users.length > 1 && (
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", margin:"8px 0" }}>
          {users.map(u => {
            const sel = userIds.includes(u.id);
            return (
              <div key={u.id} onClick={() => setUserIds(p => sel ? p.filter(x=>x!==u.id) : [...p, u.id])}
                style={{ padding:"3px 9px", borderRadius:16, fontSize:11, fontWeight:600, cursor:"pointer", border:`1px solid ${sel?u.color:"var(--s3,#333)"}`, background:sel?u.color+"22":"var(--s2,#1a1a2e)", color:sel?u.color:"var(--muted,#888)", transition:"all .15s" }}>
                <span style={{ marginRight:3 }}>{u.shape}</span>{u.name}
              </div>
            );
          })}
        </div>
      )}

      {/* Boutons */}
      <div style={{ display:"flex", gap:8, marginTop:10 }}>
        <button
          onClick={submit}
          style={{ flex:1, padding:"9px 0", borderRadius:9, border:"none", background:"linear-gradient(135deg, var(--purple,#9B6DFF), var(--pink,#FF5FA0))", color:"#fff", fontFamily:"'Raleway',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer", opacity: title.trim() ? 1 : 0.5 }}
        >Ajouter</button>
        <button
          onClick={() => onOpenFull({ title, cat, allDay, timeStart, timeEnd, userIds })}
          style={{ padding:"9px 14px", borderRadius:9, border:"1px solid var(--s3,#333)", background:"var(--s2,#1a1a2e)", color:"var(--muted,#888)", fontFamily:"Josefin Sans,sans-serif", fontSize:11, cursor:"pointer", whiteSpace:"nowrap" }}
        >Plus d'options →</button>
      </div>
    </div>
  );
}
const lbl2 = {};

function ModalWrap({ children, onClose, wide }) {
  // Utiliser onMouseDown au lieu de onClick pour éviter la fermeture
  // lors d'une sélection de texte (drag qui finit sur le fond)
  function handleBackdropMouseDown(e) {
    if (e.target === e.currentTarget) onClose();
  }
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}
      onMouseDown={handleBackdropMouseDown}>
      <div style={{ background:"var(--bg, #0f0e17)", border:"1px solid var(--s2,#222)", borderRadius:20, padding:"20px 16px 24px", width:"100%", maxWidth: wide ? 520 : 400, maxHeight:"85vh", overflowY:"auto" }}
        onMouseDown={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const lbl = { fontSize:11, color:"var(--muted,#888)", fontWeight:500, marginBottom:4, display:"block" };
const inp = { width:"100%", background:"var(--s2,#1a1a2e)", border:"1px solid var(--s3,#333)", borderRadius:9, padding:"9px 12px", color:"var(--text,#f0eeff)", fontFamily:"Josefin Sans, sans-serif", fontSize:12, outline:"none", marginBottom:10, boxSizing:"border-box" };
const navBtn = { width:34, height:34, borderRadius:8, border:"1px solid var(--s2,#222)", background:"var(--s1,#111)", color:"var(--text,#f0eeff)", fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit" };
const tabBtn = (active) => ({ padding:"6px 14px", borderRadius:8, border:"none", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", background: active ? "linear-gradient(135deg, var(--purple,#9B6DFF), var(--pink,#FF5FA0))" : "var(--s2,#1a1a2e)", color: active ? "#fff" : "var(--muted,#888)", transition:"all .2s" });
