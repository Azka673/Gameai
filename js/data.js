/* ============================================================
   ECO HAVOC: GREEN REBORN — js/data.js
   All game data: waste types, districts, skills,
   eco facts, and chapter definitions.
   ============================================================ */

// ──────────────────────────────────────────────
// GAME STATE (mutable, shared across modules)
// ──────────────────────────────────────────────
const GS = {
  credits: 500,
  level: 1,
  xp: 0,
  xpNext: 100,
  score: 0,
  wasteCollected: 0,
  pollution: 70,       // 0 = clean, 100 = toxic
  sortScore: 0,
  skillPoints: 2,
  chapter: 1,
  currentDistrict: 0,
  skills: {},
  districtClean: [0, 0, 0, 0, 0, 0],
  economyBuildings: { bank: 0, factory: 0, park: 0 }
};

// ──────────────────────────────────────────────
// WASTE TYPES
// Used by: sorting mini-game & 3D world spawn
// ──────────────────────────────────────────────
const WASTE_TYPES = [
  {
    id: 'organik',
    emoji: '🍌',
    name: 'Kulit Pisang',
    color: 0x8b4513,
    fact: '🌿 <strong>Sampah Organik</strong> seperti sisa makanan bisa dikompos dalam 2-4 minggu menjadi pupuk kaya nutrisi!',
    value: 80,
    binClass: 'bin-organic'
  },
  {
    id: 'organik',
    emoji: '🥦',
    name: 'Sayuran',
    color: 0x228b22,
    fact: '🌿 <strong>Sampah Organik</strong> menyumbang 60% TPA Indonesia. Jika dikompos, bisa mengurangi emisi gas metana!',
    value: 80,
    binClass: 'bin-organic'
  },
  {
    id: 'plastik',
    emoji: '🧴',
    name: 'Botol Plastik',
    color: 0x1e90ff,
    fact: '🧴 <strong>Plastik</strong> butuh 400-1000 tahun untuk terurai. 1 botol daur ulang menghemat energi setara 60W selama 6 jam!',
    value: 120,
    binClass: 'bin-plastic'
  },
  {
    id: 'plastik',
    emoji: '🛍️',
    name: 'Kantong Plastik',
    color: 0x87ceeb,
    fact: '🛍️ <strong>Kantong Plastik</strong> — 10 juta ton plastik masuk laut setiap tahun. Indonesia peringkat 2 penyumbang sampah plastik laut!',
    value: 120,
    binClass: 'bin-plastic'
  },
  {
    id: 'logam',
    emoji: '🥫',
    name: 'Kaleng Sarden',
    color: 0xaaaaaa,
    fact: '⚙️ <strong>Logam</strong> bisa didaur ulang 100% tanpa kehilangan kualitas! Daur ulang aluminium hemat 95% energi dibanding produksi baru.',
    value: 250,
    binClass: 'bin-metal'
  },
  {
    id: 'ewaste',
    emoji: '📱',
    name: 'HP Rusak',
    color: 0x9400d3,
    fact: '💻 <strong>E-Waste</strong> mengandung emas, perak, tembaga! 1 ton ponsel bekas mengandung 300g emas — 80x lebih banyak dari bijih emas!',
    value: 400,
    binClass: 'bin-ewaste'
  },
  {
    id: 'ewaste',
    emoji: '🔋',
    name: 'Baterai Bekas',
    color: 0xff8c00,
    fact: '🔋 <strong>Baterai</strong> mengandung kadmium dan merkuri yang sangat toksik. Jangan buang sembarangan — serahkan ke bank sampah!',
    value: 400,
    binClass: 'bin-ewaste'
  },
  {
    id: 'b3',
    emoji: '🧪',
    name: 'Cairan Kimia',
    color: 0xff4500,
    fact: '☠️ <strong>B3 (Bahan Berbahaya & Beracun)</strong> harus ditangani khusus. Detergen, pestisida, dan cat termasuk B3 yang mencemari tanah!',
    value: 600,
    binClass: 'bin-b3'
  }
];

// ──────────────────────────────────────────────
// DISTRICTS
// ──────────────────────────────────────────────
const DISTRICTS = [
  { name: 'DOWNTOWN\nMEGAPOLIS',    icon: '🏙️', pollution: 70, pop: '12.4K', trash: '847 ton',  locked: false, color: '#ff8800' },
  { name: 'INDUSTRIAL\nTOXIC ZONE', icon: '🏭', pollution: 90, pop: '3.2K',  trash: '2100 ton', locked: false, color: '#ff4444' },
  { name: 'COASTAL\nBEACH',         icon: '🏖️', pollution: 55, pop: '8.7K',  trash: '420 ton',  locked: false, color: '#ffaa00' },
  { name: 'SUBURBAN\nRESIDENTIAL',  icon: '🏘️', pollution: 40, pop: '25K',   trash: '650 ton',  locked: false, color: '#88dd00' },
  { name: 'SLUM\nOVERLOAD',         icon: '🏚️', pollution: 85, pop: '18K',   trash: '1800 ton', locked: true,  color: '#ff6666' },
  { name: 'ECO FUTURE\nSMART CITY', icon: '🌿', pollution:  5, pop: '—',     trash: '—',        locked: true,  color: '#00ff64' }
];

