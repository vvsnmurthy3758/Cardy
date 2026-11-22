<div align="center">

# 🃏 Cardy

### A beautiful ecommerce card viewer for your local product catalog

[![Build Android APK](https://github.com/vvsnmurthy3758/Cardy/actions/workflows/build-apk.yml/badge.svg)](https://github.com/vvsnmurthy3758/Cardy/actions/workflows/build-apk.yml)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-Android-119EFF?logo=capacitor&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

<br/>

> **Cardy** is an offline-first PWA + Android app that lets you create, organise, and share beautiful product cards — all stored locally on your device. No server. No sign-up. Just your catalog, always with you.

<br/>

![Cardy Banner](https://raw.githubusercontent.com/vvsnmurthy3758/Cardy/main/public/pwa-512x512.png)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🗂️ **Card Groups** | Organise products into named groups (e.g. *Artisan Ceramics*, *Studio Deskware*) |
| 🎨 **Colour Themes** | 6 beautiful card colour themes — White, Mint, Sand, Sky, Blush, Lavender |
| 📌 **Pin Cards** | Pin your most important products to the top |
| 🔍 **Instant Search** | Full-text search across titles, SKUs, and specs |
| 📤 **Share Catalogs** | Export & share cards as JSON or ZIP with images |
| 📥 **Import Support** | Import catalogs shared by others (view or edit permission) |
| 🗑️ **Archive & Trash** | Soft-delete with archive and trash support |
| 📶 **Offline First** | Works 100% offline using IndexedDB (falls back to localStorage) |
| 📱 **PWA + Android APK** | Installable as a web app or native Android app via Capacitor |
| 🌗 **Grid / List View** | Toggle between grid and list layout modes |

---

## 📸 Screenshots

<div align="center">

| Product Cards Grid | Card Detail View | Groups Sidebar |
|:-:|:-:|:-:|
| ![Grid](https://raw.githubusercontent.com/vvsnmurthy3758/Cardy/main/src/assets/images/product_stoneware_espresso_1795195740652.jpg) | ![Detail](https://raw.githubusercontent.com/vvsnmurthy3758/Cardy/main/src/assets/images/product_ceramic_dripper_1795195741892.jpg) | ![Sidebar](https://raw.githubusercontent.com/vvsnmurthy3758/Cardy/main/src/assets/images/product_aluminum_tray_1795195741487.jpg) |

| Warm Sand Theme | Cool Mist Theme | Soft Blush Theme |
|:-:|:-:|:-:|
| ![Sand](https://raw.githubusercontent.com/vvsnmurthy3758/Cardy/main/src/assets/images/product_clay_pitcher_1795195741183.jpg) | ![Sky](https://raw.githubusercontent.com/vvsnmurthy3758/Cardy/main/src/assets/images/product_felt_deskmat_1795195741186.jpg) | ![Blush](https://raw.githubusercontent.com/vvsnmurthy3758/Cardy/main/src/assets/images/product_walnut_lamp_1795195755190.jpg) |

</div>

---

## 🏗️ Tech Stack

```
Cardy/
├── 🌐 Frontend       React 19 + TypeScript + Tailwind CSS v4
├── ⚡ Build Tool     Vite 8
├── 🗄️ Storage        IndexedDB (primary) + localStorage (fallback)
├── 📱 Android        Capacitor 7 → Native Android APK
├── 🤖 CI/CD          GitHub Actions → auto-builds APK on every push
└── 🎨 Icons          Lucide React
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 22.0.0
- **npm** ≥ 9

### 1. Clone the repo

```bash
git clone https://github.com/vvsnmurthy3758/Cardy.git
cd Cardy
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

### 3. Run in development mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for production

```bash
npm run build
```

Output is in the `dist/` folder.

---

## 📱 Android APK

### Option A — Download from GitHub Actions (No setup needed ✅)

Every push to `main` automatically builds a debug APK:

1. Go to [**Actions tab**](https://github.com/vvsnmurthy3758/Cardy/actions)
2. Click the latest **"Build Android APK"** run
3. Scroll to **Artifacts** → download **`app-debug`**
4. Extract the ZIP → install `app-debug.apk` on your Android device

> ⚙️ Enable *"Install from unknown sources"* in your Android settings if prompted.

### Option B — Build locally

Requires: **JDK 17** + **Android SDK**

```bash
# 1. Build web assets
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Build APK
cd android
chmod +x gradlew
./gradlew assembleDebug

# APK is at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🗂️ Project Structure

```
Cardy/
├── .github/
│   └── workflows/
│       └── build-apk.yml       # GitHub Actions CI — builds Android APK
├── android/                    # Capacitor Android native project
├── public/                     # PWA icons, manifest, service worker
├── src/
│   ├── assets/images/          # Sample product images
│   ├── components/             # React UI components
│   │   ├── Header.tsx          # App header with search
│   │   ├── Sidebar.tsx         # Groups navigation sidebar
│   │   ├── ProductCardTile.tsx # Individual product card
│   │   ├── ProductDetailModal.tsx # Full card detail view
│   │   ├── QuickCreateBar.tsx  # Fast card creation bar
│   │   ├── ShareModal.tsx      # Export / share catalog
│   │   └── SettingsModal.tsx   # App settings
│   ├── data/
│   │   └── sampleData.ts       # Built-in sample catalog
│   ├── hooks/
│   │   ├── useOnlineStatus.ts  # Online/offline detection
│   │   └── usePWAInstall.ts    # PWA install prompt
│   ├── lib/
│   │   ├── db.ts               # IndexedDB + localStorage engine
│   │   └── portability.ts      # Import / export logic
│   ├── App.tsx                 # Root app component
│   ├── types.ts                # TypeScript type definitions
│   └── main.tsx                # App entry point
├── capacitor.config.ts         # Capacitor configuration
├── vite.config.ts              # Vite build configuration
└── package.json
```

---

## 🃏 Card Data Model

Each product card stores:

```typescript
interface ProductCard {
  id: string           // Unique identifier
  title: string        // Product name
  sku: string          // SKU code
  price: string        // Price (optional)
  unit: string         // Unit (piece / set / kg …)
  specs: string[]      // Bullet-point specifications
  stockStatus:         // 'In Stock' | 'Made to Order' | 'Out of Stock'
  images: string[]     // Product image URLs
  color: CardColorKey  // Card colour theme
  pinned: boolean      // Pinned to top
  status:              // 'active' | 'archived' | 'trashed'
  permission:          // 'edit' | 'view'
  createdAt: number    // Timestamp
  updatedAt: number    // Timestamp
}
```

---

## 🌈 Card Colour Themes

| Theme | Preview | CSS Class |
|-------|---------|-----------|
| ⬜ Pure White | `#FFFFFF` | `bg-white` |
| 🟩 Fresh Mint | `#F3FAF5` | `bg-[#F3FAF5]` |
| 🟫 Warm Sand | `#FBF8F3` | `bg-[#FBF8F3]` |
| 🟦 Cool Mist | `#F4F8FC` | `bg-[#F4F8FC]` |
| 🩷 Soft Blush | `#FCF5F7` | `bg-[#FCF5F7]` |
| 🟣 Calm Slate | `#F6F5FC` | `bg-[#F6F5FC]` |

---

## ⚙️ GitHub Actions CI

The workflow at [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml) runs on every push to `main`:

```yaml
Trigger  → push to main / pull_request / manual dispatch
OS       → ubuntu-latest
Node.js  → 22
Java     → 17 (Temurin)
Steps    → npm install → npm run build → cap sync → gradlew assembleDebug
Artifact → android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ by [vvsnmurthy3758](https://github.com/vvsnmurthy3758)

⭐ **Star this repo** if you find it useful!

</div>
