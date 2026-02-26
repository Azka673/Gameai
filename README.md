# 🌿 ECO HAVOC: GREEN REBORN
### 3D Open World Edition — Project Structure

---

## 📁 Struktur Folder

```
eco-havoc/
│
├── index.html              ← Entry point utama (buka di browser)
│
├── css/
│   └── style.css           ← Semua styling: HUD, panels, splash,
│                              animasi, minimap, overlay, responsive
│
├── js/
│   ├── data.js             ← Semua konstanta game:
│   │                          GS (game state), WASTE_TYPES,
│   │                          DISTRICTS, SKILLS, ECO_FACTS, CHAPTERS
│   │
│   ├── ui.js               ← HUD update, notifikasi, panel system,
│   │                          skill tree UI, city panel, economy panel,
│   │                          eco database, XP/level system, ticker
│   │
│   ├── sorting.js          ← Mini-game pilah sampah:
│   │                          newWasteItem(), selectWaste(),
│   │                          dropToBin(), feedback edukatif
│   │
│   ├── world.js            ← Three.js 3D engine:
│   │                          init3D(), generateCity(),
│   │                          spawnWasteForDistrict(),
│   │                          collectNearbyWaste(), animate(),
│   │                          drawMinimap(), updateAtmosphere()
│   │
│   └── main.js             ← Entry point JS:
│                              startGame(), splash transition,
│                              keyboard default prevention
│
└── assets/                 ← (Folder untuk aset masa depan)
    │                          Contoh: tekstur, audio, model 3D
    └── (kosong — siap diisi)
```

---

## 📜 Urutan Load Script (penting!)

```html
<script src="https://cdnjs.cloudflare.com/.../three.min.js"></script>  <!-- CDN -->
<script src="js/data.js"></script>      <!-- 1. Data & GS global -->
<script src="js/ui.js"></script>        <!-- 2. UI (perlu data.js) -->
<script src="js/sorting.js"></script>   <!-- 3. Sorting (perlu data+ui) -->
<script src="js/world.js"></script>     <!-- 4. World 3D (perlu data+ui) -->
<script src="js/main.js"></script>      <!-- 5. Main / boot (perlu semua) -->
```

---

## 🎮 Cara Menjalankan

1. Buka folder `eco-havoc/`
2. Jalankan dengan **Live Server** (VS Code) atau server lokal
3. Atau buka `index.html` langsung di browser modern

> ⚠️ Pointer Lock API membutuhkan server (bukan `file://`). Gunakan Live Server.

---

## 🔧 Penjelasan Setiap File

### `index.html`
File HTML bersih. Hanya berisi:
- Struktur DOM (splash, canvas, HUD, overlay panels)
- Link ke `css/style.css`
- Script tags di bagian bawah `<body>`

### `css/style.css`
Semua styling game dalam satu file terorganisir dengan komentar seksi:
- Reset & base
- HUD (topbar, stats, pollution bar)
- Left/right panels
- Bottom bar & XP
- Notification & popups
- Overlay panels (sorting, city, skills, economy)
- Sorting mini-game
- Skill tree & district cards
- Splash screen
- Crosshair, minimap, ticker
- Animasi keyframes
- Responsive breakpoints

### `js/data.js`
Semua data statis dan `GS` (Game State) global:
- `GS` — objek mutable berisi kredit, level, XP, polusi, dll
- `WASTE_TYPES` — array 8 jenis sampah dengan emoji, nilai, warna 3D, fakta edukatif
- `DISTRICTS` — 6 distrik kota dengan tingkat polusi dan status lock
- `SKILLS` — 4 cabang skill tree
- `ECO_FACTS` — 8 fakta edukasi IPS tentang pengelolaan sampah
- `CHAPTERS` — 6 chapter storyline

