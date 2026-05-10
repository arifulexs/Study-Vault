// ═══════════════════════════════════════════════════
// STUDYVAULT — script.js  (final clean version)
// Firebase Google Auth + Firestore  |  free tier
// Offline-first via localForage  |  no backend
// ═══════════════════════════════════════════════════

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, onSnapshot }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ── FIREBASE CONFIG ────────────────────────────────
// Replace with your own values from console.firebase.google.com
// Leave as-is to run in offline-only mode (no sign-in required)
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBcnT3-BFJr5C_1jfdJvqoKWfwjEEN15KY",
  authDomain:        "studyvault-f775d.firebaseapp.com",
  projectId:         "studyvault-f775d",
  storageBucket:     "studyvault-f775d.firebasestorage.app",
  messagingSenderId: "636451122016",
  appId:             "1:636451122016:web:d604285d72e1bcde254c05"
};

// ── FIREBASE INIT ──────────────────────────────────
let fbApp, auth, db;
let currentUser    = null;
let unsubFirestore = null;
let syncTimeout    = null;

function firebaseReady() {
  return FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY";
}
if (firebaseReady()) {
  fbApp = initializeApp(FIREBASE_CONFIG);
  auth  = getAuth(fbApp);
  db    = getFirestore(fbApp);
}

// ── CONSTANTS ──────────────────────────────────────
const STORAGE_KEY = 'studyvault-data-v1';
const THEME_KEY   = 'studyvault-theme';

const SUBJECT_COLORS = [
  { bg:'var(--c1)', icon:'#1d4ed8' },
  { bg:'var(--c2)', icon:'#c2410c' },
  { bg:'var(--c3)', icon:'#7c3aed' },
  { bg:'var(--c4)', icon:'#047857' },
  { bg:'var(--c5)', icon:'#9d174d' },
  { bg:'var(--c6)', icon:'#0f766e' },
];

const SUBJECT_ICONS = [
  { key:'book',       label:'Book',    svg:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>` },
  { key:'flask',      label:'Flask',   svg:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M9 3v7l-6 11h18L15 10V3"/><path d="M6 19h12"/></svg>` },
  { key:'calculator', label:'Math',    svg:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="8" y2="11"/><line x1="12" y1="11" x2="12" y2="11"/><line x1="16" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="12" y1="15" x2="12" y2="15"/><line x1="16" y1="15" x2="16" y2="15"/><line x1="8" y1="19" x2="12" y2="19"/></svg>` },
  { key:'leaf',       label:'Bio',     svg:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8C8 10 5.9 16.17 3.82 19.34A1 1 0 004.82 21C7 21 15 21 18 14c.94-2.12 1-5 .5-7C18 7 17.5 7 17 8z"/><path d="M3.82 19.34L12 12"/></svg>` },
  { key:'globe',      label:'Geo',     svg:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>` },
  { key:'cpu',        label:'ICT',     svg:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="2" x2="9" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/><line x1="20" y1="9" x2="22" y2="9"/><line x1="20" y1="15" x2="22" y2="15"/><line x1="2" y1="9" x2="4" y2="9"/><line x1="2" y1="15" x2="4" y2="15"/></svg>` },
  { key:'bar-chart',  label:'Stats',   svg:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>` },
  { key:'pen',        label:'Lang',    svg:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>` },
  { key:'music',      label:'Music',   svg:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>` },
  { key:'map',        label:'Map',     svg:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>` },
  { key:'zap',        label:'Physics', svg:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>` },
  { key:'star',       label:'Fav',     svg:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` },
];