// ──────────────────────────────────────────────
// SKILL TREE
// ──────────────────────────────────────────────
const SKILLS = [
  {
    id: 'scientist',
    icon: '🔬',
    name: 'ECO SCIENTIST',
    desc: 'Deteksi otomatis jenis sampah saat mendekati. Akurasi sorting +25%.',
    cost: 2,
    effect: 'autoDetect'
  },
  {
    id: 'speed',
    icon: '⚡',
    name: 'SPEED OPERATOR',
    desc: 'Kecepatan sorting +50%. Waktu per item berkurang 3 detik.',
    cost: 1,
    effect: 'fasterSort'
  },
  {
    id: 'industrial',
    icon: '🏭',
    name: 'INDUSTRIAL MASTER',
    desc: 'Hasil daur ulang +30%. Setiap sampah menghasilkan kredit lebih banyak.',
    cost: 2,
    effect: 'moreLoot'
  },
  {
    id: 'speaker',
    icon: '📢',
    name: 'PUBLIC SPEAKER',
    desc: 'NPC lebih cepat sadar. Polusi turun 2x lebih cepat saat cleaning.',
    cost: 3,
    effect: 'fasterClean'
  }
];

// ──────────────────────────────────────────────
// ECO DATABASE FACTS
// Shown in the ECO DB panel and after wrong sorts
// ──────────────────────────────────────────────
const ECO_FACTS = [
  {
    title: '♻️ Daur Ulang',
    content: 'Indonesia menghasilkan 67 juta ton sampah per tahun. Hanya 7% yang didaur ulang. Setiap kertas yang didaur ulang menyelamatkan 17 pohon!'
  },
  {
    title: '🌊 Sampah Laut',
    content: '8 juta ton plastik masuk lautan setiap tahun. Jika tidak dihentikan, pada 2050 plastik di laut akan lebih banyak dari ikan (berdasarkan berat)!'
  },
  {
    title: '🌡️ Gas Metana',
    content: 'Sampah organik di TPA menghasilkan metana — gas rumah kaca 25x lebih kuat dari CO₂. Pengomposan bisa mengurangi ini drastis!'
  },
  {
    title: '⚡ E-Waste Crisis',
    content: '50 juta ton e-waste dihasilkan dunia tiap tahun. Indonesia hasilkan 2 juta ton. Ponsel lama mengandung emas, perak, dan tembaga berharga!'
  },
  {
    title: '🏭 B3 Bahaya',
    content: 'Pembuangan B3 ilegal mencemari 1 liter air tanah per mL bahan kimia. Ribuan anak terpapar timbal dari e-waste yang dibakar!'
  },
  {
    title: '💡 Solusi Bank Sampah',
    content: 'Bank Sampah Indonesia kini ada 10.000+ unit. Warga bisa menabung sampah dan mendapat uang tunai. Model sukses untuk ekonomi sirkular!'
  },
  {
    title: '🌿 Kompos = Emas Hijau',
    content: '1 kg sampah organik menghasilkan 0.3 kg kompos berkualitas. Kompos organik senilai Rp 800 miliar/tahun jika semua diolah!'
  },
  {
    title: '🚮 Pilah dari Rumah',
    content: 'Memilah sampah dari sumber (rumah) menghemat 30% biaya pengolahan TPA. Ini kunci sistem pengelolaan sampah berkelanjutan!'
  }
];

// ──────────────────────────────────────────────
// STORY CHAPTERS
// ──────────────────────────────────────────────
const CHAPTERS = [
  { num: 1, title: 'THE OVERFLOW',      desc: 'Kota tergenang sampah. Mulai bersihkan Downtown Megapolis.' },
  { num: 2, title: 'CORPORATE TRASH',   desc: 'Perusahaan membuang limbah ilegal. Investigasi Industrial Zone.' },
  { num: 3, title: 'TOXIC RIVER',       desc: 'Sungai menghitam akibat pembuangan. Selamatkan ekosistem!' },
  { num: 4, title: 'WASTE MAFIA',       desc: 'Sindikat pembuang sampah ilegal beroperasi. Hentikan mereka!' },
  { num: 5, title: 'GREEN REVOLUTION',  desc: 'Gerakan hijau dimulai. Bangun infrastruktur eco-friendly.' },
  { num: 6, title: 'SMART ECO FUTURE',  desc: 'Transformasi final. Ubah kota menjadi Smart Eco Metropolis!' }
];