### `js/ui.js`
Semua logika UI dan HUD:
- `showNotif(msg)` — toast notifikasi atas-tengah
- `showCollectPopup(x, y, txt)` — floating text saat kumpul sampah
- `showStoryEvent(title, desc)` — banner chapter bawah layar
- `flashDamage()` — efek layar merah saat salah sorting
- `updateHUD()` — sync semua elemen HUD dengan GS terbaru
- `addXP(amount)` — tambah XP, cek level up, cek chapter baru
- `showPanel(name)` / `hidePanel()` / `hideAllPanels()` — panel system
- `buildCityPanel()` / `selectDistrict(i)` — UI peta kota
- `buildSkillTree()` / `unlockSkill(id)` — UI & logika skill tree
- `buildEcoFacts()` — UI database edukasi
- `buildEconomy()` / `buildEcoBuilding(type)` — UI & logika ekonomi
- `animateTicker()` — ticker harga pasar bergerak

### `js/sorting.js`
Mini-game pilah sampah 2D:
- `newWasteItem()` — spawn item baru dengan 3 decoy
- `selectWaste(el, id, emoji, name)` — pilih item
- `dropToBin(binType)` — evaluasi jawaban, beri skor, tampilkan fakta

### `js/world.js`
Dunia 3D berbasis Three.js:
- `init3D()` — inisialisasi scene, kamera, renderer, lampu, event
- `generateCity()` — prosedural: 80 gedung, jalan grid, pohon, plaza, sorting station
- `generatePollutionParticles()` — cloud partikel smog 800 titik
- `spawnWasteForDistrict()` — spawn bola sampah 3D sesuai distrik aktif
- `collectNearbyWaste()` — kumpulkan sampah terdekat (tombol E)
- `updateAtmosphere()` — warna langit & tebal fog berubah sesuai polusi
- `drawMinimap()` — render minimap 2D (canvas 150×150)
- `animate()` — game loop: movement, waste animation, passive income, render

### `js/main.js`
Entry point yang paling ringkas:
- `startGame()` — fade out splash → show HUD → boot 3D → tampilkan welcome
- Keyboard event listener untuk mencegah scroll default

---

## 🕹️ Kontrol

| Tombol | Aksi |
|--------|------|
| `W A S D` | Gerak karakter |
| `↑ ↓ ← →` | Gerak (alternatif) |
| `Mouse` | Lihat kanan/kiri/atas/bawah (klik canvas dulu) |
| `E` | Kumpulkan sampah terdekat (radius 5 unit) |
| `R` | Buka Sorting Station |
| `Esc` | Tutup semua panel |

---

## 🌐 Fitur Terimplementasi

| Fitur | Status |
|-------|--------|
| 3D Open World (Three.js) | ✅ |
| 6 Distrik (4 unlock, 2 locked) | ✅ |
| Sorting Mini-Game 5 jenis sampah | ✅ |
| Sistem XP & Level Up | ✅ |
| Skill Tree 4 cabang | ✅ |
| ECO Database 8 fakta IPS | ✅ |
| Ekonomi (Bank/Pabrik/Taman) | ✅ |
| Real-time Pollution Bar | ✅ |
| Dynamic Atmosphere (fog/sky) | ✅ |
| Economy Ticker harga pasar | ✅ |
| Minimap 2D | ✅ |
| Notifikasi & Collect Popup | ✅ |
| Story Events 6 Chapter | ✅ |
| Damage Flash saat salah | ✅ |
| Passive income dari bangunan | ✅ |
| Pointer Lock mouse-look | ✅ |

---

## 🛠️ Pengembangan Lanjutan

Untuk menambah fitur, ikuti struktur ini:
- **Data baru** → tambahkan di `js/data.js`
- **Fitur UI/panel baru** → tambahkan di `js/ui.js`
- **Mekanik sorting baru** → modifikasi `js/sorting.js`
- **Objek 3D baru** → modifikasi `js/world.js`
- **Logika boot/startup** → modifikasi `js/main.js`
- **Styling baru** → tambahkan di `css/style.css`
- **Aset (gambar/audio)** → letakkan di `assets/`