// ── UTILS ──────────────────────────────────────────
function uid()  { return 'i' + Math.random().toString(36).slice(2, 10); }
function esc(t) {
  return String(t)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── SAMPLE DATA ────────────────────────────────────
function makeSample() {
  return {
    subjects: {
      "Physics":   { _colorIdx:0, _iconKey:'zap',        papers:{ "1st Paper":[{ id:uid(), title:"Measurement",            url:"https://example.com/physics-measurement" },{ id:uid(), title:"Motion in a Straight Line", url:"https://example.com/physics-motion"      }], "2nd Paper":[{ id:uid(), title:"Electricity & Circuits", url:"https://example.com/physics-electricity" }] } },
      "Chemistry": { _colorIdx:1, _iconKey:'flask',       papers:{ "1st Paper":[{ id:uid(), title:"Periodic Table",         url:"https://example.com/chem-periodic"       },{ id:uid(), title:"Chemical Bonding",          url:"https://example.com/chem-bonding"        }], "2nd Paper":[{ id:uid(), title:"Organic Reactions",      url:"https://example.com/chem-organic"       }] } },
      "H.Math":    { _colorIdx:2, _iconKey:'calculator',  papers:{ "1st Paper":[{ id:uid(), title:"Straight Lines",          url:"https://example.com/hmath-lines"         },{ id:uid(), title:"Circles",                  url:"https://example.com/hmath-circles"       }], "2nd Paper":[{ id:uid(), title:"Differentiation",        url:"https://example.com/hmath-diff"         }] } },
      "Biology":   { _colorIdx:3, _iconKey:'leaf',        papers:{ "1st Paper":[{ id:uid(), title:"Cell Biology",            url:"https://example.com/bio-cell"            },{ id:uid(), title:"Genetics",                 url:"https://example.com/bio-genetics"        }], "2nd Paper":[{ id:uid(), title:"কোষ ও এর গঠন",          url:"https://example.com/bio-cell-structure"  }] } },
      "ICT":       { _colorIdx:5, _iconKey:'cpu', _direct:true, topics:[
        { id:uid(), title:"Number System",       url:"https://example.com/ict-number-system" },
        { id:uid(), title:"Database Management", url:"https://example.com/ict-database"      },
        { id:uid(), title:"Web Design Basics",   url:"https://example.com/ict-webdesign"     },
        { id:uid(), title:"Spreadsheet",         url:"https://example.com/ict-spreadsheet"   },
      ]},
    }
  };
}

// ── STATE ──────────────────────────────────────────
const state = {
  data:        null,
  view:        'subjects',   // subjects | papers | topics | search
  subject:     null,
  paper:       null,         // null means either home or direct subject (no papers)
  searchQuery: '',
  dragSrc:     null,
};

// ── COUNTS ────────────────────────────────────────
function countTopics(data) {
  let t = 0;
  for (const s of Object.values(data.subjects || {}))
    t += s._direct
      ? (s.topics || []).length
      : Object.values(s.papers || {}).reduce((a, arr) => a + arr.length, 0);
  return t;
}
function countPapers(data) {
  let p = 0;
  for (const s of Object.values(data.subjects || {}))
    if (!s._direct) p += Object.keys(s.papers || {}).length;
  return p;
}
function getColorIdx(name) {
  return (state.data?.subjects?.[name]?._colorIdx ?? 0) % SUBJECT_COLORS.length;
}
function getIconSvg(name) {
  const key   = state.data?.subjects?.[name]?._iconKey;
  const found = key && SUBJECT_ICONS.find(i => i.key === key);
  return found ? found.svg : SUBJECT_ICONS[getColorIdx(name) % SUBJECT_ICONS.length].svg;
}

// ── LOCAL STORAGE (IndexedDB via localForage) ──────
localforage.config({ name: 'StudyVault', storeName: 'data' });

async function localLoad() {
  let d = await localforage.getItem(STORAGE_KEY);
  if (!d) { d = makeSample(); await localforage.setItem(STORAGE_KEY, d); }
  if (!d.subjects) d.subjects = {};
  return d;
}
async function localSave(data) {
  await localforage.setItem(STORAGE_KEY, data);
}

// ── FIREBASE SYNC ─────────────────────────────────
function setSyncState(s) {
  const btn = $('#syncBtn');
  btn.classList.remove('syncing', 'synced', 'offline', 'error');
  btn.classList.add(s);
  const labels = { syncing:'Syncing…', synced:'All changes saved', offline:'Offline — syncs when connected', error:'Sync error' };
  btn.title = labels[s] || '';
}

async function pushToFirestore(data) {
  if (!firebaseReady() || !currentUser || !db) return;
  setSyncState('syncing');
  try {
    await setDoc(doc(db, 'users', currentUser.uid), { data: JSON.stringify(data) });
    setSyncState('synced');
  } catch (e) { console.error('Firestore write:', e); setSyncState('error'); }
}

function schedulePush() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => pushToFirestore(state.data), 1200);
}

async function pullFromFirestore() {
  if (!firebaseReady() || !currentUser || !db) return;
  setSyncState('syncing');
  try {
    const snap = await getDoc(doc(db, 'users', currentUser.uid));
    if (snap.exists()) {
      const remote = JSON.parse(snap.data().data);
      state.data = remote;
      await localSave(remote);
      setSyncState('synced');
      render();
      showToast('Synced from cloud', 'success');
    } else {
      setSyncState('synced');
    }
  } catch (e) { console.error('Firestore read:', e); setSyncState('error'); }
}

function subscribeFirestore() {
  if (!firebaseReady() || !currentUser || !db) return;
  if (unsubFirestore) unsubFirestore();
  unsubFirestore = onSnapshot(doc(db, 'users', currentUser.uid), snap => {
    if (snap.exists()) {
      const remote = JSON.parse(snap.data().data);
      if (JSON.stringify(remote) !== JSON.stringify(state.data)) {
        state.data = remote; localSave(remote); render();
      }
    }
  }, err => { console.warn('Firestore listener:', err); setSyncState('error'); });
}

async function save() {
  await localSave(state.data);
  if (currentUser && firebaseReady()) schedulePush();
}

// ── DOM HELPERS ────────────────────────────────────
const $ = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];

function showLoading(on) { $('#loadingBar').classList.toggle('active', on); }

function openModal(id) {
  const m = $('#' + id);
  m.classList.add('open');
  m.setAttribute('aria-hidden', 'false');
  setTimeout(() => {
    const f = m.querySelector('input:not([type=hidden]):not([type=checkbox]), button.btn.primary');
    if (f) f.focus();
  }, 80);
}
function closeModal(id) {
  const m = $('#' + id);
  m.classList.remove('open');
  m.setAttribute('aria-hidden', 'true');
}
function closeAllModals() {
  $$('.modal-overlay').forEach(m => { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); });
}

