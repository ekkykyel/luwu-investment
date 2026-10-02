# Portal Investasi Luwu - Enterprise Spatial Intelligence Platform
## Technical Blueprint & Master Roadmap

### 1. Refactor Architecture & System Migration

**Old Architecture:**
- Frontend: React + Leaflet (DOM-based rendering)
- State: Local React State (`useState` yang monolith)
- UI: Standard Dashboard (Tailwind)

**New Enterprise Architecture:**
- **Spatial Engine:** Mapbox GL JS / Maplibre GL (WebGL GPU-accelerated rendering) + Deck.gl untuk visualisasi data skala besar (hexagons, arcs, point clouds).
- **State Management:** Zustand untuk global state (Map State, UI State, Auth State terpisah) meminimalkan re-renders.
- **Analytics Engine:** Web Workers untuk kalkulasi geospasial (Turf.js) di background thread agar UI tidak freez.
- **AI Recommendation Engine:** Gemini Pro tersambung lewat Vertex AI/AI Studio untuk scoring, insights generation, dan chatbot konsultan.
- **Data Pipeline:** SWR / React Query untuk data fetching, caching, optimisasi GeoJSON API, dan lazy-loading mvt (Mapbox Vector Tiles).

### 2. Enterprise-Grade Folder Structure

```
src/
├── app/                  # Main entry, global contexts, providers
├── components/
│   ├── core/             # Reusable UI (Buttons, Panels, Glassmorphism wrappers)
│   ├── map/              # WebGL Map Components, Controls, Layers
│   ├── analytics/        # Charts, KPI Cards, Timelines
│   └── ai/               # Chat UI, Recommendation Results
├── features/             # Feature-based modules (Sektor, Investasi)
├── hooks/                # Custom React Hooks (useMapState, useAIInsights)
├── lib/
│   ├── spatial/          # Turf.js utils, GeoJSON optimizers, WebWorkers
│   ├── ai/               # Gemini API wrappers, prompt templates
│   └── api/              # Axios/Fetch services
├── store/                # Zustand stores (mapStore.ts, uiStore.ts)
├── styles/               # Global CSS, Tailwind extensions, Maplibre styles
└── types/                # Typescript Interfaces (GeoJSON, Enterprise Types)
```

### 3. Rendering Optimization Detail & Bottleneck Analysis

**Current Bottleneck:** DOM-based SVG rendering via React-Leaflet (`react-leaflet`). Ribuan feature geoJSON akan membuat browser memori penuh dan CPU spike.
**Optimization Strategy:**
1. **Pindah ke Vector Tiles (MVT):** Konversi GeoJSON berat menjadi MVT menggunakan tippecanoe (backend) atau olah di client menggunakan `geojson-vt`.
2. **WebGL Pipeline:** Gunakan `Maplibre GL JS`. Layer diserahkan ke GPU.
3. **Memoization:** Bungkus komponen UI reaktif dengan `React.memo`. Gunakan `useMemo` untuk transformasi data investasi.
4. **Debouncing:** Filtering, search, dan bounding-box query di defer menggunakan debouncing.
5. **Feature Clustering:** Jangan render titik satu per satu di zoom out. Gunakan Supercluster.

### 4. Enterprise Design System & UI/UX

**Theme:** "Cinematic Spatial Command Center"
- **Color Palette:** Deep Space Black / Slate 950 background, aksen Emerald/Teal untuk growth/success, Cyan/Blue untuk technology/AI, Amber/Orange untuk alerts/risks.
- **Materiality:** Premium Dark Glassmorphism. Backdrop blur tinggi (`backdrop-blur-xl`), border semi-transparan (`border-white/10`), ambient glow pada active elements.
- **Typography:** Display font modern monospace/sans (seperti Inter & JetBrains Mono).

### 5. AI Module Architecture

1. **AI Chatbot & Consultant:** Integrasi Gemini menggunakan streaming.
2. **Scoring Engine:** AI menerima parameter lokasi (GeoJSON properties, jarak iteratif ke jalan raya menggunakan Turf.js) lalu memproses logic multivariabel dan mengembalikan *Investment Readiness Score (0-100)*.
3. **Spatio-Textual Insights:** AI menghasilkan naratif dari data, seperti "Lahan di Kecamatan X sangat strategis untuk Agrobisnis karena berjarak 2km dari jaringan jalan utama dan memiliki ketersediaan lahan luas."

### 6. Roadmap Implementasi Bertahap

**Fase 1: UI/UX & React State Overhaul (Current Phase)**
- Migrasi UI menjadi *Cinematic Command Center* (Dark mode eksklusif).
- Implementasi Glassmorphism tingkat lanjut dan tata letak dinamis (collapsible panels).
- Refactoring komponen untuk mengurangi unnecessary re-renders.

**Fase 2: WebGL Spatial Engine Upgrade**
- Replace Leaflet dengan Maplibre GL JS.
- Re-integrasi semua layer (Jalan, Master, Investasi) menjadi WebGL Sources & Layers.
- Implementasi smooth flyTo, tilt/pitch angle (3D camera), dan cinematic transitions.
- Integrasi *Deck.gl* jika diperlukan untuk heatmap/scatterplots ekstrem.

**Fase 3: Enterprise Analytics & AI Recommendation**
- Pembuatan timeline slider (Temporal GIS).
- Integrasi modul rekomendasi investasi AI (Scoring, scoring overlay, heatmap kelayakan).
- Storytelling Mode (camera flyby berurutan dengan narasi AI).

**Fase 4: Performa, Keamanan & Skalabilitas**
- GeoJSON Simplification menggunakan visvalingam.
- Web Worker deployment untuk Turf.js calculations.
- JWT, RBAC Role refinement.

### Rekomendasi Eksekusi
Mengingat kompleksitas sistem, fase ini memerlukan pemisahan step-by-step. Saat ini kita berada pada **Fase 1**, menetapkan fondasi UI/UX serta mengamankan struktur komponen agar siap diinject dengan WebGL map engine (Fase 2).
