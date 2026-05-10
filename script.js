// ═══════════════════════════════════════════════════
// STUDYVAULT — script.js
// Firebase Google Auth + Firestore (free tier)
// No backend needed. Works offline via localForage.
// ═══════════════════════════════════════════════════

// ── FIREBASE CONFIG ────────────────────────────────
// Replace these with your own Firebase project values.
// Get them at: https://console.firebase.google.com
// (Free Spark plan — no credit card needed)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore, doc, setDoc, getDoc, onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBcnT3-BFJr5C_1jfdJvqoKWfwjEEN15KY",
  authDomain:        "studyvault-f775d.firebaseapp.com",
  projectId:         "studyvault-f775d",
  storageBucket:     "studyvault-f775d.firebasestorage.app",
  messagingSenderId: "636451122016",
  appId:             "1:636451122016:web:d604285d72e1bcde254c05"
};

// ── FIREBASE INIT ──────────────────────────────────
let app, auth, db, currentUser = null, unsubFirestore = null;

function firebaseReady() {
  return FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY";
}

if (firebaseReady()) {
  app  = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);
  db   = getFirestore(app);
}

// ── CONSTANTS ──────────────────────────────────────
const STORAGE_KEY = 'studyvault-data-v1';
const THEME_KEY   = 'studyvault-theme';

const SUBJECT_COLORS = [
  { bg: 'var(--c1)', text: 'var(--c1t)', icon: '#1d4ed8' },
  { bg: 'var(--c2)', text: 'var(--c2t)', icon: '#c2410c' },
  { bg: 'var(--c3)', text: 'var(--c3t)', icon: '#7c3aed' },
  { bg: 'var(--c4)', text: 'var(--c4t)', icon: '#047857' },
  { bg: 'var(--c5)', text: 'var(--c5t)', icon: '#9d174d' },
  { bg: 'var(--c6)', text: 'var(--c6t)', icon: '#0f766e' },
];

const SUBJECT_ICONS = [
  // Book
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>`,
  // Flask
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6M9 3v7l-6 11h18L15 10V3"/><path d="M6 19h12"/></svg>`,
  // Calculator
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/><line x1="16" y1="18" x2="16" y2="18"/></svg>`,
  // Leaf
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 8C8 10 5.9 16.17 3.82 19.34A1 1 0 004.82 21C7 21 15 21 18 14c.94-2.12 1-5 .5-7C18 7 17.5 7 17 8z"/><path d="M3.82 19.34L12 12"/></svg>`,
  // Globe
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`,
  // Cpu
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="2" x2="9" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/><line x1="20" y1="9" x2="22" y2="9"/><line x1="20" y1="15" x2="22" y2="15"/><line x1="2" y1="9" x2="4" y2="9"/><line x1="2" y1="15" x2="4" y2="15"/></svg>`,
];

const SAMPLE_DATA = {
  subjects: {
    "Physics": {
      _colorIdx: 0,
      papers: {
        "1st Paper": [
          { id: uid(), title: "Measurement", url: "https://example.com/physics-measurement" },
          { id: uid(), title: "Motion in a Straight Line", url: "https://example.com/physics-motion" }
        ],
        "2nd Paper": [
          { id: uid(), title: "Electricity & Circuits", url: "https://example.com/physics-electricity" }
        ]
      }
    },
    "Chemistry": {
      _colorIdx: 1,
      papers: {
        "1st Paper": [
          { id: uid(), title: "Periodic Table", url: "https://example.com/chem-periodic" },
          { id: uid(), title: "Chemical Bonding", url: "https://example.com/chem-bonding" }
        ],
        "2nd Paper": [
          { id: uid(), title: "Organic Reactions", url: "https://example.com/chem-organic" }
        ]
      }
    },
    "H.Math": {
      _colorIdx: 2,
      papers: {
        "1st Paper": [
          { id: uid(), title: "Straight Lines", url: "https://example.com/hmath-lines" },
          { id: uid(), title: "Circles", url: "https://example.com/hmath-circles" }
        ],
        "2nd Paper": [
          { id: uid(), title: "Differentiation", url: "https://example.com/hmath-diff" }
        ]
      }
    },
    "Biology": {
      _colorIdx: 3,
      papers: {
        "1st Paper": [
          { id: uid(), title: "Cell Biology", url: "https://example.com/bio-cell" },
          { id: uid(), title: "Genetics", url: "https://example.com/bio-genetics" }
        ],
        "2nd Paper": [
          { id: uid(), title: "কোষ ও এর গঠন", url: "https://example.com/bio-cell-structure" }
        ]
      }
    }
  }
};

// ── STATE ──────────────────────────────────────────
const state = {
  data: null,
  view: 'subjects',   // subjects | papers | topics | search
  subject: null,
  paper: null,
  searchQuery: '',
  dragSrc: null
};

// ── UTILS ──────────────────────────────────────────
function uid() { return 'i' + Math.random().toString(36).slice(2, 10); }
function esc(t) {
  return String(t)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Count total topics across all subjects/papers
function countTopics(data) {
  let t = 0;
  for (const s of Object.values(data.subjects || {}))
    for (const arr of Object.values(s.papers || {}))
      t += arr.length;
  return t;
}
function countPapers(data) {
  let p = 0;
  for (const s of Object.values(data.subjects || {}))
    p += Object.keys(s.papers || {}).length;
  return p;
}
function getColorIdx(subjectKey) {
  return (state.data?.subjects?.[subjectKey]?._colorIdx ?? 0) % SUBJECT_COLORS.length;
}

// ── LOCALFORAGE (offline storage) ─────────────────
localforage.config({ name: 'StudyVault', storeName: 'data' });

async function localLoad() {
  let d = await localforage.getItem(STORAGE_KEY);
  if (!d) {
    d = JSON.parse(JSON.stringify(SAMPLE_DATA));
    await localforage.setItem(STORAGE_KEY, d);
  }
  if (!d.subjects) d.subjects = {};
  return d;
}
async function localSave(data) {
  await localforage.setItem(STORAGE_KEY, data);
}

// ── FIREBASE SYNC ──────────────────────────────────
let syncTimeout = null;

function setSyncState(s) {
  const btn = $('#syncBtn');
  btn.classList.remove('syncing','synced','offline','error');
  btn.classList.add(s);
  if (s === 'syncing') btn.title = 'Syncing…';
  else if (s === 'synced') btn.title = 'All changes saved';
  else if (s === 'offline') btn.title = 'Offline — will sync when connected';
  else if (s === 'error') btn.title = 'Sync error — check console';
}

async function pushToFirestore(data) {
  if (!firebaseReady() || !currentUser || !db) return;
  setSyncState('syncing');
  try {
    await setDoc(doc(db, 'users', currentUser.uid), { data: JSON.stringify(data) }, { merge: false });
    setSyncState('synced');
  } catch (e) {
    console.error('Firestore write error:', e);
    setSyncState('error');
  }
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
  } catch (e) {
    console.error('Firestore read error:', e);
    setSyncState('error');
  }
}

function subscribeFirestore() {
  if (!firebaseReady() || !currentUser || !db) return;
  if (unsubFirestore) unsubFirestore();
  unsubFirestore = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
    if (snap.exists()) {
      const remote = JSON.parse(snap.data().data);
      // avoid redundant re-renders if data matches
      if (JSON.stringify(remote) !== JSON.stringify(state.data)) {
        state.data = remote;
        localSave(remote);
        render();
      }
    }
  }, (err) => {
    console.warn('Firestore listener error:', err);
    setSyncState('error');
  });
}

// ── SAVE (local + cloud) ───────────────────────────
async function save() {
  await localSave(state.data);
  if (currentUser && firebaseReady()) schedulePush();
}

// ── DOM HELPERS ────────────────────────────────────
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

function showLoading(on) {
  $('#loadingBar').classList.toggle('active', on);
}

function openModal(id) {
  const m = $('#' + id);
  m.classList.add('open');
  m.setAttribute('aria-hidden', 'false');
  const first = m.querySelector('input, button.btn.primary');
  if (first) setTimeout(() => first.focus(), 80);
}
function closeModal(id) {
  const m = $('#' + id);
  m.classList.remove('open');
  m.setAttribute('aria-hidden', 'true');
}
function closeAllModals() {
  $$('.modal-overlay').forEach(m => {
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
  });
}