// ── TOAST ─────────────────────────────────────────
function showToast(msg, type = 'info', ms = 3000) {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span class="toast-dot"></span><span>${esc(msg)}</span><button class="toast-close" aria-label="Dismiss">×</button>`;
  t.querySelector('.toast-close').onclick = () => removeToast(t);
  $('#toast-container').appendChild(t);
  setTimeout(() => removeToast(t), ms);
}
function removeToast(t) {
  if (!t.parentNode) return;
  t.classList.add('exiting');
  setTimeout(() => t.parentNode?.removeChild(t), 250);
}

// ── RENDER DISPATCHER ─────────────────────────────
// FIX: topics view with paper===null means direct subject → renderDirectTopics
function render() {
  if (state.view === 'subjects') return renderSubjects();
  if (state.view === 'papers')   return renderPapers(state.subject);
  if (state.view === 'topics')   return state.paper !== null
    ? renderTopics(state.subject, state.paper)
    : renderDirectTopics(state.subject);
  if (state.view === 'search')   return renderSearch(state.searchQuery);
}

// ── TOPBAR HELPERS ─────────────────────────────────
function setTitle(t) { $('#pageTitle').textContent = t; }
function showBack(on) { $('#backBtn').style.visibility = on ? 'visible' : 'hidden'; }
function setFab(show, onClick) {
  const fab = $('#fabBtn');
  fab.style.display = show ? 'flex' : 'none';
  fab.onclick = onClick || null;
}

// ── BODY BREADCRUMB ────────────────────────────────
// Called right after area.innerHTML = '' so it's the first child.
// All non-last crumbs are clickable buttons.
function buildBreadcrumb(area, segments) {
  if (!segments || segments.length === 0) return;
  const nav = document.createElement('nav');
  nav.className = 'body-breadcrumb';
  nav.setAttribute('aria-label', 'Breadcrumb');

  segments.forEach((seg, i) => {
    const isLast = i === segments.length - 1;
    const span   = document.createElement('span');
    span.className  = 'crumb' + (isLast ? ' active' : '');
    span.textContent = seg.label;

    if (!isLast && seg.action) {
      span.setAttribute('role', 'button');
      span.setAttribute('tabindex', '0');
      span.onclick = e => { e.stopPropagation(); seg.action(); };
      span.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); seg.action(); }
      });
    }
    nav.appendChild(span);

    if (!isLast) {
      const sep = document.createElement('span');
      sep.className = 'crumb-sep';
      sep.textContent = '›';
      sep.setAttribute('aria-hidden', 'true');
      nav.appendChild(sep);
    }
  });

  // First child so it appears above section headers
  area.appendChild(nav);
}

// ── EMPTY STATE ────────────────────────────────────
function emptyState(title, sub) {
  const div = document.createElement('div');
  div.className = 'empty-state fade-up';
  div.innerHTML = `
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
    </svg>
    <p><strong>${esc(title)}</strong><br/>${esc(sub)}</p>`;
  return div;
}

// ═══════════════════════════════════════════════════
// VIEWS
// ═══════════════════════════════════════════════════

// ── SUBJECTS ──────────────────────────────────────
function renderSubjects() {
  state.view = 'subjects'; state.subject = null; state.paper = null;
  setTitle('StudyVault'); showBack(false);
  setFab(true, openSubjectModal);
  closeAllMenus();

  const subjects = Object.keys(state.data.subjects || {});
  const area = $('#contentArea');
  area.innerHTML = '';

  // Stats
  const stats = document.createElement('div');
  stats.className = 'stats-row fade-up';
  stats.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
        </svg>
      </div>
      <div><div class="stat-value">${subjects.length}</div><div class="stat-label">Subjects</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <div><div class="stat-value">${countPapers(state.data)}</div><div class="stat-label">Papers</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
        </svg>
      </div>
      <div><div class="stat-value">${countTopics(state.data)}</div><div class="stat-label">Topics</div></div>
    </div>`;
  area.appendChild(stats);

  const hdr = document.createElement('div');
  hdr.className = 'section-header fade-up fade-up-d1';
  hdr.innerHTML = `<span class="section-title">Your Subjects</span>`;
  area.appendChild(hdr);

  const grid = document.createElement('div');
  grid.className = 'card-grid fade-up fade-up-d2';

  subjects.forEach(name => {
    const subj     = state.data.subjects[name];
    const isDirect = !!subj._direct;
    const ci       = getColorIdx(name);
    const color    = SUBJECT_COLORS[ci];
    const iconSvg  = getIconSvg(name);

    let countText;
    if (isDirect) {
      const tc = (subj.topics || []).length;
      countText = `${tc} topic${tc !== 1 ? 's' : ''} · Direct`;
    } else {
      const pc = Object.keys(subj.papers || {}).length;
      const tc = countTopics({ subjects: { [name]: subj } });
      countText = `${pc} paper${pc !== 1 ? 's' : ''} · ${tc} topic${tc !== 1 ? 's' : ''}`;
    }

    const card = document.createElement('div');
    card.className = 'subj-card';
    card.tabIndex  = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Open ${name}`);
    card.style.setProperty('--card-accent',   color.icon);
    card.style.setProperty('--card-icon-bg',  color.bg);
    card.innerHTML = `
      <div class="subj-actions">
        <button class="subj-action-btn del" title="Delete ${esc(name)}" aria-label="Delete ${esc(name)}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
      <div class="subj-icon">${iconSvg}</div>
      <div class="subj-name">${esc(name)}</div>
      <div class="subj-count">${countText}</div>`;

    const open = () => isDirect ? renderDirectTopics(name) : renderPapers(name);
    card.addEventListener('click',   e => { if (!e.target.closest('.subj-actions')) open(); });
    card.addEventListener('keydown', e => { if ((e.key==='Enter'||e.key===' ')&&!e.target.closest('.subj-actions')){ e.preventDefault(); open(); }});

    card.querySelector('.subj-action-btn.del').onclick = e => {
      e.stopPropagation();
      confirmAction(`Delete "${name}" and all its content?`, async () => {
        delete state.data.subjects[name];
        await save(); renderSubjects(); showToast(`"${name}" deleted`, 'info');
      });
    };
    grid.appendChild(card);
  });

  area.appendChild(grid);
}

// ── DIRECT TOPICS (e.g. ICT — no papers layer) ────
function renderDirectTopics(subject) {
  state.view = 'topics'; state.subject = subject; state.paper = null;
  setTitle(subject); showBack(true);
  setFab(true, () => openTopicModal());
  closeAllMenus();

  const topics = state.data.subjects[subject]?.topics || [];
  const area   = $('#contentArea');
  area.innerHTML = '';

  buildBreadcrumb(area, [
    { label: 'StudyVault', action: renderSubjects },
    { label: subject },
  ]);

  const hdr = document.createElement('div');
  hdr.className = 'section-header fade-up';
  hdr.innerHTML = `<span class="section-title">${esc(subject)} · ${topics.length} topic${topics.length !== 1 ? 's' : ''}</span>`;
  area.appendChild(hdr);

  if (topics.length === 0) {
    area.appendChild(emptyState('No topics yet', 'Tap + to add your first class link.'));
    return;
  }

  const list = document.createElement('div');
  list.className = 'topic-list fade-up fade-up-d1';
  topics.forEach((t, idx) => list.appendChild(makeTopicItem(t, subject, null, idx)));
  area.appendChild(list);
}

// ── PAPERS ────────────────────────────────────────
function renderPapers(subject) {
  state.view = 'papers'; state.subject = subject; state.paper = null;
  setTitle(subject); showBack(true);
  setFab(true, openPaperModal);
  closeAllMenus();

  const papers = Object.keys(state.data.subjects[subject]?.papers || {});
  const area   = $('#contentArea');
  area.innerHTML = '';

  buildBreadcrumb(area, [
    { label: 'StudyVault', action: renderSubjects },
    { label: subject },
  ]);

  const hdr = document.createElement('div');
  hdr.className = 'section-header fade-up';
  hdr.innerHTML = `<span class="section-title">${esc(subject)} · Papers</span>`;
  area.appendChild(hdr);

  if (papers.length === 0) {
    area.appendChild(emptyState('No papers yet', 'Tap + to add your first paper.'));
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'paper-grid fade-up fade-up-d1';

  papers.forEach(name => {
    const topics = state.data.subjects[subject].papers[name] || [];
    const card   = document.createElement('div');
    card.className = 'paper-card'; card.tabIndex = 0;
    card.setAttribute('role', 'button'); card.setAttribute('aria-label', `Open ${name}`);
    card.innerHTML = `
      <div class="paper-actions">
        <button class="subj-action-btn del" title="Delete paper" aria-label="Delete ${esc(name)}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      <div class="paper-name">${esc(name)}</div>
      <div class="paper-count">${topics.length} topic${topics.length !== 1 ? 's' : ''}</div>`;

    card.addEventListener('click',   e => { if (!e.target.closest('.paper-actions')) renderTopics(subject, name); });
    card.addEventListener('keydown', e => { if ((e.key==='Enter'||e.key===' ')&&!e.target.closest('.paper-actions')){ e.preventDefault(); renderTopics(subject, name); }});

    card.querySelector('.subj-action-btn.del').onclick = e => {
      e.stopPropagation();
      confirmAction(`Delete paper "${name}" and all its topics?`, async () => {
        delete state.data.subjects[subject].papers[name];
        await save(); renderPapers(subject); showToast(`"${name}" deleted`, 'info');
      });
    };
    grid.appendChild(card);
  });

  // Inline add-card
  const addTile = document.createElement('div');
  addTile.className = 'add-card'; addTile.tabIndex = 0;
  addTile.setAttribute('role', 'button'); addTile.setAttribute('aria-label', 'Add paper');
  addTile.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
    <span style="font-size:.82rem;font-weight:600">Add Paper</span>`;
  addTile.onclick = openPaperModal;
  addTile.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' '){ e.preventDefault(); openPaperModal(); }});
  grid.appendChild(addTile);
  area.appendChild(grid);
}

