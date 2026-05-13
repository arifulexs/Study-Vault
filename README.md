# 📚 StudyVault

<div align="center">

![StudyVault Banner](icon-512.png)

**Organize your class links by subject and paper. Sync across all devices.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-arifulexs.github.io%2FStudy--Vault-5b8af5?style=for-the-badge&logo=github)](https://arifulexs.github.io/Study-Vault)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5b8af5?style=for-the-badge&logo=pwa)](https://arifulexs.github.io/Study-Vault)
[![Firebase](https://img.shields.io/badge/Firebase-Free%20Tier-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## ✨ What is StudyVault?

StudyVault is a **Progressive Web App (PWA)** built for students to organize their class links, papers, and topics in one place. No more hunting through WhatsApp groups or browser bookmarks — everything is structured, searchable, and synced across all your devices.

> Built with pure HTML, CSS, and JavaScript. No framework. No build step. No monthly cost.

---

## 📱 Screenshots

| Home | Topics | Dark Mode |
|------|--------|-----------|
| Subject grid with stats | Topic list with open links | Full dark navy theme |

---

## 🚀 Features

- **Subject → Paper → Topic** hierarchy — organize links the way your syllabus is structured
- **Direct subjects** (like ICT) — skip the paper layer and go straight to topics
- **Google Sign-In** — sync data across all your devices via Firebase Firestore
- **Offline-first** — works without internet, syncs when connection returns
- **Export & Import** — download a JSON backup anytime, restore with one tap
- **Drag & drop** — reorder topics within any paper
- **Search** — instantly find any topic across all subjects
- **Dark & Light theme** — remembers your preference
- **PWA installable** — install as a native-like app on Android, iOS, and desktop
- **Android APK** — built via PWABuilder, runs as a true standalone app
- **12 subject icons** — pick from a curated icon + color palette when adding subjects
- **Real-time sync** — Firestore listener updates all open devices instantly

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES Modules) |
| Auth | Firebase Authentication (Google Sign-In) |
| Database | Firebase Firestore (real-time sync) |
| Storage | `localStorage` (offline-first, no CDN dependency) |
| Hosting | GitHub Pages (free) |
| PWA | Service Worker, Web App Manifest |
| Android | PWABuilder TWA (Trusted Web Activity) |

**Zero backend. Zero server cost. Zero monthly fees.**

---

## 📂 Project Structure

```
Study-Vault/
├── index.html          # App shell, all modals, HTML structure
├── style.css           # Design tokens, layout, all components
├── script.js           # Firebase, CRUD, render engine, events
├── sw.js               # Service worker — offline cache + smart fetch
├── manifest.json       # PWA manifest — icons, shortcuts, display
├── icon-192.png        # App icon (192×192)
├── icon-512.png        # App icon (512×512)
└── SETUP.md            # Firebase setup guide
```

---

## ⚡ Getting Started

### Option 1 — Use the live app

Just visit **[arifulexs.github.io/Study-Vault](https://arifulexs.github.io/Study-Vault)** in any browser and tap **"Add to Home Screen"** to install.

### Option 2 — Run locally

No build tools needed. Just serve the files with any static server:

```bash
# Python
python -m http.server 8080

# Node.js
npx serve .

# VS Code → install "Live Server" → click "Go Live"
```

Then open `http://localhost:8080`

### Option 3 — Deploy your own

1. Fork this repo
2. Go to **Settings → Pages → Branch: main → / (root)**
3. Your app is live at `https://yourusername.github.io/Study-Vault`

---

## 🔥 Firebase Setup (for cross-device sync)

Without Firebase the app works perfectly as an offline-only tool. To enable Google Sign-In and cross-device sync:

### 1. Create a Firebase project

- Go to [console.firebase.google.com](https://console.firebase.google.com)
- Click **Add project** → name it → Create
- No credit card needed (free Spark plan)

### 2. Enable Google Sign-In

- **Authentication → Sign-in method → Google → Enable**
- Add your GitHub Pages domain to **Authorized domains**

### 3. Create Firestore database

- **Firestore Database → Create database → Production mode**
- Paste these security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

### 4. Add your config to `script.js`

```javascript
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSy...",
  authDomain:        "yourproject.firebaseapp.com",
  projectId:         "yourproject",
  storageBucket:     "yourproject.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef"
};
```

### Firebase Free Tier Limits

| Resource | Free Limit |
|----------|-----------|
| Stored data | 1 GiB |
| Reads / day | 50,000 |
| Writes / day | 20,000 |
| Network / month | 10 GiB |

More than enough for personal use — effectively unlimited.

---

## 📦 Building the Android APK

1. Deploy to GitHub Pages (see above)
2. Go to **[pwabuilder.com](https://pwabuilder.com)**
3. Enter your GitHub Pages URL
4. Click **Build → Android → Download**
5. You get an `.apk` file — install directly on any Android device

### Removing the browser bar (TWA verification)

For a fully native look with no browser bar:

1. In the PWABuilder zip, find `assetlinks.json`
2. Create a repo named `yourusername.github.io` on GitHub
3. Add a `.nojekyll` file (empty) at the root
4. Create `.well-known/assetlinks.json` and paste the content
5. Verify at: `https://yourusername.github.io/.well-known/assetlinks.json`
6. Reinstall the APK — browser bar gone ✓

---

## 🗺️ Data Structure

```json
{
  "subjects": {
    "Physics": {
      "_colorIdx": 0,
      "_iconKey": "zap",
      "papers": {
        "1st Paper": [
          { "id": "abc123", "title": "Measurement", "url": "https://meet.google.com/..." }
        ]
      }
    },
    "ICT": {
      "_colorIdx": 5,
      "_iconKey": "cpu",
      "_direct": true,
      "topics": [
        { "id": "def456", "title": "Number System", "url": "https://meet.google.com/..." }
      ]
    }
  }
}
```

`_direct: true` subjects skip the paper layer — useful for subjects with no paper division (like ICT).

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Close any open modal or menu |
| `Enter` | Submit the focused form |

---

## 🔒 Privacy

- All your data stays in your own browser (`localStorage`) and your own Firebase project
- Google Sign-In is used only for identity — no data is shared with third parties
- No analytics, no tracking, no ads — ever

---

## 🤝 Contributing

Pull requests are welcome. For major changes please open an issue first.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 👤 Author

**Ariful Islam**

[![GitHub](https://img.shields.io/badge/GitHub-arifulexs-181717?style=flat&logo=github)](https://github.com/arifulexs)

---

<div align="center">

Made with ❤️ for students · Powered by Firebase + GitHub Pages · 100% free

</div>