// ── TOAST ──────────────────────────────────────────
function showToast(msg, type = 'info', ms = 3000) {
  const container = $('#toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span class="toast-dot"></span><span>${esc(msg)}</span><button class="toast-close" aria-label="Dismiss">×</button>`;
  t.querySelector('.toast-close').onclick = () => removeToast(t);
  container.appendChild(t);
  setTimeout(() => removeToast(t), ms);
}
function removeToast(t) {
  if (!t.parentNode) return;
  t.classList.add('exiting');
  setTimeout(() => t.parentNode?.removeChild(t), 250);
}

// ── RENDER DISPATCHER ─────────────────────────────
function render() {
  if (state.view === 'subjects') return renderSubjects();
  if (state.view === 'papers')   return renderPapers(state.subject);
  if (state.view === 'topics')   return renderTopics(state.subject, state.paper);
  if (state.view === 'search')   return renderSearch(state.searchQuery);
}

// ── TOPBAR STATE ───────────────────────────────────
function setTitle(t) { $('#pageTitle').textContent = t; }
function showBack(on) { $('#backBtn').style.visibility = on ? 'visible' : 'hidden'; }
function setFab(show, label = 'Add') {
  const fab = $('#fabBtn');
  fab.style.display = show ? 'flex' : 'none';
  fab.setAttribute('aria-label', label);
  fab.onclick = null; // cleared per-view
}

function buildBreadcrumb(segments) {
  const nav = $('#breadcrumb');
  nav.innerHTML = '';
  segments.forEach((seg, i) => {
    const span = document.createElement('span');
    span.className = 'crumb';
    span.textContent = seg.label;
    if (seg.action) span.onclick = seg.action;
    else span.style.opacity = '0.6';
    nav.appendChild(span);
    if (i < segments.length - 1) {
      const sep = document.createElement('span');
      sep.className = 'crumb-sep'; sep.textContent = '›'; sep.setAttribute('aria-hidden','true');
      nav.appendChild(sep);
    }
  });
}

// ── SUBJECTS VIEW ──────────────────────────────────
function renderSubjects() {
  state.view = 'subjects';
  setTitle('StudyVault');
  showBack(false);
  setFab(true, 'Add Subject');
  $('#fabBtn').onclick = openSubjectModal;
  buildBreadcrumb([]);

  const subjects = Object.keys(state.data.subjects || {});
  const area = $('#contentArea');
  area.innerHTML = '';

  // Stats
  const stats = document.createElement('div');
  stats.className = 'stats-row fade-up';
  stats.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
      </div>
      <div><div class="stat-value">${subjects.length}</div><div class="stat-label">Subjects</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>
      <div><div class="stat-value">${countPapers(state.data)}</div><div class="stat-label">Papers</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
      </div>
      <div><div class="stat-value">${countTopics(state.data)}</div><div class="stat-label">Topics</div></div>
    </div>
  `;
  area.appendChild(stats);

  // Section header
  const hdr = document.createElement('div');
  hdr.className = 'section-header fade-up fade-up-d1';
  hdr.innerHTML = `<span class="section-title">Your Subjects</span>`;
  area.appendChild(hdr);

  // Grid
  const grid = document.createElement('div');
  grid.className = 'card-grid fade-up fade-up-d2';

  subjects.forEach(name => {
    const ci = getColorIdx(name);
    const color = SUBJECT_COLORS[ci];
    const iconSvg = SUBJECT_ICONS[ci % SUBJECT_ICONS.length];
    const paperCount = Object.keys(state.data.subjects[name].papers || {}).length;
    const topicCount = countTopics({ subjects: { [name]: state.data.subjects[name] } });

    const card = document.createElement('div');
    card.className = 'subj-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Open ${name}`);
    card.style.setProperty('--card-accent', color.icon);
    card.style.setProperty('--card-icon-bg', `${color.bg}`);

    card.innerHTML = `
      <div class="subj-actions">
        <button class="subj-action-btn del" title="Delete ${esc(name)}" aria-label="Delete ${esc(name)}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
      <div class="subj-icon">${iconSvg}</div>
      <div class="subj-name">${esc(name)}</div>
      <div class="subj-count">${paperCount} paper${paperCount!==1?'s':''} · ${topicCount} topic${topicCount!==1?'s':''}</div>
    `;

    // Open papers
    card.addEventListener('click', (e) => {
      if (e.target.closest('.subj-actions')) return;
      renderPapers(name);
    });
    card.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.subj-actions')) {
        e.preventDefault(); renderPapers(name);
      }
    });

    // Delete
    card.querySelector('.subj-action-btn.del').onclick = (e) => {
      e.stopPropagation();
      confirmDelete(
        `Delete subject "${name}" and all its papers & topics?`,
        async () => {
          delete state.data.subjects[name];
          await save();
          renderSubjects();
          showToast(`"${name}" deleted`, 'info');
        }
      );
    };

    grid.appendChild(card);
  });

  // Add card
  const addCard = document.createElement('div');
  addCard.className = 'add-card';
  addCard.tabIndex = 0;
  addCard.setAttribute('role', 'button');
  addCard.setAttribute('aria-label', 'Add new subject');
  addCard.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    <span style="font-size:0.85rem;font-weight:600">Add Subject</span>
  `;
  addCard.onclick = openSubjectModal;
  addCard.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); openSubjectModal(); }});
  grid.appendChild(addCard);
  area.appendChild(grid);
}

// ── PAPERS VIEW ────────────────────────────────────
function renderPapers(subject) {
  state.view = 'papers';
  state.subject = subject;
  setTitle(subject);
  showBack(true);
  setFab(true, 'Add Paper');
  $('#fabBtn').onclick = openPaperModal;
  buildBreadcrumb([
    { label: 'Home', action: renderSubjects },
    { label: subject }
  ]);

  const papers = Object.keys(state.data.subjects[subject]?.papers || {});
  const ci = getColorIdx(subject);
  const area = $('#contentArea');
  area.innerHTML = '';

  const hdr = document.createElement('div');
  hdr.className = 'section-header fade-up';
  hdr.innerHTML = `<span class="section-title">${esc(subject)} · Papers</span>`;
  area.appendChild(hdr);

  if (papers.length === 0) {
    area.appendChild(emptyState('No papers yet', 'Add your first paper with the + button below.'));
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'paper-grid fade-up fade-up-d1';

  papers.forEach(name => {
    const topics = state.data.subjects[subject].papers[name] || [];
    const card = document.createElement('div');
    card.className = 'paper-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Open ${name}`);
    card.innerHTML = `
      <div class="paper-actions">
        <button class="subj-action-btn del" title="Delete paper" aria-label="Delete ${esc(name)}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      <div class="paper-name">${esc(name)}</div>
      <div class="paper-count">${topics.length} topic${topics.length!==1?'s':''}</div>
    `;
    card.addEventListener('click', (e) => {
      if (e.target.closest('.paper-actions')) return;
      renderTopics(subject, name);
    });
    card.addEventListener('keydown', (e) => {
      if ((e.key==='Enter'||e.key===' ')&&!e.target.closest('.paper-actions')) { e.preventDefault(); renderTopics(subject,name); }
    });
    card.querySelector('.subj-action-btn.del').onclick = (e) => {
      e.stopPropagation();
      confirmDelete(
        `Delete paper "${name}" and all its topics?`,
        async () => {
          delete state.data.subjects[subject].papers[name];
          await save();
          renderPapers(subject);
          showToast(`"${name}" deleted`, 'info');
        }
      );
    };
    grid.appendChild(card);
  });

  // Add paper tile
  const addTile = document.createElement('div');
  addTile.className = 'add-card';
  addTile.tabIndex = 0;
  addTile.setAttribute('role','button');
  addTile.setAttribute('aria-label','Add paper');
  addTile.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    <span style="font-size:0.82rem;font-weight:600">Add Paper</span>
  `;
  addTile.onclick = openPaperModal;
  addTile.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openPaperModal(); }});
  grid.appendChild(addTile);
  area.appendChild(grid);
}

// ── TOPICS VIEW ────────────────────────────────────
function renderTopics(subject, paper) {
  state.view = 'topics';
  state.subject = subject;
  state.paper = paper;
  setTitle(paper);
  showBack(true);
  setFab(true, 'Add Topic');
  $('#fabBtn').onclick = () => openTopicModal();
  buildBreadcrumb([
    { label: 'Home', action: renderSubjects },
    { label: subject, action: () => renderPapers(subject) },
    { label: paper }
  ]);

  const topics = state.data.subjects[subject]?.papers?.[paper] || [];
  const area = $('#contentArea');
  area.innerHTML = '';

  const hdr = document.createElement('div');
  hdr.className = 'section-header fade-up';
  hdr.innerHTML = `
    <span class="section-title">${esc(subject)} › ${esc(paper)} · ${topics.length} topic${topics.length!==1?'s':''}</span>
  `;
  area.appendChild(hdr);

  if (topics.length === 0) {
    area.appendChild(emptyState('No topics yet', 'Tap the + button to add your first class link.'));
    return;
  }

  const list = document.createElement('div');
  list.className = 'topic-list fade-up fade-up-d1';

  topics.forEach((t, idx) => {
    const item = makeTopicItem(t, subject, paper, idx);
    list.appendChild(item);
  });

  area.appendChild(list);
}

function makeTopicItem(t, subject, paper, idx) {
  const item = document.createElement('div');
  item.className = 'topic-item';
  item.dataset.id = t.id;
  item.draggable = true;

  item.innerHTML = `
    <span class="drag-handle" title="Drag to reorder" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
    </span>
    <span class="topic-label" title="${esc(t.title)}">${esc(t.title)}</span>
    <a class="topic-link" href="${esc(t.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${esc(t.title)}">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      Open
    </a>
    <div class="topic-menu">
      <button class="menu-btn" aria-label="Topic options" aria-haspopup="true" aria-expanded="false">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none"/></svg>
      </button>
      <div class="menu-content" role="menu" aria-hidden="true">
        <button class="menu-item edit-btn" role="menuitem">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </button>
        <button class="menu-item danger delete-btn" role="menuitem">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
          Delete
        </button>
      </div>
    </div>
  `;

  // Menu toggle
  const menuBtn = item.querySelector('.menu-btn');
  const menuContent = item.querySelector('.menu-content');
  menuBtn.onclick = (e) => {
    e.stopPropagation();
    const isOpen = menuContent.classList.contains('open');
    closeAllMenus();
    if (!isOpen) {
      menuContent.classList.add('open');
      menuBtn.setAttribute('aria-expanded','true');
      menuContent.setAttribute('aria-hidden','false');
    }
  };

  // Edit
  item.querySelector('.edit-btn').onclick = (e) => {
    e.stopPropagation();
    closeAllMenus();
    openTopicModal(t);
  };

  // Delete
  item.querySelector('.delete-btn').onclick = (e) => {
    e.stopPropagation();
    closeAllMenus();
    confirmDelete(
      `Delete topic "${t.title}"?`,
      async () => {
        const arr = state.data.subjects[subject].papers[paper];
        const i = arr.findIndex(x => x.id === t.id);
        if (i !== -1) arr.splice(i, 1);
        await save();
        renderTopics(subject, paper);
        showToast(`"${t.title}" deleted`, 'info');
      }
    );
  };

  // Click row → open link
  item.addEventListener('click', (e) => {
    if (e.target.closest('a, .topic-menu, .drag-handle')) return;
    window.open(t.url, '_blank', 'noopener,noreferrer');
  });

  // Drag & drop
  item.addEventListener('dragstart', (e) => {
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
  item.addEventListener('dragover', (e) => {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    $$('.topic-item').forEach(el => el.style.borderTop = '');
    if (t.id !== state.dragSrc) item.style.borderTop = '2px solid var(--accent)';
  });
  item.addEventListener('dragleave', () => { item.style.borderTop = ''; });
  item.addEventListener('drop', async (e) => {
    e.preventDefault();
    item.style.borderTop = '';
    const srcId = e.dataTransfer.getData('text/plain');
    if (!srcId || srcId === t.id) return;
    const arr = state.data.subjects[subject].papers[paper];
    const fromI = arr.findIndex(x => x.id === srcId);
    const toI   = arr.findIndex(x => x.id === t.id);
    if (fromI === -1 || toI === -1) return;
    const [moved] = arr.splice(fromI, 1);
    arr.splice(toI, 0, moved);
    await save();
    renderTopics(subject, paper);
  });

  return item;
}

function closeAllMenus() {
  $$('.menu-content.open').forEach(m => {
    m.classList.remove('open');
    m.setAttribute('aria-hidden','true');
    m.previousElementSibling?.setAttribute('aria-expanded','false');
  });
}

// ── SEARCH VIEW ────────────────────────────────────
function renderSearch(q) {
  state.view = 'search';
  setTitle(`Search`);
  showBack(true);
  setFab(false);
  buildBreadcrumb([{ label: 'Home', action: renderSubjects }, { label: `"${q}"` }]);

  const area = $('#contentArea');
  area.innerHTML = '';

  const results = [];
  const ql = q.toLowerCase();
  for (const [subj, sData] of Object.entries(state.data.subjects || {})) {
    for (const [paper, topics] of Object.entries(sData.papers || {})) {
      for (const t of topics) {
        if (
          t.title.toLowerCase().includes(ql) ||
          paper.toLowerCase().includes(ql) ||
          subj.toLowerCase().includes(ql)
        ) results.push({ subj, paper, t });
      }
    }
  }

  if (results.length === 0) {
    const empty = emptyState('No results', `No topics matching "${esc(q)}" found. Try a different keyword.`);
    area.appendChild(empty);
    return;
  }

  const countDiv = document.createElement('div');
  countDiv.className = 'section-header fade-up';
  countDiv.innerHTML = `<span class="section-title">${results.length} result${results.length!==1?'s':''} for "${esc(q)}"</span>`;
  area.appendChild(countDiv);

  // Group by subject
  const groups = {};
  results.forEach(r => {
    groups[r.subj] = groups[r.subj] || {};
    groups[r.subj][r.paper] = groups[r.subj][r.paper] || [];
    groups[r.subj][r.paper].push(r.t);
  });

  for (const [subj, papers] of Object.entries(groups)) {
    const grp = document.createElement('div');
    grp.className = 'search-group fade-up';
    grp.innerHTML = `<div class="search-group-header">${esc(subj)}</div>`;

    for (const [paper, topics] of Object.entries(papers)) {
      const pLabel = document.createElement('div');
      pLabel.className = 'search-group-paper';
      pLabel.textContent = paper;
      grp.appendChild(pLabel);

      const list = document.createElement('div');
      list.className = 'topic-list';
      topics.forEach(t => {
        const item = makeTopicItem(t, subj, paper, 0);
        list.appendChild(item);
      });
      grp.appendChild(list);
    }
    area.appendChild(grp);
  }
}

// ── EMPTY STATE HELPER ─────────────────────────────
function emptyState(title, sub) {
  const div = document.createElement('div');
  div.className = 'empty-state fade-up';
  div.innerHTML = `
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
    <p><strong>${esc(title)}</strong><br/>${esc(sub)}</p>
  `;
  return div;
}

// ── CONFIRM MODAL ──────────────────────────────────
let pendingConfirm = null;
function confirmDelete(msg, onConfirm) {
  $('#confirmMsg').textContent = msg;
  pendingConfirm = onConfirm;
  openModal('confirmModal');
}

// ── TOPIC MODAL ────────────────────────────────────
function openTopicModal(existing = null) {
  const form = $('#topicForm');
  form.reset();
  $('#topicTitleError').textContent = '';
  $('#topicUrlError').textContent = '';
  if (existing) {
    $('#modalTitle').textContent = 'Edit Topic';
    $('#saveTopicBtn').textContent = 'Save Changes';
    $('#topicId').value = existing.id;
    $('#topicTitle').value = existing.title;
    $('#topicUrl').value = existing.url;
  } else {
    $('#modalTitle').textContent = 'Add Topic';
    $('#saveTopicBtn').textContent = 'Add Topic';
    $('#topicId').value = '';
  }
  openModal('topicModal');
}

function validateTopicForm(title, url) {
  let ok = true;
  $('#topicTitleError').textContent = '';
  $('#topicUrlError').textContent = '';
  if (!title || title.length < 2) {
    $('#topicTitleError').textContent = 'Title must be at least 2 characters.';
    ok = false;
  }
  if (!/^https?:\/\/.+/.test(url)) {
    $('#topicUrlError').textContent = 'Enter a valid URL starting with http:// or https://';
    ok = false;
  }
  return ok;
}

// ── SUBJECT MODAL ──────────────────────────────────
function openSubjectModal() {
  $('#subjectName').value = '';
  $('#subjectNameError').textContent = '';
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
  const json = JSON.stringify(state.data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const date = new Date().toISOString().slice(0,10);
  a.href = url;
  a.download = `StudyVault-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Backup exported successfully', 'success');
}