// ── TOPICS (with paper) ────────────────────────────
function renderTopics(subject, paper) {
  state.view = 'topics'; state.subject = subject; state.paper = paper;
  setTitle(paper); showBack(true);
  setFab(true, () => openTopicModal());
  closeAllMenus();

  const topics = state.data.subjects[subject]?.papers?.[paper] || [];
  const area   = $('#contentArea');
  area.innerHTML = '';

  buildBreadcrumb(area, [
    { label: 'StudyVault', action: renderSubjects },
    { label: subject,      action: () => renderPapers(subject) },
    { label: paper },
  ]);

  const hdr = document.createElement('div');
  hdr.className = 'section-header fade-up';
  hdr.innerHTML = `<span class="section-title">${esc(subject)} › ${esc(paper)} · ${topics.length} topic${topics.length !== 1 ? 's' : ''}</span>`;
  area.appendChild(hdr);

  if (topics.length === 0) {
    area.appendChild(emptyState('No topics yet', 'Tap + to add your first class link.'));
    return;
  }

  const list = document.createElement('div');
  list.className = 'topic-list fade-up fade-up-d1';
  topics.forEach((t, idx) => list.appendChild(makeTopicItem(t, subject, paper, idx)));
  area.appendChild(list);
}

// ── SEARCH ────────────────────────────────────────
function renderSearch(q) {
  state.view = 'search';
  setTitle('Search'); showBack(true); setFab(false, null);
  closeAllMenus();

  const area = $('#contentArea');
  area.innerHTML = '';

  buildBreadcrumb(area, [
    { label: 'StudyVault', action: renderSubjects },
    { label: `"${q}"` },
  ]);

  const results = [];
  const ql = q.toLowerCase();
  for (const [subj, sData] of Object.entries(state.data.subjects || {})) {
    if (sData._direct) {
      for (const t of (sData.topics || []))
        if (t.title.toLowerCase().includes(ql) || subj.toLowerCase().includes(ql))
          results.push({ subj, paper: null, t });
    } else {
      for (const [paper, arr] of Object.entries(sData.papers || {}))
        for (const t of arr)
          if (t.title.toLowerCase().includes(ql) || paper.toLowerCase().includes(ql) || subj.toLowerCase().includes(ql))
            results.push({ subj, paper, t });
    }
  }

  if (results.length === 0) {
    area.appendChild(emptyState('No results', `Nothing matching "${q}" found.`));
    return;
  }

  const countDiv = document.createElement('div');
  countDiv.className = 'section-header fade-up';
  countDiv.innerHTML = `<span class="section-title">${results.length} result${results.length !== 1 ? 's' : ''} for "${esc(q)}"</span>`;
  area.appendChild(countDiv);

  // Group by subject → paper
  const groups = {};
  results.forEach(r => {
    if (!groups[r.subj]) groups[r.subj] = {};
    const k = r.paper ?? '__direct__';
    if (!groups[r.subj][k]) groups[r.subj][k] = [];
    groups[r.subj][k].push(r.t);
  });

  for (const [subj, papers] of Object.entries(groups)) {
    const grp = document.createElement('div');
    grp.className = 'search-group fade-up';
    grp.innerHTML = `<div class="search-group-header">${esc(subj)}</div>`;
    for (const [pk, topics] of Object.entries(papers)) {
      if (pk !== '__direct__') {
        const pl = document.createElement('div');
        pl.className = 'search-group-paper'; pl.textContent = pk;
        grp.appendChild(pl);
      }
      const list = document.createElement('div');
      list.className = 'topic-list';
      const actualPaper = pk === '__direct__' ? null : pk;
      topics.forEach(t => list.appendChild(makeTopicItem(t, subj, actualPaper, 0)));
      grp.appendChild(list);
    }
    area.appendChild(grp);
  }
}

