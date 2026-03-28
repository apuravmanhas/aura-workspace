import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { getScene, getCamera } from './engine3d.js?v=1774726033.62067';
import { getWorld } from './physics.js?v=1774726033.62067';
import { PLATFORMS } from './environment.js?v=1774726033.62067';
import { startEngine, updateEngineSpeed } from './sounds.js';

let carGroup, carBody;
let wheels = [];

// Robust input tracking
const activeKeys = new Set();

let onPlatformChangeCallback = null;
let currentPlatformId = '/';
let targetDrivePosition = null;
let currentSpeed = 0;
let dustSystem = null;
let carAngle = 0;
let smoothedVx = 0;
let smoothedVz = 0;

export function autoDriveTo(x, z) { targetDrivePosition = { x, z }; }
export function getCarSpeed() { return currentSpeed; }

export function initCharacter(onPlatformChange) {
  onPlatformChangeCallback = onPlatformChange;
  const scene = getScene();
  const world = getWorld();

  carGroup = new THREE.Group();

  // === Car Body ===
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.35, metalness: 0.7 });
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 3.5), bodyMat);
  chassis.position.y = 0.5;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  carGroup.add(chassis);

  // Cabin
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0x991515, roughness: 0.3, metalness: 0.8 });
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 1.8), cabinMat);
  cabin.position.set(0, 1.08, -0.15);
  cabin.castShadow = true;
  carGroup.add(cabin);

  // Windshield + rear
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.4 });
  const wsGeo = new THREE.BoxGeometry(1.5, 0.45, 0.1);
  const ws = new THREE.Mesh(wsGeo, glassMat);
  ws.position.set(0, 1.05, 0.75);
  ws.rotation.x = -0.3;
  carGroup.add(ws);
  const rw = new THREE.Mesh(wsGeo, glassMat);
  rw.position.set(0, 1.05, -1.05);
  rw.rotation.x = 0.3;
  carGroup.add(rw);

  // Headlights
  const hlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffaa, emissiveIntensity: 2.0 });
  [-0.65, 0.65].forEach(x => {
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), hlMat);
    hl.position.set(x, 0.5, 1.8);
    carGroup.add(hl);
    
    // Spotlight to illuminate the road
    const spot = new THREE.SpotLight(0xfff5dd, 2.5);
    spot.position.copy(hl.position);
    spot.target.position.set(x, 0, 8);
    spot.angle = Math.PI / 4;
    spot.penumbra = 0.5;
    spot.distance = 60;
    spot.castShadow = true;
    carGroup.add(spot);
    carGroup.add(spot.target);
  });

  // Taillights
  const tlMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.0 });
  [-0.7, 0.7].forEach(x => {
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.08), tlMat);
    tl.position.set(x, 0.5, -1.78);
    carGroup.add(tl);
  });

  // Wheels
  const wGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.25, 16);
  wGeo.rotateZ(Math.PI / 2);
  const wMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.85 });
  const wPos = [[-1.05, 0.38, 1.1], [1.05, 0.38, 1.1], [-1.05, 0.38, -1.1], [1.05, 0.38, -1.1]];
  wheels = [];
  wPos.forEach(pos => {
    const w = new THREE.Mesh(wGeo, wMat);
    w.position.set(...pos);
    w.castShadow = true;
    carGroup.add(w);
    wheels.push(w);
  });

  // Hub caps
  const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.26, 8);
  hubGeo.rotateZ(Math.PI / 2);
  const hubMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9 });
  wPos.forEach(pos => {
    const h = new THREE.Mesh(hubGeo, hubMat);
    h.position.set(...pos);
    carGroup.add(h);
  });

  scene.add(carGroup);
  initDust(scene);

  // Physics body — spawn in the open center of the world
  const shape = new CANNON.Box(new CANNON.Vec3(1.0, 0.35, 1.75));
  carBody = new CANNON.Body({
    mass: 50,
    position: new CANNON.Vec3(0, 1, 0),
    shape,
    linearDamping: 0.92,  // High damping to prevent sliding when key released
    angularDamping: 0.999,
    fixedRotation: true
  });
  world.addBody(carBody);

  // Keyboard events — robust against different browser mappings
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    activeKeys.add(e.code);
    activeKeys.add(e.key);
    activeKeys.add(e.key.toLowerCase());
    
    if (['KeyW','KeyA','KeyS','KeyD','w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code) ||
        ['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key.toLowerCase())) {
      targetDrivePosition = null; // Cancel auto-drive
      if (e.code.startsWith('Arrow')) e.preventDefault(); // Prevent scrolling
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    activeKeys.delete(e.code);
    activeKeys.delete(e.key);
    activeKeys.delete(e.key.toLowerCase());
  });

  // Click-to-drive from custom events
  window.addEventListener('aura-drive-to', (e) => {
    autoDriveTo(e.detail.x, e.detail.z);
  });

  // Set fixed top-down camera immediately — no follow camera
  const camera = getCamera();
  camera.position.set(0, 28, 12);
  camera.lookAt(0, 0, 0);

  // Safely hook engine noise start when a user first presses a driving key
  window.addEventListener('keydown', (e) => {
    if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
      startEngine();
    }
  }, { once: true });

  console.log('[Aura] Car initialized at (0, 2, 0). Use WASD or Arrow keys to drive.');
}

