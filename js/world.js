/* ============================================================
   ECO HAVOC: GREEN REBORN — js/world.js
   Three.js 3D open world: scene setup, city generation,
   waste object spawning, player movement, minimap,
   atmosphere, and main game loop.
   Depends on: three.min.js (CDN), data.js, ui.js
   ============================================================ */

'use strict';

// ──────────────────────────────────────────────
// SCENE GLOBALS
// ──────────────────────────────────────────────
let scene, camera, renderer, clock;

// Arrays of world objects
let wasteObjects = [];   // { mesh, type, label, collected, originalY }
let buildings    = [];   // THREE.Mesh — for minimap dots
let particles    = [];   // { mesh, type:'smog' }

// Input state
let keys            = {};
let frameCount      = 0;

// Mouse-look angles (pointer lock)
let yaw             = 0;
let pitch           = 0;
let isPointerLocked = false;

// ──────────────────────────────────────────────
// INITIALISE 3D SCENE
// ──────────────────────────────────────────────

function init3D() {
  // Scene + fog
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x001a00, 0.018);

  // Camera (first-person eye-height)
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );
  camera.position.set(0, 2, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('canvas'),
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  clock = new THREE.Clock();

  // ── Lighting ──────────────────────────────
  scene.add(new THREE.AmbientLight(0x002200, 0.8));

  const sun = new THREE.DirectionalLight(0x88ffcc, 1.2);
  sun.position.set(50, 80, 30);
  sun.castShadow              = true;
  sun.shadow.mapSize.width    = 2048;
  sun.shadow.mapSize.height   = 2048;
  scene.add(sun);

  // Neon coloured point lights scattered around the plaza
  const neonColors = [0x00ff64, 0x0066ff, 0xff0066, 0xffaa00];
  neonColors.forEach((c, i) => {
    const light = new THREE.PointLight(c, 1.5, 40);
    light.position.set(
      Math.cos(i / neonColors.length * Math.PI * 2) * 20,
      6,
      Math.sin(i / neonColors.length * Math.PI * 2) * 20
    );
    scene.add(light);
  });

  // ── Ground plane ─────────────────────────
  const groundGeo = new THREE.PlaneGeometry(300, 300, 50, 50);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x0a1a0a });
  const ground    = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x  = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Subtle grid lines on the ground
  scene.add(new THREE.GridHelper(200, 40, 0x003300, 0x002200));

  // ── Build world ───────────────────────────
  generateCity();
  spawnWasteForDistrict();
  generatePollutionParticles();

  // ── Input events ──────────────────────────
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup',   e => { keys[e.code] = false; });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Pointer lock for mouse-look
  document.getElementById('canvas').addEventListener('click', () => {
    document.getElementById('canvas').requestPointerLock();
  });

  document.addEventListener('pointerlockchange', () => {
    isPointerLocked = document.pointerLockElement === document.getElementById('canvas');
  });

  document.addEventListener('mousemove', e => {
    if (!isPointerLocked) return;
    yaw   -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;
    pitch  = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
  });

  // Action hotkeys (E = collect, R = sorting panel, Esc = close panels)
  window.addEventListener('keydown', e => {
    if (e.code === 'KeyE')   collectNearbyWaste();
    if (e.code === 'KeyR')   showPanel('sorting');
    if (e.code === 'Escape') hideAllPanels();
  });

  animate();
}

// ──────────────────────────────────────────────
// CITY GENERATION
// ──────────────────────────────────────────────