// ═══════════════════════════════════════════════════
// TOPIC ITEM  (portal-based 3-dot menu — fully fixed)
// ═══════════════════════════════════════════════════
// We track which button currently has its menu open.
// Clicking same button toggles it off.
// Clicking a different button closes the old and opens a new one.
let openMenuBtn = null;

function closeAllMenus() {
  $('#topic-menu-portal').innerHTML = '';
  if (openMenuBtn) {
    openMenuBtn.setAttribute('aria-expanded', 'false');
    openMenuBtn = null;
  }
}

function makeTopicItem(t, subject, paper, idx) {
  const item = document.createElement('div');
  item.className = 'topic-item';
  item.dataset.id = t.id;
  item.draggable  = true;

  item.innerHTML = `
    <span class="drag-handle" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="9"  cy="6"  r="1.5" fill="currentColor" stroke="none"/>
        <circle cx="15" cy="6"  r="1.5" fill="currentColor" stroke="none"/>
        <circle cx="9"  cy="12" r="1.5" fill="currentColor" stroke="none"/>
        <circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none"/>
        <circle cx="9"  cy="18" r="1.5" fill="currentColor" stroke="none"/>
        <circle cx="15" cy="18" r="1.5" fill="currentColor" stroke="none"/>
      </svg>
    </span>
    <span class="topic-label" title="${esc(t.title)}">${esc(t.title)}</span>
    <a class="topic-link" href="${esc(t.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open link">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
      Open
    </a>
    <div class="topic-menu">
      <button class="menu-btn" aria-label="Topic options" aria-haspopup="true" aria-expanded="false">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="5"  r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
          <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none"/>
        </svg>
      </button>
    </div>`;

  const menuBtn = item.querySelector('.menu-btn');
  const portal  = $('#topic-menu-portal');

  function openPortalMenu() {
    // Close any existing menu first (including from other rows)
    closeAllMenus();

    const rect = menuBtn.getBoundingClientRect();

    // Position: fixed, right-aligned to button
    // Flip upward if too close to bottom of viewport
    const menuHeight = 94;
    const top = (rect.bottom + menuHeight > window.innerHeight)
      ? rect.top - menuHeight
      : rect.bottom + 6;

    const menu = document.createElement('div');
    menu.className = 'menu-content open portal-menu';
    menu.setAttribute('role', 'menu');
    menu.style.cssText = `
      pointer-events: auto;
      position: fixed;
      top: ${top}px;
      right: ${window.innerWidth - rect.right}px;
    `;

    menu.innerHTML = `
      <button class="menu-item edit-btn" role="menuitem">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Edit
      </button>
      <button class="menu-item danger delete-btn" role="menuitem">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/>
        </svg>
        Delete
      </button>`;

    menu.querySelector('.edit-btn').onclick = e => {
      e.stopPropagation();
      closeAllMenus();
      openTopicModal(t);
    };

    menu.querySelector('.delete-btn').onclick = e => {
      e.stopPropagation();
      closeAllMenus();
      confirmAction(`Delete topic "${t.title}"?`, async () => {
        const arr = paper
          ? state.data.subjects[subject].papers[paper]
          : state.data.subjects[subject].topics;
        const i = arr.findIndex(x => x.id === t.id);
        if (i !== -1) arr.splice(i, 1);
        await save();
        paper ? renderTopics(subject, paper) : renderDirectTopics(subject);
        showToast(`"${t.title}" deleted`, 'info');
      });
    };

    portal.appendChild(menu);
    menuBtn.setAttribute('aria-expanded', 'true');
    openMenuBtn = menuBtn;
  }

  // FIX: track which button is open so clicking same btn toggles,
  // clicking a different btn closes old + opens new.
  menuBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (openMenuBtn === menuBtn) {
      // Same button clicked again → close (toggle off)
      closeAllMenus();
    } else {
      // Different button → openPortalMenu closes old then opens new
      openPortalMenu();
    }
  });

  // Click row body → open link
  item.addEventListener('click', e => {
    if (e.target.closest('a, .topic-menu, .drag-handle')) return;
    window.open(t.url, '_blank', 'noopener,noreferrer');
  });

  // ── DRAG & DROP ───────────────────────────────────
  item.addEventListener('dragstart', e => {
    state.dragSrc = t.id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', t.id);
    setTimeout(() => item.classList.add('dragging'), 0);
  });
  item.addEventListener('dragend', () => {
    item.classList.remove('dragging');
    state.dragSrc = null;
    $$('.topic-item').forEach(el => el.style.borderTop = '');
  });
  item.addEventListener('dragover', e => {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    $$('.topic-item').forEach(el => el.style.borderTop = '');
    if (t.id !== state.dragSrc) item.style.borderTop = '2px solid var(--accent)';
  });
  item.addEventListener('dragleave', () => { item.style.borderTop = ''; });
  item.addEventListener('drop', async e => {
    e.preventDefault();
    item.style.borderTop = '';
    const srcId = e.dataTransfer.getData('text/plain');
    if (!srcId || srcId === t.id) return;
    const arr = paper
      ? state.data.subjects[subject].papers[paper]
      : state.data.subjects[subject].topics;
    const from = arr.findIndex(x => x.id === srcId);
    const to   = arr.findIndex(x => x.id === t.id);
    if (from === -1 || to === -1) return;
    arr.splice(to, 0, arr.splice(from, 1)[0]);
    await save();
    paper ? renderTopics(subject, paper) : renderDirectTopics(subject);
  });

  return item;
}