// ── IMPORT ────────────────────────────────────────
function importData(file) {
  if (!file || file.type !== 'application/json') {
    showToast('Please select a valid JSON file', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed.subjects || typeof parsed.subjects !== 'object') {
        showToast('Invalid backup file format', 'error');
        return;
      }
      if (!confirm('Import this backup? Your current data will be replaced.')) return;
      state.data = parsed;
      await save();
      renderSubjects();
      showToast('Data imported successfully', 'success');
    } catch {
      showToast('Failed to parse JSON file', 'error');
    }
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
    icon.innerHTML = `<circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" fill="none"/>
      <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
  }
  localStorage.setItem(THEME_KEY, theme);
}

// ── USER UI ───────────────────────────────────────
function updateUserUI(user) {
  const avatar   = $('#userAvatar');
  const initials = $('#userInitials');
  const name     = $('#dropdownName');
  const email    = $('#dropdownEmail');
  const signInBtn = $('#signInFromApp');
  const signOutBtn = $('#signOutBtn');

  if (user) {
    if (user.photoURL) {
      avatar.src = user.photoURL;
      avatar.style.display = 'block';
      initials.style.display = 'none';
    } else {
      const n = user.displayName || 'U';
      initials.textContent = n[0].toUpperCase();
      avatar.style.display = 'none';
      initials.style.display = 'flex';
    }
    name.textContent  = user.displayName || 'User';
    email.textContent = user.email || '';
    signInBtn.style.display = 'none';
    signOutBtn.style.display = 'flex';
    setSyncState('synced');
  } else {
    avatar.style.display = 'none';
    initials.textContent = 'G';
    initials.style.display = 'flex';
    name.textContent  = 'Guest';
    email.textContent = 'Not signed in';
    signInBtn.style.display = 'flex';
    signOutBtn.style.display = 'none';
    setSyncState('offline');
  }
}

// ── SIGN IN ───────────────────────────────────────
async function signInWithGoogle() {
  if (!firebaseReady()) {
    showToast('Firebase not configured. See SETUP.md for instructions.', 'warning', 6000);
    return;
  }
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    // onAuthStateChanged handles the rest
  } catch (e) {
    if (e.code !== 'auth/popup-closed-by-user') {
      console.error('Sign in error:', e);
      showToast('Sign in failed: ' + e.message, 'error');
    }
  }
}

async function signOutUser() {
  if (!auth) return;
  if (unsubFirestore) { unsubFirestore(); unsubFirestore = null; }
  await signOut(auth);
  currentUser = null;
  updateUserUI(null);
  setSyncState('offline');
  showToast('Signed out', 'info');
}

// ── NETWORK STATUS ────────────────────────────────
window.addEventListener('online',  () => {
  setSyncState(currentUser ? 'synced' : 'offline');
  if (currentUser) schedulePush();
  showToast('Back online', 'success');
});
window.addEventListener('offline', () => {
  setSyncState('offline');
  showToast('You are offline — changes saved locally', 'warning');
});

// ── EVENT WIRING ──────────────────────────────────
function wireEvents() {

  // Back button
  $('#backBtn').addEventListener('click', () => {
    if (state.view === 'topics')  return renderPapers(state.subject);
    if (state.view === 'papers')  return renderSubjects();
    if (state.view === 'search')  return renderSubjects();
    renderSubjects();
  });

  // Search
  let searchTimer;
  $('#searchInput').addEventListener('input', (e) => {
    const q = e.target.value.trim();
    clearTimeout(searchTimer);
    if (!q) { state.searchQuery = ''; render(); return; }
    searchTimer = setTimeout(() => {
      state.searchQuery = q;
      renderSearch(q);
    }, 250);
  });
  $('#searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      $('#searchInput').value = '';
      state.searchQuery = '';
      render();
    }
  });

  // Theme toggle
  $('#themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  // Export
  $('#exportBtn').addEventListener('click', exportData);

  // Import
  $('#importFile').addEventListener('change', (e) => {
    importData(e.target.files[0]);
    e.target.value = ''; // reset so same file can be re-selected
  });

  // Sync btn — manual pull from cloud
  $('#syncBtn').addEventListener('click', () => {
    if (!currentUser) { showToast('Sign in to sync across devices', 'info'); return; }
    pullFromFirestore();
  });

  // User menu toggle
  const userBtn = $('#userMenuBtn');
  const dropdown = $('#userDropdown');
  userBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = dropdown.classList.contains('open');
    dropdown.classList.toggle('open', !open);
    userBtn.setAttribute('aria-expanded', String(!open));
    dropdown.setAttribute('aria-hidden', String(open));
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-area')) {
      dropdown.classList.remove('open');
      userBtn.setAttribute('aria-expanded', 'false');
      dropdown.setAttribute('aria-hidden', 'true');
    }
  });

  // Sign in / out
  $('#signInFromApp').addEventListener('click', () => { closeAllMenus(); signInWithGoogle(); });
  $('#signOutBtn').addEventListener('click', () => { signOutUser(); dropdown.classList.remove('open'); });
  $('#googleSignInBtn').addEventListener('click', signInWithGoogle);
  $('#guestBtn').addEventListener('click', () => {
    $('#authScreen').style.display = 'none';
    $('#app').style.display = 'block';
    updateUserUI(null);
    renderSubjects();
  });

  // Topic form submit
  $('#topicForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id    = $('#topicId').value;
    const title = $('#topicTitle').value.trim();
    const url   = $('#topicUrl').value.trim();
    if (!validateTopicForm(title, url)) return;

    const arr = state.data.subjects[state.subject].papers[state.paper];
    if (id) {
      const topic = arr.find(t => t.id === id);
      if (topic) { topic.title = title; topic.url = url; }
      showToast('Topic updated', 'success');
    } else {
      arr.push({ id: uid(), title, url });
      showToast('Topic added', 'success');
    }
    await save();
    closeModal('topicModal');
    renderTopics(state.subject, state.paper);
  });

  $('#cancelModalBtn').addEventListener('click', () => closeModal('topicModal'));
  $('#topicModal').addEventListener('click', (e) => { if (e.target === $('#topicModal')) closeModal('topicModal'); });

  // Subject form
  $('#saveSubjectBtn').addEventListener('click', async () => {
    const name = $('#subjectName').value.trim();
    $('#subjectNameError').textContent = '';
    if (!name || name.length < 1) { $('#subjectNameError').textContent = 'Enter a subject name.'; return; }
    if (state.data.subjects[name]) { $('#subjectNameError').textContent = 'Subject already exists.'; return; }
    const colorIdx = Object.keys(state.data.subjects).length % SUBJECT_COLORS.length;
    state.data.subjects[name] = { _colorIdx: colorIdx, papers: {} };
    await save();
    closeModal('subjectModal');
    renderSubjects();
    showToast(`"${name}" added`, 'success');
  });
  $('#cancelSubjectBtn').addEventListener('click', () => closeModal('subjectModal'));
  $('#subjectModal').addEventListener('click', (e) => { if (e.target === $('#subjectModal')) closeModal('subjectModal'); });
  $('#subjectName').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#saveSubjectBtn').click(); });

  // Paper form
  $('#savePaperBtn').addEventListener('click', async () => {
    const name = $('#paperName').value.trim();
    $('#paperNameError').textContent = '';
    if (!name) { $('#paperNameError').textContent = 'Enter a paper name.'; return; }
    if (state.data.subjects[state.subject].papers[name]) { $('#paperNameError').textContent = 'Paper already exists.'; return; }
    state.data.subjects[state.subject].papers[name] = [];
    await save();
    closeModal('paperModal');
    renderPapers(state.subject);
    showToast(`"${name}" added`, 'success');
  });
  $('#cancelPaperBtn').addEventListener('click', () => closeModal('paperModal'));
  $('#paperModal').addEventListener('click', (e) => { if (e.target === $('#paperModal')) closeModal('paperModal'); });
  $('#paperName').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#savePaperBtn').click(); });

  // Confirm modal
  $('#confirmOk').addEventListener('click', () => {
    closeModal('confirmModal');
    if (pendingConfirm) { pendingConfirm(); pendingConfirm = null; }
  });
  $('#confirmCancel').addEventListener('click', () => { closeModal('confirmModal'); pendingConfirm = null; });

  // Modal close buttons
  $$('.modal-close[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
  });

  // Close menus on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.topic-menu')) closeAllMenus();
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });
}

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════
async function init() {
  // Restore theme
  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(savedTheme);

  wireEvents();

  // Load local data first (fast)
  state.data = await localLoad();

  if (firebaseReady()) {
    // Show auth screen
    $('#authScreen').style.display = 'flex';

    onAuthStateChanged(auth, async (user) => {
      currentUser = user;

      if (user) {
        // Hide auth screen, show app
        $('#authScreen').style.display = 'none';
        $('#app').style.display = 'block';
        updateUserUI(user);
        showLoading(true);

        // Pull latest from Firestore (cloud takes priority on sign-in)
        await pullFromFirestore();
        subscribeFirestore();

        showLoading(false);
        renderSubjects();
        showToast(`Welcome, ${user.displayName?.split(' ')[0] || 'User'}!`, 'success');
      } else {
        // Not signed in — show auth screen
        $('#authScreen').style.display = 'flex';
        $('#app').style.display = 'none';
      }
    });
  } else {
    // Firebase not configured — run as offline-only app
    $('#authScreen').style.display = 'none';
    $('#app').style.display = 'block';
    updateUserUI(null);
    renderSubjects();
    // Warn once in console
    console.warn('[StudyVault] Firebase not configured. Edit FIREBASE_CONFIG in script.js to enable sync. See SETUP.md.');
  }
}

init();
  app  = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);
  db   = getFirestore(app);
}

// ── CONSTANTS ──────────────────────────────────────
const STORAGE_KEY = 'studyvault-data-v1';
const THEME_KEY   = 'studyvault-theme';

const SUBJECT_COLORS = [
  { bg: 'var(--c1)', text: 'var(--c1t)', icon: '#1d4ed8' },
  { bg: 'var(--c2)', text: 'var(--c2t)', icon: '#c2410c' },
  { bg: 'var(--c3)', text: 'var(--c3t)', icon: '#7c3aed' },
  { bg: 'var(--c4)', text: 'var(--c4t)', icon: '#047857' },
  { bg: 'var(--c5)', text: 'var(--c5t)', icon: '#9d174d' },
  { bg: 'var(--c6)', text: 'var(--c6t)', icon: '#0f766e' },
];

const SUBJECT_ICONS = [
  // Book
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>`,
  // Flask
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6M9 3v7l-6 11h18L15 10V3"/><path d="M6 19h12"/></svg>`,
  // Calculator
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/><line x1="16" y1="18" x2="16" y2="18"/></svg>`,
  // Leaf
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 8C8 10 5.9 16.17 3.82 19.34A1 1 0 004.82 21C7 21 15 21 18 14c.94-2.12 1-5 .5-7C18 7 17.5 7 17 8z"/><path d="M3.82 19.34L12 12"/></svg>`,
  // Globe
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`,
  // Cpu
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="2" x2="9" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/><line x1="20" y1="9" x2="22" y2="9"/><line x1="20" y1="15" x2="22" y2="15"/><line x1="2" y1="9" x2="4" y2="9"/><line x1="2" y1="15" x2="4" y2="15"/></svg>`,
];