// === Dust ===
function initDust(scene) {
  const count = 50;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3).fill(-999);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0x8caa6a, size: 0.35, transparent: true, opacity: 0.5, depthWrite: false });
  dustSystem = {
    mesh: new THREE.Points(geo, mat),
    vels: Array.from({ length: count }, () => ({ x: 0, y: 0, z: 0 })),
    life: new Float32Array(count),
    idx: 0
  };
  scene.add(dustSystem.mesh);
}

function emitDust(px, py, pz) {
  if (!dustSystem) return;
  const p = dustSystem.mesh.geometry.attributes.position.array;
  const i = dustSystem.idx;
  p[i * 3] = px + (Math.random() - 0.5) * 1.5;
  p[i * 3 + 1] = py;
  p[i * 3 + 2] = pz + (Math.random() - 0.5) * 1.5;
  dustSystem.vels[i] = { x: (Math.random() - 0.5) * 2, y: Math.random() * 2 + 1, z: (Math.random() - 0.5) * 2 };
  dustSystem.life[i] = 1.0;
  dustSystem.idx = (dustSystem.idx + 1) % dustSystem.life.length;
  dustSystem.mesh.geometry.attributes.position.needsUpdate = true;
}

function updateDust(dt) {
  if (!dustSystem) return;
  const p = dustSystem.mesh.geometry.attributes.position.array;
  for (let i = 0; i < dustSystem.life.length; i++) {
    if (dustSystem.life[i] > 0) {
      dustSystem.life[i] -= dt * 2;
      const v = dustSystem.vels[i];
      p[i * 3] += v.x * dt;
      p[i * 3 + 1] += v.y * dt;
      p[i * 3 + 2] += v.z * dt;
      v.y -= 3 * dt;
      if (dustSystem.life[i] <= 0) { p[i * 3] = -999; p[i * 3 + 1] = -999; p[i * 3 + 2] = -999; }
    }
  }
  dustSystem.mesh.geometry.attributes.position.needsUpdate = true;
}

// === Platform Detection ===
function detectPlatformOverlap() {
  if (!carBody) return;
  const pos = carBody.position;
  let newId = null;
  for (const plat of PLATFORMS) {
    const hw = plat.size.width / 2, hd = plat.size.depth / 2;
    if (pos.x >= plat.position.x - hw && pos.x <= plat.position.x + hw &&
        pos.z >= plat.position.z - hd && pos.z <= plat.position.z + hd) {
      newId = plat.id;
      break;
    }
  }
  if (newId !== currentPlatformId) {
    currentPlatformId = newId;
    if (newId) {
      if (onPlatformChangeCallback) onPlatformChangeCallback(currentPlatformId);
      window.dispatchEvent(new CustomEvent('aura-zone-enter', { detail: { id: newId } }));
    } else {
      window.dispatchEvent(new CustomEvent('aura-zone-leave'));
    }
  }
}