// ═══════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════

// ── CONFIRM ───────────────────────────────────────
let pendingConfirm = null;
function confirmAction(msg, onOk) {
  $('#confirmMsg').textContent = msg;
  pendingConfirm = onOk;
  openModal('confirmModal');
}

// ── TOPIC MODAL ────────────────────────────────────
function openTopicModal(existing = null) {
  $('#topicForm').reset();
  $('#topicTitleError').textContent = '';
  $('#topicUrlError').textContent   = '';

  if (existing) {
    $('#modalTitle').textContent   = 'Edit Topic';
    $('#saveTopicBtn').textContent = 'Save Changes';
    $('#topicId').value    = existing.id;
    $('#topicTitle').value = existing.title;
    $('#topicUrl').value   = existing.url;
  } else {
    $('#modalTitle').textContent   = 'Add Topic';
    $('#saveTopicBtn').textContent = 'Add Topic';
    $('#topicId').value = '';
  }
  openModal('topicModal');
}

function validateTopic(title, url) {
  let ok = true;
  $('#topicTitleError').textContent = '';
  $('#topicUrlError').textContent   = '';
  if (!title || title.length < 2) {
    $('#topicTitleError').textContent = 'Title must be at least 2 characters.';
    ok = false;
  }
  if (!/^https?:\/\/.+/.test(url)) {
    $('#topicUrlError').textContent = 'Enter a valid URL starting with https://';
    ok = false;
  }
  return ok;
}

// ── SUBJECT MODAL ──────────────────────────────────
let selectedIconKey  = 'book';
let selectedColorIdx = 0;

function openSubjectModal() {
  $('#subjectName').value = '';
  $('#subjectNameError').textContent = '';
  $('#subjectDirect').checked = false;
  selectedColorIdx = Object.keys(state.data.subjects).length % SUBJECT_COLORS.length;
  selectedIconKey  = 'book';

  const picker = $('#iconPicker');
  picker.innerHTML = '';
  SUBJECT_ICONS.forEach((icon, i) => {
    const color = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
    const el    = document.createElement('div');
    el.className = 'icon-picker-item' + (icon.key === selectedIconKey ? ' selected' : '');
    el.title     = icon.label;
    el.setAttribute('role',        'radio');
    el.setAttribute('aria-checked', String(icon.key === selectedIconKey));
    el.setAttribute('tabindex',     icon.key === selectedIconKey ? '0' : '-1');
    el.innerHTML = `${icon.svg}<span class="icon-picker-dot" style="background:${color.icon}"></span>`;

    el.addEventListener('click', () => {
      $$('.icon-picker-item').forEach(x => {
        x.classList.remove('selected');
        x.setAttribute('aria-checked', 'false');
        x.setAttribute('tabindex', '-1');
      });
      el.classList.add('selected');
      el.setAttribute('aria-checked', 'true');
      el.setAttribute('tabindex', '0');
      selectedIconKey  = icon.key;
      selectedColorIdx = i % SUBJECT_COLORS.length;
    });
    picker.appendChild(el);
  });

  openModal('subjectModal');
}

// ── PAPER MODAL ────────────────────────────────────
function openPaperModal() {
  $('#paperName').value = '';
  $('#paperNameError').textContent = '';
  openModal('paperModal');
}