const SAMPLE_DATA = {
  subjects: {
    "Physics": {
      _colorIdx: 0,
      papers: {
        "1st Paper": [
          { id: uid(), title: "Measurement", url: "https://example.com/physics-measurement" },
          { id: uid(), title: "Motion in a Straight Line", url: "https://example.com/physics-motion" }
        ],
        "2nd Paper": [
          { id: uid(), title: "Electricity & Circuits", url: "https://example.com/physics-electricity" }
        ]
      }
    },
    "Chemistry": {
      _colorIdx: 1,
      papers: {
        "1st Paper": [
          { id: uid(), title: "Periodic Table", url: "https://example.com/chem-periodic" },
          { id: uid(), title: "Chemical Bonding", url: "https://example.com/chem-bonding" }
        ],
        "2nd Paper": [
          { id: uid(), title: "Organic Reactions", url: "https://example.com/chem-organic" }
        ]
      }
    },
    "H.Math": {
      _colorIdx: 2,
      papers: {
        "1st Paper": [
          { id: uid(), title: "Straight Lines", url: "https://example.com/hmath-lines" },
          { id: uid(), title: "Circles", url: "https://example.com/hmath-circles" }
        ],
        "2nd Paper": [
          { id: uid(), title: "Differentiation", url: "https://example.com/hmath-diff" }
        ]
      }
    },
    "Biology": {
      _colorIdx: 3,
      papers: {
        "1st Paper": [
          { id: uid(), title: "Cell Biology", url: "https://example.com/bio-cell" },
          { id: uid(), title: "Genetics", url: "https://example.com/bio-genetics" }
        ],
        "2nd Paper": [
          { id: uid(), title: "কোষ ও এর গঠন", url: "https://example.com/bio-cell-structure" }
        ]
      }
    }
  }
};