function generateCity() {
  // Building palette
  const buildingPalette = [
    { color: 0x002200 },
    { color: 0x001133 },
    { color: 0x220022 },
    { color: 0x003300 }
  ];

  // Procedural buildings
  for (let i = 0; i < 80; i++) {
    const x = (Math.random() - 0.5) * 180;
    const z = (Math.random() - 0.5) * 180;
    if (Math.abs(x) < 10 && Math.abs(z) < 10) continue; // leave central plaza clear

    const h  = 5  + Math.random() * 35;
    const w  = 3  + Math.random() * 8;
    const d  = 3  + Math.random() * 8;
    const bd = buildingPalette[Math.floor(Math.random() * buildingPalette.length)];

    const geo  = new THREE.BoxGeometry(w, h, d);
    const mat  = new THREE.MeshLambertMaterial({
      color:    bd.color,
      emissive: new THREE.Color(0x000800)
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, h / 2, z);
    mesh.castShadow    = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    buildings.push(mesh);

    // Randomised neon rooftop strip
    if (Math.random() > 0.5) {
      const stripGeo = new THREE.BoxGeometry(w + 0.1, 0.3, d + 0.1);
      const stripMat = new THREE.MeshBasicMaterial({
        color: [0x00ff64, 0x00aaff, 0xff4488, 0xffaa00][Math.floor(Math.random() * 4)]
      });
      const strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.set(x, h, z);
      scene.add(strip);
    }
  }

  // Road grid (9 x 9 rows/columns)
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  for (let i = -4; i <= 4; i++) {
    const roadH = new THREE.Mesh(new THREE.BoxGeometry(200, 0.05, 3), roadMat);
    roadH.position.set(0, 0.01, i * 20);
    scene.add(roadH);

    const roadV = new THREE.Mesh(new THREE.BoxGeometry(3, 0.05, 200), roadMat);
    roadV.position.set(i * 20, 0.01, 0);
    scene.add(roadV);
  }

  // Trees (eco health indicators scattered around the city)
  for (let i = 0; i < 20; i++) {
    const tx = (Math.random() - 0.5) * 100;
    const tz = (Math.random() - 0.5) * 100;

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 2, 8),
      new THREE.MeshLambertMaterial({ color: 0x4a2800 })
    );
    trunk.position.set(tx, 1, tz);
    scene.add(trunk);

    const top = new THREE.Mesh(
      new THREE.SphereGeometry(1.5 + Math.random() * 0.5, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x00aa33, emissive: new THREE.Color(0x001100) })
    );
    top.position.set(tx, 3 + Math.random(), tz);
    scene.add(top);
  }

  // Central plaza disc
  const plaza = new THREE.Mesh(
    new THREE.CylinderGeometry(8, 8, 0.2, 32),
    new THREE.MeshLambertMaterial({ color: 0x111111 })
  );
  plaza.position.set(0, 0.1, 0);
  scene.add(plaza);

  // Sorting station marker in the plaza centre
  const station = new THREE.Mesh(
    new THREE.BoxGeometry(3, 3, 3),
    new THREE.MeshLambertMaterial({ color: 0x004400, emissive: new THREE.Color(0x002200) })
  );
  station.position.set(0, 1.5, 0);
  scene.add(station);

  // Glowing green sign on top of the station
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.5, 2.5),
    new THREE.MeshBasicMaterial({ color: 0x00ff64 })
  );
  sign.position.set(0, 3.3, 0);
  scene.add(sign);
}

// ──────────────────────────────────────────────
// POLLUTION PARTICLE CLOUD
// ──────────────────────────────────────────────

function generatePollutionParticles() {
  const geo   = new THREE.BufferGeometry();
  const count = 800;
  const pos   = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 200;
    pos[i * 3 + 1] = Math.random() * 30;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 200;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat    = new THREE.PointsMaterial({ color: 0x443300, size: 0.3, transparent: true, opacity: 0.4 });
  const points = new THREE.Points(geo, mat);
  scene.add(points);
  particles.push({ mesh: points, type: 'smog' });
}

// ──────────────────────────────────────────────
// WASTE OBJECT SPAWNING
// ──────────────────────────────────────────────

/**
 * Remove existing 3D waste meshes and respawn
 * based on the current district's pollution level.
 */