// ── EXPORT ────────────────────────────────────────
function exportData() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: `StudyVault-${new Date().toISOString().slice(0, 10)}.json`
  });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Backup exported', 'success');
}

// ── IMPORT ────────────────────────────────────────
function importData(file) {
  if (!file || file.type !== 'application/json') { showToast('Select a valid .json file', 'error'); return; }
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed.subjects) { showToast('Invalid backup format', 'error'); return; }
      if (!confirm('Import this backup? Your current data will be replaced.')) return;
      state.data = parsed; await save(); renderSubjects(); showToast('Data imported', 'success');
    } catch { showToast('Failed to parse file', 'error'); }
  };
  reader.readAsText(file);
}

// ── THEME ─────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = $('#themeIcon');
  if (theme === 'light') {
    icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  } else {
    icon.innerHTML = `
      <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" fill="none"/>
      <line x1="12" y1="1"    x2="12" y2="3"    stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="12" y1="21"   x2="12" y2="23"   stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="4.22" y1="4.22"   x2="5.64"  y2="5.64"  stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="1"  y1="12" x2="3"  y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"  stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
  }
  localStorage.setItem(THEME_KEY, theme);
}

// ── USER UI ───────────────────────────────────────
function updateUserUI(user) {
  const avatar     = $('#userAvatar');
  const initials   = $('#userInitials');
  const signInBtn  = $('#signInFromApp');
  const signOutBtn = $('#signOutBtn');

  if (user) {
    if (user.photoURL) {
      avatar.src = user.photoURL; avatar.style.display = 'block'; initials.style.display = 'none';
    } else {
      initials.textContent = (user.displayName || 'U')[0].toUpperCase();
      avatar.style.display = 'none'; initials.style.display = 'flex';
    }
    $('#dropdownName').textContent  = user.displayName || 'User';
    $('#dropdownEmail').textContent = user.email || '';
    signInBtn.style.display = 'none'; signOutBtn.style.display = 'flex';
    setSyncState('synced');
  } else {
    avatar.style.display = 'none'; initials.textContent = 'G'; initials.style.display = 'flex';
    $('#dropdownName').textContent  = 'Guest';
    $('#dropdownEmail').textContent = 'Not signed in';
    signInBtn.style.display = 'flex'; signOutBtn.style.display = 'none';
    setSyncState('offline');
  }
}

// ── AUTH ──────────────────────────────────────────
async function signInWithGoogle() {
  if (!firebaseReady()) { showToast('Firebase not configured — see SETUP.md', 'warning', 6000); return; }
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
    // onAuthStateChanged handles the rest
  } catch (e) {
    if (e.code !== 'auth/popup-closed-by-user') { console.error(e); showToast('Sign in failed: ' + e.message, 'error'); }
  }
}

async function signOutUser() {
  if (!auth) return;
  if (unsubFirestore) { unsubFirestore(); unsubFirestore = null; }
  await signOut(auth); currentUser = null; updateUserUI(null); setSyncState('offline');
  showToast('Signed out', 'info');
}

// ── NETWORK ───────────────────────────────────────
window.addEventListener('online',  () => { setSyncState(currentUser ? 'synced' : 'offline'); if (currentUser) schedulePush(); showToast('Back online', 'success'); });
window.addEventListener('offline', () => { setSyncState('offline'); showToast('Offline — saved locally', 'warning'); });

// ═══════════════════════════════════════════════════
// EVENT WIRING
// ═══════════════════════════════════════════════════
function wireEvents() {

  // ── Back button ──
  // FIX: topics with paper===null → direct subject → go to subjects, not papers
  $('#backBtn').addEventListener('click', () => {
    if (state.view === 'topics') {
      return state.paper !== null ? renderPapers(state.subject) : renderSubjects();
    }
    if (state.view === 'papers' || state.view === 'search') return renderSubjects();
    renderSubjects();
  });

  // ── Search ──
  let searchTimer;
  $('#searchInput').addEventListener('input', e => {
    const q = e.target.value.trim();
    clearTimeout(searchTimer);
    if (!q) { state.searchQuery = ''; render(); return; }
    searchTimer = setTimeout(() => { state.searchQuery = q; renderSearch(q); }, 260);
  });
  $('#searchInput').addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.target.value = ''; state.searchQuery = ''; render(); }
  });

  // ── Theme ──
  $('#themeToggle').addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  // ── Export / Import ──
  $('#exportBtn').addEventListener('click', exportData);
  $('#importFile').addEventListener('change', e => { importData(e.target.files[0]); e.target.value = ''; });

  // ── Manual sync ──
  $('#syncBtn').addEventListener('click', () => {
    if (!currentUser) { showToast('Sign in to sync across devices', 'info'); return; }
    pullFromFirestore();
  });

  // ── User dropdown ──
  const userBtn  = $('#userMenuBtn');
  const dropdown = $('#userDropdown');
  userBtn.addEventListener('click', e => {
    e.stopPropagation();
    const open = dropdown.classList.toggle('open');
    userBtn.setAttribute('aria-expanded',   String(open));
    dropdown.setAttribute('aria-hidden', String(!open));
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.user-area')) {
      dropdown.classList.remove('open');
      userBtn.setAttribute('aria-expanded', 'false');
      dropdown.setAttribute('aria-hidden',  'true');
    }
  });

  // ── Auth buttons ──
  $('#googleSignInBtn').addEventListener('click', signInWithGoogle);
  $('#guestBtn').addEventListener('click', () => {
    $('#authScreen').style.display = 'none';
    $('#app').style.display = 'block';
    updateUserUI(null); renderSubjects();
  });
  $('#signInFromApp').addEventListener('click', () => { dropdown.classList.remove('open'); signInWithGoogle(); });
  $('#signOutBtn').addEventListener('click',    () => { dropdown.classList.remove('open'); signOutUser(); });

  // ── Topic form ──
  $('#topicForm').addEventListener('submit', async e => {
    e.preventDefault();
    const id    = $('#topicId').value;
    const title = $('#topicTitle').value.trim();
    const url   = $('#topicUrl').value.trim();
    if (!validateTopic(title, url)) return;

    // FIX: use paper===null check (not falsy) since null means direct subject
    const isDirect = (state.paper === null);
    const arr = isDirect
      ? state.data.subjects[state.subject].topics
      : state.data.subjects[state.subject].papers[state.paper];

    if (id) {
      const found = arr.find(x => x.id === id);
      if (found) { found.title = title; found.url = url; }
      showToast('Topic updated', 'success');
    } else {
      arr.push({ id: uid(), title, url });
      showToast('Topic added', 'success');
    }
    await save();
    closeModal('topicModal');
    isDirect ? renderDirectTopics(state.subject) : renderTopics(state.subject, state.paper);
  });

  $('#cancelModalBtn').addEventListener('click', () => closeModal('topicModal'));
  $('#topicModal').addEventListener('click', e => { if (e.target === $('#topicModal')) closeModal('topicModal'); });

  // ── Subject form ──
  $('#saveSubjectBtn').addEventListener('click', async () => {
    const name   = $('#subjectName').value.trim();
    const direct = $('#subjectDirect').checked;
    $('#subjectNameError').textContent = '';
    if (!name) { $('#subjectNameError').textContent = 'Enter a subject name.'; return; }
    if (state.data.subjects[name]) { $('#subjectNameError').textContent = 'Subject already exists.'; return; }

    state.data.subjects[name] = direct
      ? { _colorIdx: selectedColorIdx, _iconKey: selectedIconKey, _direct: true, topics: [] }
      : { _colorIdx: selectedColorIdx, _iconKey: selectedIconKey, papers: {} };

    await save(); closeModal('subjectModal'); renderSubjects(); showToast(`"${name}" added`, 'success');
  });
  $('#cancelSubjectBtn').addEventListener('click', () => closeModal('subjectModal'));
  $('#subjectModal').addEventListener('click', e => { if (e.target === $('#subjectModal')) closeModal('subjectModal'); });
  $('#subjectName').addEventListener('keydown', e => { if (e.key === 'Enter') $('#saveSubjectBtn').click(); });

  // ── Paper form ──
  $('#savePaperBtn').addEventListener('click', async () => {
    const name = $('#paperName').value.trim();
    $('#paperNameError').textContent = '';
    if (!name) { $('#paperNameError').textContent = 'Enter a paper name.'; return; }
    if (state.data.subjects[state.subject].papers[name]) { $('#paperNameError').textContent = 'Paper already exists.'; return; }
    state.data.subjects[state.subject].papers[name] = [];
    await save(); closeModal('paperModal'); renderPapers(state.subject); showToast(`"${name}" added`, 'success');
  });
  $('#cancelPaperBtn').addEventListener('click', () => closeModal('paperModal'));
  $('#paperModal').addEventListener('click', e => { if (e.target === $('#paperModal')) closeModal('paperModal'); });
  $('#paperName').addEventListener('keydown', e => { if (e.key === 'Enter') $('#savePaperBtn').click(); });

  // ── Confirm modal ──
  $('#confirmOk').addEventListener('click', () => {
    closeModal('confirmModal');
    if (pendingConfirm) { pendingConfirm(); pendingConfirm = null; }
  });
  $('#confirmCancel').addEventListener('click', () => { closeModal('confirmModal'); pendingConfirm = null; });

  // ── Generic modal close (× buttons) ──
  $$('.modal-close[data-modal]').forEach(btn =>
    btn.addEventListener('click', () => closeModal(btn.dataset.modal))
  );

  // ── Close portal menu on outside click ──
  document.addEventListener('click', e => {
    if (!e.target.closest('.topic-menu') && !e.target.closest('.portal-menu')) {
      closeAllMenus();
    }
  });

  // ── Escape closes modals and menus ──
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeAllModals(); closeAllMenus(); }
  });
}

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════
async function init() {
  applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
  wireEvents();
  state.data = await localLoad();

  if (firebaseReady()) {
    $('#authScreen').style.display = 'flex';

    onAuthStateChanged(auth, async user => {
      currentUser = user;
      if (user) {
        $('#authScreen').style.display = 'none';
        $('#app').style.display        = 'block';
        updateUserUI(user);
        showLoading(true);
        await pullFromFirestore();
        subscribeFirestore();
        showLoading(false);
        renderSubjects();
        showToast(`Welcome, ${user.displayName?.split(' ')[0] || 'User'}!`, 'success');
      } else {
        $('#authScreen').style.display = 'flex';
        $('#app').style.display        = 'none';
      }
    });
  } else {
    // Offline-only mode — no Firebase config provided
    console.warn('[StudyVault] Firebase not configured. Running offline-only. See SETUP.md.');
    $('#authScreen').style.display = 'none';
    $('#app').style.display        = 'block';
    updateUserUI(null);
    renderSubjects();
  }
}

init();