// ── STATE ──────────────────────────────────────────
const state = {
  data: null,
  view: 'subjects',   // subjects | papers | topics | search
  subject: null,
  paper: null,
  searchQuery: '',
  dragSrc: null
};

// ── UTILS ──────────────────────────────────────────
function uid() { return 'i' + Math.random().toString(36).slice(2, 10); }
function esc(t) {
  return String(t)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Count total topics across all subjects/papers
function countTopics(data) {
  let t = 0;
  for (const s of Object.values(data.subjects || {}))
    for (const arr of Object.values(s.papers || {}))
      t += arr.length;
  return t;
}
function countPapers(data) {
  let p = 0;
  for (const s of Object.values(data.subjects || {}))
    p += Object.keys(s.papers || {}).length;
  return p;
}
function getColorIdx(subjectKey) {
  return (state.data?.subjects?.[subjectKey]?._colorIdx ?? 0) % SUBJECT_COLORS.length;
}

// ── LOCALFORAGE (offline storage) ─────────────────
localforage.config({ name: 'StudyVault', storeName: 'data' });

async function localLoad() {
  let d = await localforage.getItem(STORAGE_KEY);
  if (!d) {
    d = JSON.parse(JSON.stringify(SAMPLE_DATA));
    await localforage.setItem(STORAGE_KEY, d);
  }
  if (!d.subjects) d.subjects = {};
  return d;
}
async function localSave(data) {
  await localforage.setItem(STORAGE_KEY, data);
}

// ── FIREBASE SYNC ──────────────────────────────────
let syncTimeout = null;

function setSyncState(s) {
  const btn = $('#syncBtn');
  btn.classList.remove('syncing','synced','offline','error');
  btn.classList.add(s);
  if (s === 'syncing') btn.title = 'Syncing…';
  else if (s === 'synced') btn.title = 'All changes saved';
  else if (s === 'offline') btn.title = 'Offline — will sync when connected';
  else if (s === 'error') btn.title = 'Sync error — check console';
}

async function pushToFirestore(data) {
  if (!firebaseReady() || !currentUser || !db) return;
  setSyncState('syncing');
  try {
    await setDoc(doc(db, 'users', currentUser.uid), { data: JSON.stringify(data) }, { merge: false });
    setSyncState('synced');
  } catch (e) {
    console.error('Firestore write error:', e);
    setSyncState('error');
  }
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
  } catch (e) {
    console.error('Firestore read error:', e);
    setSyncState('error');
  }
}

function subscribeFirestore() {
  if (!firebaseReady() || !currentUser || !db) return;
  if (unsubFirestore) unsubFirestore();
  unsubFirestore = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
    if (snap.exists()) {
      const remote = JSON.parse(snap.data().data);
      // avoid redundant re-renders if data matches
      if (JSON.stringify(remote) !== JSON.stringify(state.data)) {
        state.data = remote;
        localSave(remote);
        render();
      }
    }
  }, (err) => {
    console.warn('Firestore listener error:', err);
    setSyncState('error');
  });
}

// ── SAVE (local + cloud) ───────────────────────────
async function save() {
  await localSave(state.data);
  if (currentUser && firebaseReady()) schedulePush();
}

// ── DOM HELPERS ────────────────────────────────────
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

function showLoading(on) {
  $('#loadingBar').classList.toggle('active', on);
}

function openModal(id) {
  const m = $('#' + id);
  m.classList.add('open');
  m.setAttribute('aria-hidden', 'false');
  const first = m.querySelector('input, button.btn.primary');
  if (first) setTimeout(() => first.focus(), 80);
}
function closeModal(id) {
  const m = $('#' + id);
  m.classList.remove('open');
  m.setAttribute('aria-hidden', 'true');
}
function closeAllModals() {
  $$('.modal-overlay').forEach(m => {
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
  });
}

