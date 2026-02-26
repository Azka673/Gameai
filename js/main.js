/* ============================================================
   ECO HAVOC: GREEN REBORN — js/main.js
   Entry point: splash screen → game boot sequence.
   Must be loaded LAST (after all other scripts).
   Depends on: data.js, ui.js, sorting.js, world.js
   ============================================================ */

'use strict';

// ──────────────────────────────────────────────
// SPLASH → GAME TRANSITION
// ──────────────────────────────────────────────

/**
 * Called when the player presses "MULAI GAME" on the splash screen.
 * Fades out the splash, reveals the HUD, then boots the 3D engine.
 */
function startGame() {
  const splash = document.getElementById('splash');
  splash.style.transition = 'opacity .8s';
  splash.style.opacity    = '0';

  setTimeout(() => {
    // Hide splash, show HUD
    splash.style.display            = 'none';
    document.getElementById('hud').style.display = 'block';

    // Boot 3D world (world.js)
    init3D();

    // Sync all HUD values to initial GS
    updateHUD();

    // Welcome notification
    setTimeout(() => {
      showNotif('🌍 Selamat datang di ECO HAVOC! Tekan E untuk kumpul sampah, R untuk pilah.');
    }, 500);

    // Chapter 1 story banner
    setTimeout(() => {
      showStoryEvent(
        '📖 CHAPTER 1: THE OVERFLOW',
        'Kota Megapolis tenggelam dalam sampah. Polusi udara mencapai level kritis. ' +
        'Kamu adalah satu-satunya harapan. Mulai bersihkan kota!'
      );
    }, 2000);
  }, 800);
}

// ──────────────────────────────────────────────
// PREVENT DEFAULT SCROLL ON GAME KEYS
// ──────────────────────────────────────────────

document.addEventListener('keydown', e => {
  const gameKeys = ['KeyW', 'KeyS', 'KeyA', 'KeyD',
                    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  if (gameKeys.includes(e.code)) e.preventDefault();
});
