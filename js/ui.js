/* ============================================================
   ECO HAVOC: GREEN REBORN — js/ui.js
   HUD updates, notification system, panel management,
   and all overlay UI builder functions.
   Depends on: data.js
   ============================================================ */

'use strict';

// ──────────────────────────────────────────────
// NOTIFICATION TOAST
// ──────────────────────────────────────────────

let _notifTimer = null;

/**
 * Show a short notification at top-center of screen.
 * @param {string} msg
 */
function showNotif(msg) {
  const el = document.getElementById('notif');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_notifTimer);
  _notifTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

// ──────────────────────────────────────────────
// FLOATING COLLECT POPUP
// ──────────────────────────────────────────────

/**
 * Show a floating +XYZ text at screen coordinates.
 * @param {number} x
 * @param {number} y
 * @param {string} txt
 */
function showCollectPopup(x, y, txt) {
  const el = document.createElement('div');
  el.className = 'collect-popup';
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  el.textContent = txt;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

// ──────────────────────────────────────────────
// STORY EVENT BANNER
// ──────────────────────────────────────────────

let _storyEventTimeout = null;

/**
 * Display a bottom-center story chapter banner.
 * @param {string} title
 * @param {string} desc
 */
function showStoryEvent(title, desc) {
  const existing = document.querySelector('.story-event');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.className = 'story-event';
  el.innerHTML = `<div class="ev-title">${title}</div>${desc}`;
  document.body.appendChild(el);

  clearTimeout(_storyEventTimeout);
  _storyEventTimeout = setTimeout(() => el.remove(), 6000);
}

// ──────────────────────────────────────────────
// DAMAGE FLASH
// ──────────────────────────────────────────────

function flashDamage() {
  const el = document.getElementById('damage-overlay');
  el.style.background = 'rgba(255,0,0,.2)';
  setTimeout(() => el.style.background = 'rgba(255,0,0,0)', 300);
}

// ──────────────────────────────────────────────
// HUD UPDATE — called every time GS changes
// ──────────────────────────────────────────────

function updateHUD() {
  document.getElementById('stat-credits').textContent = GS.credits.toLocaleString();
  document.getElementById('stat-level').textContent   = GS.level;
  document.getElementById('stat-waste').textContent   = GS.wasteCollected;
  document.getElementById('stat-score').textContent   = GS.score;

  // XP bar
  document.getElementById('xp-fill').style.width = (GS.xp / GS.xpNext * 100) + '%';
  document.getElementById('xp-val').textContent   = GS.xp + '/' + GS.xpNext;

  // Pollution bar
  const p = GS.pollution;
  document.getElementById('pollution-fill').style.width = p + '%';
  document.getElementById('poll-pct').textContent        = p + '%';

  // Nearby waste list (randomised preview in right panel)
  const wasteTypes = ['🍌 Organik', '🧴 Plastik', '🥫 Logam', '📱 E-Waste'];
  const count = Math.floor(Math.random() * 3 + 2);
  document.getElementById('nearby-waste').innerHTML =
    Array.from({ length: count }, (_, i) =>
      `${wasteTypes[i % wasteTypes.length]}: ${Math.floor(Math.random() * 5 + 1)} item`
    ).join('<br>');

  // District status badge
  document.getElementById('dp-status').innerHTML =
    GS.pollution < 30 ? '<span style="color:#00ff64">✅ BERSIH</span>'  :
    GS.pollution < 60 ? '<span style="color:#ffaa00">🔄 PROGRES</span>' :
                        '<span style="color:#ff4444">⚠ KRITIS</span>';

  // Update 3D atmosphere
  if (typeof updateAtmosphere === 'function') updateAtmosphere();
}

// ──────────────────────────────────────────────
// XP & LEVEL SYSTEM
// ──────────────────────────────────────────────

function addXP(amount) {
  GS.xp += amount;
  if (GS.xp >= GS.xpNext) {
    GS.level++;
    GS.xp     -= GS.xpNext;
    GS.xpNext  = Math.floor(GS.xpNext * 1.5);
    GS.skillPoints++;
    showNotif(`🎉 LEVEL UP! Level ${GS.level} · Skill Point +1`);
    checkChapter();
  }
  updateHUD();
}

function checkChapter() {
  const newChapter = Math.min(6, Math.floor(GS.level / 3) + 1);
  if (newChapter > GS.chapter) {
    GS.chapter = newChapter;
    const ch = CHAPTERS[GS.chapter - 1];
    document.getElementById('chapter-info').textContent     = `CHAPTER ${ch.num} — ${ch.title}`;
    document.getElementById('chapter-info-top').textContent = `CH.${ch.num} — ${ch.title}`;
    showNotif(`📖 CHAPTER ${ch.num}: ${ch.title}`);
    // Unlock higher districts on chapter progression
    if (GS.chapter >= 4) DISTRICTS[4].locked = false;
    if (GS.chapter >= 6) DISTRICTS[5].locked = false;
  }
}

// ──────────────────────────────────────────────
// PANEL SYSTEM
// ──────────────────────────────────────────────

const PANEL_NAMES = ['sorting', 'city', 'skills', 'ecofacts', 'economy'];

function showPanel(name) {
  hideAllPanels();
  // Initialise panel content before showing
  if (name === 'sorting')  newWasteItem();
  if (name === 'city')     buildCityPanel();
  if (name === 'skills')   { buildSkillTree(); document.getElementById('skill-pts').textContent = GS.skillPoints; }
  if (name === 'ecofacts') buildEcoFacts();
  if (name === 'economy')  buildEconomy();
  document.getElementById('panel-' + name).classList.add('active');
}

function hidePanel(name) {
  document.getElementById('panel-' + name).classList.remove('active');
}

function hideAllPanels() {
  PANEL_NAMES.forEach(n => document.getElementById('panel-' + n).classList.remove('active'));
}

// ──────────────────────────────────────────────
// CITY / DISTRICT PANEL BUILDER
// ──────────────────────────────────────────────

function buildCityPanel() {
  const grid = document.getElementById('district-grid');
  grid.innerHTML = DISTRICTS.map((d, i) => {
    const clean  = GS.districtClean[i];
    const status = d.locked      ? '🔒 TERKUNCI' :
                   clean > 60    ? '✅ BERSIH'    :
                   d.pollution > 70 ? '⚠ KRITIS' :
                                   '🔄 PROGRES';
    const clickHandler = d.locked
      ? `showNotif('🔒 Selesaikan district sebelumnya!')`
      : `selectDistrict(${i})`;
    return `
      <div class="district-card ${d.locked ? 'locked' : ''} ${i === GS.currentDistrict ? 'active' : ''}"
           onclick="${clickHandler}">
        <div class="dc-icon">${d.icon}</div>
        <div class="dc-name">${d.name.replace('\n', ' ')}</div>
        <div class="dc-status">${status}</div>
        <div style="font-size:10px;color:#555;margin-top:2px;">Polusi: ${d.pollution}%</div>
        <div class="dc-bar">
          <div class="dc-bar-fill" style="width:${clean}%;background:${d.color}"></div>
        </div>
      </div>`;
  }).join('');
}

function selectDistrict(i) {
  if (DISTRICTS[i].locked) return;
  GS.currentDistrict = i;
  const d = DISTRICTS[i];
  document.getElementById('district-name').textContent = d.name.replace('\n', '\n');
  document.getElementById('dp-polusi').textContent     = d.pollution + '%';
  document.getElementById('dp-pop').textContent        = d.pop;
  document.getElementById('dp-trash').textContent      = d.trash;
  showNotif(`🗺 Pindah ke ${d.name.replace('\n', ' ')}`);
  hidePanel('city');
  buildCityPanel();
  if (typeof spawnWasteForDistrict === 'function') spawnWasteForDistrict();
}

// ──────────────────────────────────────────────
// SKILL TREE PANEL BUILDER
// ──────────────────────────────────────────────

function buildSkillTree() {
  const container = document.getElementById('skill-tree');
  container.innerHTML = SKILLS.map(s => `
    <div class="skill-card ${GS.skills[s.id] ? 'unlocked' : ''}" onclick="unlockSkill('${s.id}')">
      <div class="skill-icon">${s.icon}</div>
      <div class="skill-name">${s.name}</div>
      <div class="skill-desc">${s.desc}</div>
      <div class="skill-cost">${GS.skills[s.id] ? '✅ AKTIF' : '💎 Butuh ' + s.cost + ' Skill Point'}</div>
    </div>
  `).join('');
}

function unlockSkill(id) {
  const skill = SKILLS.find(s => s.id === id);
  if (GS.skills[id])              { showNotif('Skill sudah diaktifkan!'); return; }
  if (GS.skillPoints < skill.cost){ showNotif('⚠ Skill Points tidak cukup!'); return; }
  GS.skillPoints      -= skill.cost;
  GS.skills[id]        = true;
  showNotif(`🎯 Skill "${skill.name}" Diaktifkan!`);
  buildSkillTree();
  document.getElementById('skill-pts').textContent = GS.skillPoints;
}

// ──────────────────────────────────────────────
// ECO DATABASE PANEL BUILDER
// ──────────────────────────────────────────────

function buildEcoFacts() {
  const container = document.getElementById('ecofacts-content');
  container.innerHTML = ECO_FACTS.map(f => `
    <div class="eco-fact" style="margin-bottom:10px;">
      <strong>${f.title}</strong><br>${f.content}
    </div>
  `).join('');
}

// ──────────────────────────────────────────────
// ECONOMY PANEL BUILDER
// ──────────────────────────────────────────────

function buildEconomy() {
  const container = document.getElementById('economy-content');
  container.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">

      <div class="skill-card" onclick="buildEcoBuilding('bank')">
        <div class="skill-icon">🏦</div>
        <div class="skill-name">BANK SAMPAH</div>
        <div class="skill-desc">Warga setor sampah, dapat kredit. +50 kredit/mnt pasif.
          Dimiliki: ${GS.economyBuildings.bank}</div>
        <div class="skill-cost">💰 Biaya: 300 kredit</div>
      </div>

      <div class="skill-card" onclick="buildEcoBuilding('factory')">
        <div class="skill-icon">🏭</div>
        <div class="skill-name">PABRIK DAUR ULANG</div>
        <div class="skill-desc">Proses sampah jadi material baru. +30% nilai jual.
          Dimiliki: ${GS.economyBuildings.factory}</div>
        <div class="skill-cost">💰 Biaya: 500 kredit</div>
      </div>

      <div class="skill-card" onclick="buildEcoBuilding('park')">
        <div class="skill-icon">🌳</div>
        <div class="skill-name">TAMAN KOTA</div>
        <div class="skill-desc">Polusi -5%. Kebahagiaan warga +20%.
          Dimiliki: ${GS.economyBuildings.park}</div>
        <div class="skill-cost">💰 Biaya: 200 kredit</div>
      </div>

      <div class="skill-card">
        <div class="skill-icon">📈</div>
        <div class="skill-name">HARGA PASAR</div>
        <div class="skill-desc">
          🧴 Plastik: 120 cr/ton<br>
          🌿 Organik: 80 cr/ton<br>
          ⚙️ Logam: 250 cr/ton<br>
          💻 E-Waste: 400 cr/ton<br>
          ☠️ B3: 600 cr/ton
        </div>
        <div class="skill-cost">⚠ Harga berfluktuasi</div>
      </div>

    </div>
    <div class="eco-fact">
      <strong>💡 Tips Ekonomi:</strong> Kelola sampah plastik dulu untuk modal awal,
      lalu investasi ke pabrik daur ulang untuk profit berlipat ganda!
    </div>
  `;
}

function buildEcoBuilding(type) {
  const costs   = { bank: 300, factory: 500, park: 200 };
  const effects = {
    bank:    'Bank Sampah dibangun! +50 kredit/mnt',
    factory: 'Pabrik aktif! Nilai daur ulang +30%',
    park:    'Taman kota dibangun! Polusi -5%'
  };
  if (GS.credits < costs[type]) { showNotif('⚠ Kredit tidak cukup!'); return; }
  GS.credits -= costs[type];
  GS.economyBuildings[type]++;
  if (type === 'park') GS.pollution = Math.max(0, GS.pollution - 5);
  showNotif(`🏗️ ${effects[type]}`);
  buildEconomy();
  updateHUD();
  addXP(20);
}

// ──────────────────────────────────────────────
// ECONOMY TICKER (bottom price scroll)
// ──────────────────────────────────────────────

function animateTicker() {
  const tickers = [
    ['tick-plastic', '🧴 Plastik: '  + (100 + Math.floor(Math.random() *  80)) + 'cr/ton'],
    ['tick-organic', '🌿 Organik: '  + ( 60 + Math.floor(Math.random() *  60)) + 'cr/ton'],
    ['tick-metal',   '⚙️ Logam: '    + (200 + Math.floor(Math.random() * 100)) + 'cr/ton'],
    ['tick-ewaste',  '💻 E-Waste: '  + (350 + Math.floor(Math.random() * 100)) + 'cr/ton']
  ];
  tickers.forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}

setInterval(animateTicker, 4000);