// ── TOAST ──────────────────────────────────────────
function showToast(msg, type = 'info', ms = 3000) {
  const container = $('#toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span class="toast-dot"></span><span>${esc(msg)}</span><button class="toast-close" aria-label="Dismiss">×</button>`;
  t.querySelector('.toast-close').onclick = () => removeToast(t);
  container.appendChild(t);
  setTimeout(() => removeToast(t), ms);
}
function removeToast(t) {
  if (!t.parentNode) return;
  t.classList.add('exiting');
  setTimeout(() => t.parentNode?.removeChild(t), 250);
}

// ── RENDER DISPATCHER ─────────────────────────────
function render() {
  if (state.view === 'subjects') return renderSubjects();
  if (state.view === 'papers')   return renderPapers(state.subject);
  if (state.view === 'topics')   return renderTopics(state.subject, state.paper);
  if (state.view === 'search')   return renderSearch(state.searchQuery);
}

// ── TOPBAR STATE ───────────────────────────────────
function setTitle(t) { $('#pageTitle').textContent = t; }
function showBack(on) { $('#backBtn').style.visibility = on ? 'visible' : 'hidden'; }
function setFab(show, label = 'Add') {
  const fab = $('#fabBtn');
  fab.style.display = show ? 'flex' : 'none';
  fab.setAttribute('aria-label', label);
  fab.onclick = null; // cleared per-view
}

function buildBreadcrumb(segments) {
  const nav = $('#breadcrumb');
  nav.innerHTML = '';
  segments.forEach((seg, i) => {
    const span = document.createElement('span');
    span.className = 'crumb';
    span.textContent = seg.label;
    if (seg.action) span.onclick = seg.action;
    else span.style.opacity = '0.6';
    nav.appendChild(span);
    if (i < segments.length - 1) {
      const sep = document.createElement('span');
      sep.className = 'crumb-sep'; sep.textContent = '›'; sep.setAttribute('aria-hidden','true');
      nav.appendChild(sep);
    }
  });
}

// ── SUBJECTS VIEW ──────────────────────────────────
function renderSubjects() {
  state.view = 'subjects';
  setTitle('StudyVault');
  showBack(false);
  setFab(true, 'Add Subject');
  $('#fabBtn').onclick = openSubjectModal;
  buildBreadcrumb([]);

  const subjects = Object.keys(state.data.subjects || {});
  const area = $('#contentArea');
  area.innerHTML = '';

  // Stats
  const stats = document.createElement('div');
  stats.className = 'stats-row fade-up';
  stats.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
      </div>
      <div><div class="stat-value">${subjects.length}</div><div class="stat-label">Subjects</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>
      <div><div class="stat-value">${countPapers(state.data)}</div><div class="stat-label">Papers</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
      </div>
      <div><div class="stat-value">${countTopics(state.data)}</div><div class="stat-label">Topics</div></div>
    </div>
  `;
  area.appendChild(stats);

  // Section header
  const hdr = document.createElement('div');
  hdr.className = 'section-header fade-up fade-up-d1';
  hdr.innerHTML = `<span class="section-title">Your Subjects</span>`;
  area.appendChild(hdr);

  // Grid
  const grid = document.createElement('div');
  grid.className = 'card-grid fade-up fade-up-d2';

  subjects.forEach(name => {
    const ci = getColorIdx(name);
    const color = SUBJECT_COLORS[ci];
    const iconSvg = SUBJECT_ICONS[ci % SUBJECT_ICONS.length];
    const paperCount = Object.keys(state.data.subjects[name].papers || {}).length;
    const topicCount = countTopics({ subjects: { [name]: state.data.subjects[name] } });

    const card = document.createElement('div');
    card.className = 'subj-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Open ${name}`);
    card.style.setProperty('--card-accent', color.icon);
    card.style.setProperty('--card-icon-bg', `${color.bg}`);

    card.innerHTML = `
      <div class="subj-actions">
        <button class="subj-action-btn del" title="Delete ${esc(name)}" aria-label="Delete ${esc(name)}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
      <div class="subj-icon">${iconSvg}</div>
      <div class="subj-name">${esc(name)}</div>
      <div class="subj-count">${paperCount} paper${paperCount!==1?'s':''} · ${topicCount} topic${topicCount!==1?'s':''}</div>
    `;

    // Open papers
    card.addEventListener('click', (e) => {
      if (e.target.closest('.subj-actions')) return;
      renderPapers(name);
    });
    card.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.subj-actions')) {
        e.preventDefault(); renderPapers(name);
      }
    });

    // Delete
    card.querySelector('.subj-action-btn.del').onclick = (e) => {
      e.stopPropagation();
      confirmDelete(
        `Delete subject "${name}" and all its papers & topics?`,
        async () => {
          delete state.data.subjects[name];
          await save();
          renderSubjects();
          showToast(`"${name}" deleted`, 'info');
        }
      );
    };

    grid.appendChild(card);
  });

  // Add card
  const addCard = document.createElement('div');
  addCard.className = 'add-card';
  addCard.tabIndex = 0;
  addCard.setAttribute('role', 'button');
  addCard.setAttribute('aria-label', 'Add new subject');
  addCard.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    <span style="font-size:0.85rem;font-weight:600">Add Subject</span>
  `;
  addCard.onclick = openSubjectModal;
  addCard.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); openSubjectModal(); }});
  grid.appendChild(addCard);
  area.appendChild(grid);
}

// ── PAPERS VIEW ────────────────────────────────────
function renderPapers(subject) {
  state.view = 'papers';
  state.subject = subject;
  setTitle(subject);
  showBack(true);
  setFab(true, 'Add Paper');
  $('#fabBtn').onclick = openPaperModal;
  buildBreadcrumb([
    { label: 'Home', action: renderSubjects },
    { label: subject }
  ]);

  const papers = Object.keys(state.data.subjects[subject]?.papers || {});
  const ci = getColorIdx(subject);
  const area = $('#contentArea');
  area.innerHTML = '';

  const hdr = document.createElement('div');
  hdr.className = 'section-header fade-up';
  hdr.innerHTML = `<span class="section-title">${esc(subject)} · Papers</span>`;
  area.appendChild(hdr);

  if (papers.length === 0) {
    area.appendChild(emptyState('No papers yet', 'Add your first paper with the + button below.'));
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'paper-grid fade-up fade-up-d1';

  papers.forEach(name => {
    const topics = state.data.subjects[subject].papers[name] || [];
    const card = document.createElement('div');
    card.className = 'paper-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Open ${name}`);
    card.innerHTML = `
      <div class="paper-actions">
        <button class="subj-action-btn del" title="Delete paper" aria-label="Delete ${esc(name)}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      <div class="paper-name">${esc(name)}</div>
      <div class="paper-count">${topics.length} topic${topics.length!==1?'s':''}</div>
    `;
    card.addEventListener('click', (e) => {
      if (e.target.closest('.paper-actions')) return;
      renderTopics(subject, name);
    });
    card.addEventListener('keydown', (e) => {
      if ((e.key==='Enter'||e.key===' ')&&!e.target.closest('.paper-actions')) { e.preventDefault(); renderTopics(subject,name); }
    });
    card.querySelector('.subj-action-btn.del').onclick = (e) => {
      e.stopPropagation();
      confirmDelete(
        `Delete paper "${name}" and all its topics?`,
        async () => {
          delete state.data.subjects[subject].papers[name];
          await save();
          renderPapers(subject);
          showToast(`"${name}" deleted`, 'info');
        }
      );
    };
    grid.appendChild(card);
  });

  // Add paper tile
  const addTile = document.createElement('div');
  addTile.className = 'add-card';
  addTile.tabIndex = 0;
  addTile.setAttribute('role','button');
  addTile.setAttribute('aria-label','Add paper');
  addTile.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    <span style="font-size:0.82rem;font-weight:600">Add Paper</span>
  `;
  addTile.onclick = openPaperModal;
  addTile.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openPaperModal(); }});
  grid.appendChild(addTile);
  area.appendChild(grid);
}

// ── TOPICS VIEW ────────────────────────────────────
function renderTopics(subject, paper) {
  state.view = 'topics';
  state.subject = subject;
  state.paper = paper;
  setTitle(paper);
  showBack(true);
  setFab(true, 'Add Topic');
  $('#fabBtn').onclick = () => openTopicModal();
  buildBreadcrumb([
    { label: 'Home', action: renderSubjects },
    { label: subject, action: () => renderPapers(subject) },
    { label: paper }
  ]);

  const topics = state.data.subjects[subject]?.papers?.[paper] || [];
  const area = $('#contentArea');
  area.innerHTML = '';

  const hdr = document.createElement('div');
  hdr.className = 'section-header fade-up';
  hdr.innerHTML = `
    <span class="section-title">${esc(subject)} › ${esc(paper)} · ${topics.length} topic${topics.length!==1?'s':''}</span>
  `;
  area.appendChild(hdr);

  if (topics.length === 0) {
    area.appendChild(emptyState('No topics yet', 'Tap the + button to add your first class link.'));
    return;
  }

  const list = document.createElement('div');
  list.className = 'topic-list fade-up fade-up-d1';

  topics.forEach((t, idx) => {
    const item = makeTopicItem(t, subject, paper, idx);
    list.appendChild(item);
  });

  area.appendChild(list);
}

function makeTopicItem(t, subject, paper, idx) {
  const item = document.createElement('div');
  item.className = 'topic-item';
  item.dataset.id = t.id;
  item.draggable = true;

  item.innerHTML = `
    <span class="drag-handle" title="Drag to reorder" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
    </span>
    <span class="topic-label" title="${esc(t.title)}">${esc(t.title)}</span>
    <a class="topic-link" href="${esc(t.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${esc(t.title)}">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      Open
    </a>
    <div class="topic-menu">
      <button class="menu-btn" aria-label="Topic options" aria-haspopup="true" aria-expanded="false">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none"/></svg>
      </button>
      <div class="menu-content" role="menu" aria-hidden="true">
        <button class="menu-item edit-btn" role="menuitem">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </button>
        <button class="menu-item danger delete-btn" role="menuitem">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
          Delete
        </button>
      </div>
    </div>
  `;

  // Menu toggle
  const menuBtn = item.querySelector('.menu-btn');
  const menuContent = item.querySelector('.menu-content');
  menuBtn.onclick = (e) => {
    e.stopPropagation();
    const isOpen = menuContent.classList.contains('open');
    closeAllMenus();
    if (!isOpen) {
      menuContent.classList.add('open');
      menuBtn.setAttribute('aria-expanded','true');
      menuContent.setAttribute('aria-hidden','false');
    }
  };

  // Edit
  item.querySelector('.edit-btn').onclick = (e) => {
    e.stopPropagation();
    closeAllMenus();
    openTopicModal(t);
  };

  // Delete
  item.querySelector('.delete-btn').onclick = (e) => {
    e.stopPropagation();
    closeAllMenus();
    confirmDelete(
      `Delete topic "${t.title}"?`,
      async () => {
        const arr = state.data.subjects[subject].papers[paper];
        const i = arr.findIndex(x => x.id === t.id);
        if (i !== -1) arr.splice(i, 1);
        await save();
        renderTopics(subject, paper);
        showToast(`"${t.title}" deleted`, 'info');
      }
    );
  };

  // Click row → open link
  item.addEventListener('click', (e) => {
    if (e.target.closest('a, .topic-menu, .drag-handle')) return;
    window.open(t.url, '_blank', 'noopener,noreferrer');
  });

  // Drag & drop
  item.addEventListener('dragstart', (e) => {
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
  item.addEventListener('dragover', (e) => {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    $$('.topic-item').forEach(el => el.style.borderTop = '');
    if (t.id !== state.dragSrc) item.style.borderTop = '2px solid var(--accent)';
  });
  item.addEventListener('dragleave', () => { item.style.borderTop = ''; });
  item.addEventListener('drop', async (e) => {
    e.preventDefault();
    item.style.borderTop = '';
    const srcId = e.dataTransfer.getData('text/plain');
    if (!srcId || srcId === t.id) return;
    const arr = state.data.subjects[subject].papers[paper];
    const fromI = arr.findIndex(x => x.id === srcId);
    const toI   = arr.findIndex(x => x.id === t.id);
    if (fromI === -1 || toI === -1) return;
    const [moved] = arr.splice(fromI, 1);
    arr.splice(toI, 0, moved);
    await save();
    renderTopics(subject, paper);
  });

  return item;
}

function closeAllMenus() {
  $$('.menu-content.open').forEach(m => {
    m.classList.remove('open');
    m.setAttribute('aria-hidden','true');
    m.previousElementSibling?.setAttribute('aria-expanded','false');
  });
}

// ── SEARCH VIEW ────────────────────────────────────
function renderSearch(q) {
  state.view = 'search';
  setTitle(`Search`);
  showBack(true);
  setFab(false);
  buildBreadcrumb([{ label: 'Home', action: renderSubjects }, { label: `"${q}"` }]);

  const area = $('#contentArea');
  area.innerHTML = '';

  const results = [];
  const ql = q.toLowerCase();
  for (const [subj, sData] of Object.entries(state.data.subjects || {})) {
    for (const [paper, topics] of Object.entries(sData.papers || {})) {
      for (const t of topics) {
        if (
          t.title.toLowerCase().includes(ql) ||
          paper.toLowerCase().includes(ql) ||
          subj.toLowerCase().includes(ql)
        ) results.push({ subj, paper, t });
      }
    }
  }

  if (results.length === 0) {
    const empty = emptyState('No results', `No topics matching "${esc(q)}" found. Try a different keyword.`);
    area.appendChild(empty);
    return;
  }

  const countDiv = document.createElement('div');
  countDiv.className = 'section-header fade-up';
  countDiv.innerHTML = `<span class="section-title">${results.length} result${results.length!==1?'s':''} for "${esc(q)}"</span>`;
  area.appendChild(countDiv);

  // Group by subject
  const groups = {};
  results.forEach(r => {
    groups[r.subj] = groups[r.subj] || {};
    groups[r.subj][r.paper] = groups[r.subj][r.paper] || [];
    groups[r.subj][r.paper].push(r.t);
  });

  for (const [subj, papers] of Object.entries(groups)) {
    const grp = document.createElement('div');
    grp.className = 'search-group fade-up';
    grp.innerHTML = `<div class="search-group-header">${esc(subj)}</div>`;

    for (const [paper, topics] of Object.entries(papers)) {
      const pLabel = document.createElement('div');
      pLabel.className = 'search-group-paper';
      pLabel.textContent = paper;
      grp.appendChild(pLabel);

      const list = document.createElement('div');
      list.className = 'topic-list';
      topics.forEach(t => {
        const item = makeTopicItem(t, subj, paper, 0);
        list.appendChild(item);
      });
      grp.appendChild(list);
    }
    area.appendChild(grp);
  }
}

// ── EMPTY STATE HELPER ─────────────────────────────
function emptyState(title, sub) {
  const div = document.createElement('div');
  div.className = 'empty-state fade-up';
  div.innerHTML = `
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
    <p><strong>${esc(title)}</strong><br/>${esc(sub)}</p>
  `;
  return div;
}

// ── CONFIRM MODAL ──────────────────────────────────
let pendingConfirm = null;
function confirmDelete(msg, onConfirm) {
  $('#confirmMsg').textContent = msg;
  pendingConfirm = onConfirm;
  openModal('confirmModal');
}

// ── TOPIC MODAL ────────────────────────────────────
function openTopicModal(existing = null) {
  const form = $('#topicForm');
  form.reset();
  $('#topicTitleError').textContent = '';
  $('#topicUrlError').textContent = '';
  if (existing) {
    $('#modalTitle').textContent = 'Edit Topic';
    $('#saveTopicBtn').textContent = 'Save Changes';
    $('#topicId').value = existing.id;
    $('#topicTitle').value = existing.title;
    $('#topicUrl').value = existing.url;
  } else {
    $('#modalTitle').textContent = 'Add Topic';
    $('#saveTopicBtn').textContent = 'Add Topic';
    $('#topicId').value = '';
  }
  openModal('topicModal');
}

function validateTopicForm(title, url) {
  let ok = true;
  $('#topicTitleError').textContent = '';
  $('#topicUrlError').textContent = '';
  if (!title || title.length < 2) {
    $('#topicTitleError').textContent = 'Title must be at least 2 characters.';
    ok = false;
  }
  if (!/^https?:\/\/.+/.test(url)) {
    $('#topicUrlError').textContent = 'Enter a valid URL starting with http:// or https://';
    ok = false;
  }
  return ok;
}

// ── SUBJECT MODAL ──────────────────────────────────
function openSubjectModal() {
  $('#subjectName').value = '';
  $('#subjectNameError').textContent = '';
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
  const json = JSON.stringify(state.data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const date = new Date().toISOString().slice(0,10);
  a.href = url;
  a.download = `StudyVault-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Backup exported successfully', 'success');
}

