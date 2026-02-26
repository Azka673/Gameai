/* ============================================================
   ECO HAVOC: GREEN REBORN — js/sorting.js
   Waste sorting mini-game logic.
   Depends on: data.js, ui.js
   ============================================================ */

'use strict';

// ──────────────────────────────────────────────
// MODULE STATE
// ──────────────────────────────────────────────
let currentWasteItem = null;   // the waste we are currently sorting
let selectedItem     = null;   // the item the player has clicked/selected

// ──────────────────────────────────────────────
// SPAWN NEW WASTE ITEM IN PANEL
// ──────────────────────────────────────────────

/**
 * Populate the sorting panel with a random waste item
 * and 3 other random decoys.
 */
function newWasteItem() {
  // Pick one waste as the "correct" answer reference
  const waste = WASTE_TYPES[Math.floor(Math.random() * WASTE_TYPES.length)];
  currentWasteItem = waste;
  selectedItem     = null;

  // Build pool of 4 shuffled options — ensure correct item is present
  const shuffled = [...WASTE_TYPES].sort(() => Math.random() - 0.5).slice(0, 4);
  if (!shuffled.find(w => w.id === waste.id && w.emoji === waste.emoji)) {
    shuffled[0] = waste;
  }
  shuffled.sort(() => Math.random() - 0.5);

  // Render clickable item cards
  const container = document.getElementById('waste-items');
  container.innerHTML = shuffled.map(w => `
    <div class="waste-item" id="wi-${w.emoji}"
         onclick="selectWaste(this,'${w.id}','${w.emoji}','${w.name.replace(/'/g, "\\'")}')">
      <span style="font-size:30px">${w.emoji}</span>
      <span class="item-label">${w.name}</span>
    </div>
  `).join('');

  // Reset feedback
  const fb = document.getElementById('sort-feedback');
  fb.innerHTML   = '';
  fb.style.background = 'transparent';
  document.getElementById('sort-fact').style.display = 'none';
}

// ──────────────────────────────────────────────
// SELECT WASTE ITEM (first step)
// ──────────────────────────────────────────────

/**
 * Called when the player clicks a waste item card.
 * Highlights the selection and instructs the player to pick a bin.
 */
function selectWaste(el, id, emoji, name) {
  // Clear previous highlights
  document.querySelectorAll('.waste-item').forEach(e => {
    e.style.boxShadow   = '';
    e.style.borderColor = '';
  });

  // Highlight selected
  el.style.boxShadow   = '0 0 20px rgba(0,255,100,.6)';
  el.style.borderColor = '#00ff64';

  selectedItem = { id, emoji, name };

  const fb = document.getElementById('sort-feedback');
  fb.innerHTML             = `<span style="color:#00ff64">✓ Dipilih: ${emoji} ${name}</span> — Sekarang pilih tempat sampah!`;
  fb.style.background      = 'rgba(0,255,100,.05)';
  fb.style.padding         = '8px 16px';
  fb.style.borderRadius    = '6px';
}

// ──────────────────────────────────────────────
// DROP TO BIN (second step — evaluation)
// ──────────────────────────────────────────────

/**
 * Called when the player clicks a bin button.
 * @param {string} binType  'organik' | 'plastik' | 'logam' | 'ewaste' | 'b3'
 */
function dropToBin(binType) {
  // Guard: item must be selected first
  if (!selectedItem) {
    const fb = document.getElementById('sort-feedback');
    fb.innerHTML          = '<span style="color:#ff8800">⚠ Pilih sampah dulu!</span>';
    fb.style.background   = 'rgba(255,136,0,.05)';
    fb.style.padding      = '8px 16px';
    fb.style.borderRadius = '6px';
    return;
  }

  const correct  = selectedItem.id === binType;
  const wasteData = WASTE_TYPES.find(w => w.emoji === selectedItem.emoji);

  // Map binType string to CSS class name
  const binClassMap = { organik:'organic', plastik:'plastic', logam:'metal', ewaste:'ewaste', b3:'b3' };
  const binEl = document.querySelector(`.bin-${binClassMap[binType]}`);

  // ── CORRECT ──────────────────────────────
  if (correct) {
    const multiplier = GS.skills.industrial ? 1.3 : 1.0;
    const earned     = Math.floor((wasteData?.value || 100) * multiplier);

    GS.credits       += earned;
    GS.wasteCollected++;
    GS.sortScore     += 10;
    GS.score         += 10;
    GS.pollution      = Math.max(0, GS.pollution - 2);

    addXP(15);
    showNotif(`+${earned} KREDIT • ${selectedItem.emoji} Benar!`);

    const fb = document.getElementById('sort-feedback');
    fb.innerHTML          = `<span style="color:#00ff64">✅ BENAR! +${earned} kredit • +15 XP</span>`;
    fb.style.background   = 'rgba(0,255,100,.1)';

    // Show edu fact
    if (wasteData?.fact) {
      document.getElementById('sort-fact').innerHTML     = wasteData.fact;
      document.getElementById('sort-fact').style.display = 'block';
    }

    // Flash bin green
    if (binEl) { binEl.classList.remove('correct'); void binEl.offsetWidth; binEl.classList.add('correct'); }

  // ── WRONG ────────────────────────────────
  } else {
    GS.score     = Math.max(0, GS.score - 5);
    GS.pollution = Math.min(100, GS.pollution + 1);

    const fb = document.getElementById('sort-feedback');
    fb.innerHTML          = `<span style="color:#ff4444">❌ SALAH! ${selectedItem.emoji} ${selectedItem.name} seharusnya di ${selectedItem.id.toUpperCase()}</span>`;
    fb.style.background   = 'rgba(255,0,0,.08)';

    // Show corrective edu fact
    if (wasteData?.fact) {
      document.getElementById('sort-fact').innerHTML     = wasteData.fact;
      document.getElementById('sort-fact').style.display = 'block';
    }

    // Flash bin red
    if (binEl) { binEl.classList.remove('wrong'); void binEl.offsetWidth; binEl.classList.add('wrong'); }

    flashDamage();
  }

  document.getElementById('sort-score').textContent = `SKOR: ${GS.sortScore}`;
  selectedItem = null;
  updateHUD();
}