function lerpAngle(from, to, t) {
  let diff = to - from;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return from + diff * t;
}

// === Main Update ===
export function updateCharacter(dt) {
  if (!carBody || !carGroup) return;

  const maxSpeed = 16;
  let tvx = 0, tvz = 0;

  // Auto-drive
  if (targetDrivePosition) {
    const dx = targetDrivePosition.x - carBody.position.x;
    const dz = targetDrivePosition.z - carBody.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 2) { targetDrivePosition = null; }
    else { tvx = (dx / dist) * maxSpeed; tvz = (dz / dist) * maxSpeed; }
  } else {
    // Manual keyboard logic
    const fwd = activeKeys.has('KeyW') || activeKeys.has('w') || activeKeys.has('ArrowUp');
    const bwd = activeKeys.has('KeyS') || activeKeys.has('s') || activeKeys.has('ArrowDown');
    const lft = activeKeys.has('KeyA') || activeKeys.has('a') || activeKeys.has('ArrowLeft');
    const rgt = activeKeys.has('KeyD') || activeKeys.has('d') || activeKeys.has('ArrowRight');

    if (fwd) tvz -= maxSpeed;
    if (bwd) tvz += maxSpeed;
    if (lft) tvx -= maxSpeed;
    if (rgt) tvx += maxSpeed;

    // Normalize diagonal
    if (tvx !== 0 && tvz !== 0) { tvx *= 0.707; tvz *= 0.707; }
  }

  // FORCE velocity to override friction (keep Y velocity for gravity)
  carBody.wakeUp();
  // Smooth acceleration curve — gentle start, responsive feel
  const accel = Math.min(5.5 * dt, 1);
  smoothedVx += (tvx - smoothedVx) * accel;
  smoothedVz += (tvz - smoothedVz) * accel;
  
  carBody.velocity.x = smoothedVx;
  carBody.velocity.z = smoothedVz;

  const vx = carBody.velocity.x, vz = carBody.velocity.z;
  const speed = Math.sqrt(vx * vx + vz * vz);
  currentSpeed = speed;

  // Sync mesh position from physics body
  carGroup.position.set(carBody.position.x, carBody.position.y, carBody.position.z);

  // Update dynamic engine hum
  updateEngineSpeed(Math.min(speed / maxSpeed, 1.0));

  // Visual rotation — ONLY driven by input vectors, prevents physics jitter death-spin
  if (tvx !== 0 || tvz !== 0) {
    const targetAngle = Math.atan2(tvx, tvz);
    carAngle = lerpAngle(carAngle, targetAngle, Math.min(8 * dt, 1));
  }
  carGroup.rotation.y = carAngle;

  // Spin wheels
  wheels.forEach(w => { w.rotation.x += speed * dt * 4; });

  // Dust
  if (speed > 3 && Math.random() < speed * 0.04) {
    emitDust(carBody.position.x, 0.1, carBody.position.z);
  }
  updateDust(dt);

  // Speed-dependent zoom out for dynamic camera feel
  const targetCamY = 22 + (speed / maxSpeed) * 10;
  const targetCamZOff = 10 + (speed / maxSpeed) * 8;
  
  // Fixed top-down camera — smooth cinematic follow. NO camera rotation.
  const camera = getCamera();
  const targetX = carGroup.position.x;
  const targetZ = carGroup.position.z;
  camera.position.x += (targetX - camera.position.x) * Math.min(3 * dt, 1);
  camera.position.z += (targetZ + targetCamZOff - camera.position.z) * Math.min(3 * dt, 1); 
  camera.position.y += (targetCamY - camera.position.y) * Math.min(2 * dt, 1);
  camera.lookAt(camera.position.x, 0, camera.position.z - targetCamZOff);

  detectPlatformOverlap();
}

export function getCharacterPosition() {
  if (!carBody) return null;
  return { x: carBody.position.x, y: carBody.position.y, z: carBody.position.z, rotation: carAngle };
}