// ── IMPORT ────────────────────────────────────────
function importData(file) {
  if (!file || file.type !== 'application/json') {
    showToast('Please select a valid JSON file', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed.subjects || typeof parsed.subjects !== 'object') {
        showToast('Invalid backup file format', 'error');
        return;
      }
      if (!confirm('Import this backup? Your current data will be replaced.')) return;
      state.data = parsed;
      await save();
      renderSubjects();
      showToast('Data imported successfully', 'success');
    } catch {
      showToast('Failed to parse JSON file', 'error');
    }
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
    icon.innerHTML = `<circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" fill="none"/>
      <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
  }
  localStorage.setItem(THEME_KEY, theme);
}

// ── USER UI ───────────────────────────────────────
function updateUserUI(user) {
  const avatar   = $('#userAvatar');
  const initials = $('#userInitials');
  const name     = $('#dropdownName');
  const email    = $('#dropdownEmail');
  const signInBtn = $('#signInFromApp');
  const signOutBtn = $('#signOutBtn');

  if (user) {
    if (user.photoURL) {
      avatar.src = user.photoURL;
      avatar.style.display = 'block';
      initials.style.display = 'none';
    } else {
      const n = user.displayName || 'U';
      initials.textContent = n[0].toUpperCase();
      avatar.style.display = 'none';
      initials.style.display = 'flex';
    }
    name.textContent  = user.displayName || 'User';
    email.textContent = user.email || '';
    signInBtn.style.display = 'none';
    signOutBtn.style.display = 'flex';
    setSyncState('synced');
  } else {
    avatar.style.display = 'none';
    initials.textContent = 'G';
    initials.style.display = 'flex';
    name.textContent  = 'Guest';
    email.textContent = 'Not signed in';
    signInBtn.style.display = 'flex';
    signOutBtn.style.display = 'none';
    setSyncState('offline');
  }
}

// ── SIGN IN ───────────────────────────────────────
async function signInWithGoogle() {
  if (!firebaseReady()) {
    showToast('Firebase not configured. See SETUP.md for instructions.', 'warning', 6000);
    return;
  }
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    // onAuthStateChanged handles the rest
  } catch (e) {
    if (e.code !== 'auth/popup-closed-by-user') {
      console.error('Sign in error:', e);
      showToast('Sign in failed: ' + e.message, 'error');
    }
  }
}

async function signOutUser() {
  if (!auth) return;
  if (unsubFirestore) { unsubFirestore(); unsubFirestore = null; }
  await signOut(auth);
  currentUser = null;
  updateUserUI(null);
  setSyncState('offline');
  showToast('Signed out', 'info');
}

// ── NETWORK STATUS ────────────────────────────────
window.addEventListener('online',  () => {
  setSyncState(currentUser ? 'synced' : 'offline');
  if (currentUser) schedulePush();
  showToast('Back online', 'success');
});
window.addEventListener('offline', () => {
  setSyncState('offline');
  showToast('You are offline — changes saved locally', 'warning');
});

// ── EVENT WIRING ──────────────────────────────────
function wireEvents() {

  // Back button
  $('#backBtn').addEventListener('click', () => {
    if (state.view === 'topics')  return renderPapers(state.subject);
    if (state.view === 'papers')  return renderSubjects();
    if (state.view === 'search')  return renderSubjects();
    renderSubjects();
  });

  // Search
  let searchTimer;
  $('#searchInput').addEventListener('input', (e) => {
    const q = e.target.value.trim();
    clearTimeout(searchTimer);
    if (!q) { state.searchQuery = ''; render(); return; }
    searchTimer = setTimeout(() => {
      state.searchQuery = q;
      renderSearch(q);
    }, 250);
  });
  $('#searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      $('#searchInput').value = '';
      state.searchQuery = '';
      render();
    }
  });

  // Theme toggle
  $('#themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  // Export
  $('#exportBtn').addEventListener('click', exportData);

  // Import
  $('#importFile').addEventListener('change', (e) => {
    importData(e.target.files[0]);
    e.target.value = ''; // reset so same file can be re-selected
  });

  // Sync btn — manual pull from cloud
  $('#syncBtn').addEventListener('click', () => {
    if (!currentUser) { showToast('Sign in to sync across devices', 'info'); return; }
    pullFromFirestore();
  });

  // User menu toggle
  const userBtn = $('#userMenuBtn');
  const dropdown = $('#userDropdown');
  userBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = dropdown.classList.contains('open');
    dropdown.classList.toggle('open', !open);
    userBtn.setAttribute('aria-expanded', String(!open));
    dropdown.setAttribute('aria-hidden', String(open));
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-area')) {
      dropdown.classList.remove('open');
      userBtn.setAttribute('aria-expanded', 'false');
      dropdown.setAttribute('aria-hidden', 'true');
    }
  });

  // Sign in / out
  $('#signInFromApp').addEventListener('click', () => { closeAllMenus(); signInWithGoogle(); });
  $('#signOutBtn').addEventListener('click', () => { signOutUser(); dropdown.classList.remove('open'); });
  $('#googleSignInBtn').addEventListener('click', signInWithGoogle);
  $('#guestBtn').addEventListener('click', () => {
    $('#authScreen').style.display = 'none';
    $('#app').style.display = 'block';
    updateUserUI(null);
    renderSubjects();
  });

  // Topic form submit
  $('#topicForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id    = $('#topicId').value;
    const title = $('#topicTitle').value.trim();
    const url   = $('#topicUrl').value.trim();
    if (!validateTopicForm(title, url)) return;

    const arr = state.data.subjects[state.subject].papers[state.paper];
    if (id) {
      const topic = arr.find(t => t.id === id);
      if (topic) { topic.title = title; topic.url = url; }
      showToast('Topic updated', 'success');
    } else {
      arr.push({ id: uid(), title, url });
      showToast('Topic added', 'success');
    }
    await save();
    closeModal('topicModal');
    renderTopics(state.subject, state.paper);
  });

  $('#cancelModalBtn').addEventListener('click', () => closeModal('topicModal'));
  $('#topicModal').addEventListener('click', (e) => { if (e.target === $('#topicModal')) closeModal('topicModal'); });

  // Subject form
  $('#saveSubjectBtn').addEventListener('click', async () => {
    const name = $('#subjectName').value.trim();
    $('#subjectNameError').textContent = '';
    if (!name || name.length < 1) { $('#subjectNameError').textContent = 'Enter a subject name.'; return; }
    if (state.data.subjects[name]) { $('#subjectNameError').textContent = 'Subject already exists.'; return; }
    const colorIdx = Object.keys(state.data.subjects).length % SUBJECT_COLORS.length;
    state.data.subjects[name] = { _colorIdx: colorIdx, papers: {} };
    await save();
    closeModal('subjectModal');
    renderSubjects();
    showToast(`"${name}" added`, 'success');
  });
  $('#cancelSubjectBtn').addEventListener('click', () => closeModal('subjectModal'));
  $('#subjectModal').addEventListener('click', (e) => { if (e.target === $('#subjectModal')) closeModal('subjectModal'); });
  $('#subjectName').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#saveSubjectBtn').click(); });

  // Paper form
  $('#savePaperBtn').addEventListener('click', async () => {
    const name = $('#paperName').value.trim();
    $('#paperNameError').textContent = '';
    if (!name) { $('#paperNameError').textContent = 'Enter a paper name.'; return; }
    if (state.data.subjects[state.subject].papers[name]) { $('#paperNameError').textContent = 'Paper already exists.'; return; }
    state.data.subjects[state.subject].papers[name] = [];
    await save();
    closeModal('paperModal');
    renderPapers(state.subject);
    showToast(`"${name}" added`, 'success');
  });
  $('#cancelPaperBtn').addEventListener('click', () => closeModal('paperModal'));
  $('#paperModal').addEventListener('click', (e) => { if (e.target === $('#paperModal')) closeModal('paperModal'); });
  $('#paperName').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#savePaperBtn').click(); });

  // Confirm modal
  $('#confirmOk').addEventListener('click', () => {
    closeModal('confirmModal');
    if (pendingConfirm) { pendingConfirm(); pendingConfirm = null; }
  });
  $('#confirmCancel').addEventListener('click', () => { closeModal('confirmModal'); pendingConfirm = null; });

  // Modal close buttons
  $$('.modal-close[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
  });

  // Close menus on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.topic-menu')) closeAllMenus();
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });
}

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════
async function init() {
  // Restore theme
  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(savedTheme);

  wireEvents();

  // Load local data first (fast)
  state.data = await localLoad();

  if (firebaseReady()) {
    // Show auth screen
    $('#authScreen').style.display = 'flex';

    onAuthStateChanged(auth, async (user) => {
      currentUser = user;

      if (user) {
        // Hide auth screen, show app
        $('#authScreen').style.display = 'none';
        $('#app').style.display = 'block';
        updateUserUI(user);
        showLoading(true);

        // Pull latest from Firestore (cloud takes priority on sign-in)
        await pullFromFirestore();
        subscribeFirestore();

        showLoading(false);
        renderSubjects();
        showToast(`Welcome, ${user.displayName?.split(' ')[0] || 'User'}!`, 'success');
      } else {
        // Not signed in — show auth screen
        $('#authScreen').style.display = 'flex';
        $('#app').style.display = 'none';
      }
    });
  } else {
    // Firebase not configured — run as offline-only app
    $('#authScreen').style.display = 'none';
    $('#app').style.display = 'block';
    updateUserUI(null);
    renderSubjects();
    // Warn once in console
    console.warn('[StudyVault] Firebase not configured. Edit FIREBASE_CONFIG in script.js to enable sync. See SETUP.md.');
  }
}

init();