function spawnWasteForDistrict() {
  // Clear old waste
  wasteObjects.forEach(w => scene.remove(w.mesh));
  wasteObjects = [];

  const d     = DISTRICTS[GS.currentDistrict];
  const count = 10 + Math.floor(d.pollution / 10);

  const wasteColors = [
    { color: 0x8b4513, type: 'organik', label: 'Organik' },
    { color: 0x1e90ff, type: 'plastik', label: 'Plastik' },
    { color: 0xaaaaaa, type: 'logam',   label: 'Logam'   },
    { color: 0x9400d3, type: 'ewaste',  label: 'E-Waste' },
    { color: 0xff4500, type: 'b3',      label: 'B3'      }
  ];

  for (let i = 0; i < count; i++) {
    const wx = (Math.random() - 0.5) * 100;
    const wz = (Math.random() - 0.5) * 100;
    const wt = wasteColors[Math.floor(Math.random() * wasteColors.length)];

    // Waste sphere
    const geo  = new THREE.SphereGeometry(0.4 + Math.random() * 0.3, 8, 8);
    const mat  = new THREE.MeshBasicMaterial({ color: wt.color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(wx, 0.4, wz);

    // Glowing ring beneath the sphere
    const ringGeo  = new THREE.TorusGeometry(0.6, 0.05, 8, 32);
    const ringMat  = new THREE.MeshBasicMaterial({ color: wt.color, transparent: true, opacity: 0.6 });
    const ring     = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    mesh.add(ring);

    scene.add(mesh);
    wasteObjects.push({
      mesh,
      type:      wt.type,
      label:     wt.label,
      collected: false,
      originalY: 0.4
    });
  }
}

// ──────────────────────────────────────────────
// COLLECT NEAREST WASTE (E key)
// ──────────────────────────────────────────────

function collectNearbyWaste() {
  const px = camera.position.x;
  const pz = camera.position.z;
  const collectRadius = 5;

  let closestDist = collectRadius;
  let closestIdx  = -1;

  wasteObjects.forEach((w, i) => {
    if (w.collected) return;
    const dx   = w.mesh.position.x - px;
    const dz   = w.mesh.position.z - pz;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < closestDist) { closestDist = dist; closestIdx = i; }
  });

  if (closestIdx >= 0) {
    const w = wasteObjects[closestIdx];
    w.collected = true;
    scene.remove(w.mesh);

    GS.wasteCollected++;
    const typeValues = { organik: 80, plastik: 120, logam: 250, ewaste: 400, b3: 600 };
    const val        = typeValues[w.type] || 100;
    GS.credits  += val;
    GS.score    += 5;
    GS.pollution = Math.max(0, GS.pollution - 1);

    addXP(10);
    showCollectPopup(window.innerWidth / 2, window.innerHeight / 2, `+${val} 💚 ${w.label}`);
    showNotif(`✅ ${w.label} dikumpulkan! +${val} kredit`);
    updateHUD();

    // Respawn if district is fully cleared
    const remaining = wasteObjects.filter(w => !w.collected).length;
    if (remaining === 0) {
      GS.districtClean[GS.currentDistrict] = Math.min(100, GS.districtClean[GS.currentDistrict] + 20);
      showNotif('🎉 Distrik bersih! Luar biasa!');
      setTimeout(() => spawnWasteForDistrict(), 2000);
    }
  } else {
    showNotif('⚠ Tidak ada sampah di sekitarmu! (E = kumpul)');
  }
}

// ──────────────────────────────────────────────
// ATMOSPHERE UPDATE (sky / fog reacts to pollution)
// ──────────────────────────────────────────────

function updateAtmosphere() {
  if (!scene) return;
  const p = GS.pollution / 100;

  // Sky colour: greenish when clean, grey-brown when toxic
  const r = Math.floor(p * 25);
  const g = Math.floor((1 - p) * 20 + 5);
  const b = Math.floor(p * 15);
  renderer.setClearColor(new THREE.Color(`rgb(${r},${g},${b})`));
  scene.fog.color.setRGB(r / 255, g / 255, b / 255);
  scene.fog.density = 0.012 + p * 0.018;

  // Smog particle cloud opacity & colour
  if (particles[0]) {
    particles[0].mesh.material.opacity = p * 0.6;
    particles[0].mesh.material.color.setHex(p > 0.5 ? 0x554400 : 0x004400);
  }
}

// ──────────────────────────────────────────────
// MINIMAP 2D CANVAS RENDER
// ──────────────────────────────────────────────

function drawMinimap() {
  const canvas = document.getElementById('minimap-canvas');
  const ctx    = canvas.getContext('2d');
  const W = 150, H = 150;

  // Background
  ctx.fillStyle = '#050f05';
  ctx.fillRect(0, 0, W, H);

  // Grid overlay
  ctx.strokeStyle = 'rgba(0,255,100,.05)';
  ctx.lineWidth   = 0.5;
  for (let i = 0; i < W; i += 15) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke();
  }

  // Building dots
  ctx.fillStyle = 'rgba(0,100,40,.4)';
  buildings.forEach(b => {
    const mx = b.position.x / 200 * W + W / 2;
    const mz = b.position.z / 200 * H + H / 2;
    if (mx > 0 && mx < W && mz > 0 && mz < H) {
      ctx.fillRect(mx - 2, mz - 2, 4, 4);
    }
  });

  // Waste dots (orange)
  wasteObjects.forEach(w => {
    if (w.collected) return;
    const mx = w.mesh.position.x / 200 * W + W / 2;
    const mz = w.mesh.position.z / 200 * H + H / 2;
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath(); ctx.arc(mx, mz, 2, 0, Math.PI * 2); ctx.fill();
  });

  // Player dot
  const px = camera.position.x / 200 * W + W / 2;
  const pz = camera.position.z / 200 * H + H / 2;
  ctx.fillStyle   = '#00ff64';
  ctx.strokeStyle = '#00ff64';
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.arc(px, pz, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Direction arrow
  ctx.save();
  ctx.translate(px, pz);
  ctx.rotate(yaw);
  ctx.fillStyle = '#00ff64';
  ctx.beginPath();
  ctx.moveTo(0, -7); ctx.lineTo(-3, 3); ctx.lineTo(3, 3);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ──────────────────────────────────────────────
// MAIN GAME LOOP
// ──────────────────────────────────────────────

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  frameCount++;

  // ── Player movement ───────────────────────
  const speed = (GS.skills.speed ? 11 : 8) * dt;

  if (keys['KeyW']   || keys['ArrowUp']   ) { camera.position.x -= Math.sin(yaw) * speed; camera.position.z -= Math.cos(yaw) * speed; }
  if (keys['KeyS']   || keys['ArrowDown'] ) { camera.position.x += Math.sin(yaw) * speed; camera.position.z += Math.cos(yaw) * speed; }
  if (keys['KeyA']   || keys['ArrowLeft'] ) { camera.position.x -= Math.cos(yaw) * speed; camera.position.z += Math.sin(yaw) * speed; }
  if (keys['KeyD']   || keys['ArrowRight']) { camera.position.x += Math.cos(yaw) * speed; camera.position.z -= Math.sin(yaw) * speed; }

  // World boundary clamp
  camera.position.x = Math.max(-90, Math.min(90, camera.position.x));
  camera.position.z = Math.max(-90, Math.min(90, camera.position.z));
  camera.position.y = 2; // fixed eye-height

  // Apply mouse-look rotation
  camera.rotation.order = 'YXZ';
  camera.rotation.y     = yaw;
  camera.rotation.x     = pitch;

  // ── Animate waste (float + spin) ──────────
  wasteObjects.forEach((w, i) => {
    if (!w.collected) {
      w.mesh.position.y = w.originalY + Math.sin(frameCount * 0.05 + i) * 0.15;
      w.mesh.rotation.y += 0.02;
    }
  });

  // ── Passive income from bank buildings ────
  if (frameCount % 300 === 0) {
    const income = GS.economyBuildings.bank * 50;
    if (income > 0) { GS.credits += income; updateHUD(); }
  }

  // ── Pollution slowly creeps back up ───────
  if (frameCount % 600 === 0 && GS.pollution < 100) {
    GS.pollution = Math.min(100, GS.pollution + 0.5);
    updateHUD();
  }

  // ── Minimap refresh (every 10 frames) ─────
  if (frameCount % 10 === 0) drawMinimap();

  renderer.render(scene, camera);
}
