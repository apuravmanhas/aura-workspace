import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { getScene, getCamera, getRenderer } from './engine3d.js?v=1774726033.62067';
import { getWorld, addPhysicsBody } from './physics.js?v=1774726033.62067';

export const PLATFORMS = [
  { id: '/', label: 'Dashboard', position: { x: 0, y: 0, z: 0 }, color: 0xd4915a, size: { width: 14, depth: 14 } },
  { id: '/recipe-editor', label: 'Recipe Editor', position: { x: -25, y: 0, z: -18 }, color: 0xc67a3e, size: { width: 12, depth: 12 } },
  { id: '/meal-planner', label: 'Weekly Planner', position: { x: 25, y: 0, z: -18 }, color: 0x8fbc5a, size: { width: 16, depth: 12 } },
  { id: '/analytics', label: 'Analytics', position: { x: 22, y: 0, z: 25 }, color: 0x5a8fb8, size: { width: 12, depth: 12 } },
  { id: '/suggestions', label: 'Smart Assistant', position: { x: -22, y: 0, z: 25 }, color: 0x9a6dbf, size: { width: 12, depth: 12 } },
];

let platformMeshes = [];
let animatedObjects = [];
let particleSystem = null;

export function buildEnvironment() {
  const scene = getScene();
  const world = getWorld();
  buildGround(scene, world);
  buildPlatforms(scene, world);
  buildRoads(scene);
  buildTrees(scene);
  buildRocks(scene);
  buildDecorations(scene);
  buildParticles(scene);
  setupInteractions();
}

export function updateEnvironment(dt, time) {
  // Animate special objects
  animatedObjects.forEach(obj => {
    if (obj.type === 'bob') {
      obj.mesh.position.y = obj.baseY + Math.sin(time * 2) * 0.4;
    } else if (obj.type === 'spin') {
      obj.mesh.rotation.z += dt * 0.8;
    } else if (obj.type === 'bob-spin') {
      obj.mesh.position.y = obj.baseY + Math.sin(time * 1.5) * 0.3;
      obj.mesh.rotation.y += dt;
      obj.mesh.rotation.x += dt * 0.5;
    }
  });
  // Drift particles upward
  if (particleSystem) {
    const pos = particleSystem.geometry.attributes.position.array;
    for (let i = 1; i < pos.length; i += 3) {
      pos[i] += dt * 0.3;
      if (pos[i] > 18) pos[i] = 0.5 + Math.random() * 2;
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;
  }
}

function buildGround(scene, world) {
  const geo = new THREE.PlaneGeometry(200, 200, 60, 60);
  const mat = new THREE.MeshStandardMaterial({ color: 0x7cad4b, roughness: 0.88, metalness: 0.02 });
  // Very subtle terrain displacement — keeps ground smooth and driveable
  const verts = geo.attributes.position.array;
  for (let i = 2; i < verts.length; i += 3) {
    verts[i] += (Math.random() - 0.5) * 0.06;
  }
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, mat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Physics floor
  const floorBody = new CANNON.Body({ mass: 0 });
  floorBody.addShape(new CANNON.Plane());
  floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(floorBody);
}

function buildPlatforms(scene, world) {
  PLATFORMS.forEach(plat => {
    // Ground-level colored circle — just a visual marker, NO physics body
    const radius = Math.min(plat.size.width, plat.size.depth) / 2;
    
    // Filled circle on the ground
    const circleGeo = new THREE.CircleGeometry(radius + 0.5, 32);
    const circleMat = new THREE.MeshStandardMaterial({
      color: plat.color, roughness: 0.7, metalness: 0.05,
      transparent: true, opacity: 0.35
    });
    const circle = new THREE.Mesh(circleGeo, circleMat);
    circle.rotation.x = -Math.PI / 2;
    circle.position.set(plat.position.x, 0.02, plat.position.z);
    circle.receiveShadow = true;
    circle.userData = { id: plat.id, label: plat.label };
    scene.add(circle);
    platformMeshes.push(circle);

    // Glowing ring border
    const ringGeo = new THREE.RingGeometry(radius + 0.2, radius + 0.7, 48);
    const ringMat = new THREE.MeshStandardMaterial({
      color: lighten(plat.color, 1.3),
      emissive: plat.color, emissiveIntensity: 0.6,
      transparent: true, opacity: 0.5,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(plat.position.x, 0.03, plat.position.z);
    scene.add(ring);

    // No physics body — car drives freely across zones

    // Label
    const label = makeLabel(plat.label, plat.color);
    label.position.set(plat.position.x, 4, plat.position.z);
    scene.add(label);

    // Per-platform decorations
    decoratePlatform(scene, plat);
  });
}

function decoratePlatform(scene, plat) {
  const x = plat.position.x, z = plat.position.z;

  if (plat.id === '/') {
    // Central monument
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.8, 3, 8),
      new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.5, metalness: 0.3 })
    );
    pillar.position.set(x, 1.6, z);
    pillar.castShadow = true;
    scene.add(pillar);

    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffaa44, emissive: 0xffaa44, emissiveIntensity: 1.5, roughness: 0.1 })
    );
    orb.position.set(x, 3.6, z);
    scene.add(orb);
    animatedObjects.push({ mesh: orb, type: 'bob', baseY: 3.6 });

    // Corner posts removed per user request
  }

  if (plat.id === '/recipe-editor') {
    // Cutting board
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.15, 2),
      new THREE.MeshStandardMaterial({ color: 0x8B6C42 })
    );
    board.position.set(x - 2, 0.2, z);
    board.castShadow = true;
    scene.add(board);
    // Bowl
    const bowl = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xeeaa55 })
    );
    bowl.position.set(x + 2, 0.15, z - 2);
    bowl.rotation.x = Math.PI;
    scene.add(bowl);
  }

  if (plat.id === '/meal-planner') {
    for (let i = 0; i < 7; i++) {
      const day = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.3, 1),
        new THREE.MeshStandardMaterial({ color: i < 5 ? 0x6aaa48 : 0xc97a3e })
      );
      day.position.set(x - 6 + i * 2, 0.2, z + 3);
      day.castShadow = true;
      scene.add(day);
    }
  }

  if (plat.id === '/analytics') {
    for (let i = 0; i < 5; i++) {
      const h = 1 + Math.random() * 3;
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(1, h, 1),
        new THREE.MeshStandardMaterial({ color: 0x4488aa + i * 0x111100, emissive: 0x224466, emissiveIntensity: 0.3 })
      );
      bar.position.set(x - 3 + i * 1.5, 0.1 + h / 2, z - 2);
      bar.castShadow = true;
      scene.add(bar);
    }
  }

  if (plat.id === '/suggestions') {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2, 0.15, 8, 32),
      new THREE.MeshStandardMaterial({ color: 0xaa66dd, emissive: 0x8844bb, emissiveIntensity: 0.8, transparent: true, opacity: 0.7 })
    );
    ring.position.set(x, 3.5, z);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
    animatedObjects.push({ mesh: ring, type: 'spin' });

    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.6, 0),
      new THREE.MeshStandardMaterial({ color: 0xcc88ff, emissive: 0xaa66dd, emissiveIntensity: 1.0 })
    );
    crystal.position.set(x, 3.5, z);
    scene.add(crystal);
    animatedObjects.push({ mesh: crystal, type: 'bob-spin', baseY: 3.5 });
  }
}

function buildRoads(scene) {
  const roadMat = new THREE.MeshStandardMaterial({ color: 0xb09070, roughness: 0.85 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xddd5c0 });

  const roads = [
    [[0, 0], [-25, -18]], [[0, 0], [25, -18]],
    [[0, 0], [22, 25]], [[0, 0], [-22, 25]],
  ];

  roads.forEach(([from, to]) => {
    const dx = to[0] - from[0], dz = to[1] - from[1];
    const len = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);
    const cx = from[0] + dx / 2, cz = from[1] + dz / 2;

    const road = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.06, len), roadMat);
    road.position.set(cx, 0.04, cz);
    road.rotation.y = angle;
    road.receiveShadow = true;
    scene.add(road);

    // Stripes
    [-1.9, 1.9].forEach(off => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, len), stripeMat);
      s.position.set(cx + Math.cos(angle) * off, 0.07, cz - Math.sin(angle) * off);
      s.rotation.y = angle;
      scene.add(s);
    });
  });
}

function buildTrees(scene) {
  for (let i = 0; i < 50; i++) {
    const x = (Math.random() - 0.5) * 160;
    const z = (Math.random() - 0.5) * 160;
    if (nearPlatform(x, z, 5) || (Math.abs(x) < 5 && Math.abs(z) < 5)) continue;
    makeTree(scene, x, z, 0.7 + Math.random() * 0.8);
  }
  // Grass clusters for richer ground cover
  buildGrassClusters(scene);
}

function makeTree(scene, x, z, s) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2 * s, 0.35 * s, 2 * s, 8),
    new THREE.MeshStandardMaterial({ color: 0x6B4226 })
  );
  trunk.position.set(x, s, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const cols = [0x2d6e1e, 0x3a8a2a, 0x4ca33a];
  const levels = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < levels; i++) {
    const foliage = new THREE.Mesh(
      new THREE.ConeGeometry((1.2 - i * 0.25) * s, (1.5 - i * 0.1) * s, 8),
      new THREE.MeshStandardMaterial({ color: cols[i % 3], roughness: 0.8 })
    );
    foliage.position.set(x, 2 * s + i * 0.8 * s, z);
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    scene.add(foliage);
  }
}

function buildRocks(scene) {
  for (let i = 0; i < 30; i++) {
    const x = (Math.random() - 0.5) * 150;
    const z = (Math.random() - 0.5) * 150;
    if (nearPlatform(x, z, 3)) continue;
    const s = 0.3 + Math.random() * 0.7;
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(s, 0),
      new THREE.MeshStandardMaterial({ color: 0x887766 + Math.floor(Math.random() * 0x222222), roughness: 0.9 })
    );
    rock.position.set(x, s * 0.4, z);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
  }
}

function buildDecorations(scene) {
  // Signpost
  const postMat = new THREE.MeshStandardMaterial({ color: 0x8B6914 });
  const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3, 8), postMat);
  signPost.position.set(9, 1.5, 9);
  signPost.castShadow = true;
  scene.add(signPost);
  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.8, 0.1),
    new THREE.MeshStandardMaterial({ color: 0xb8945a })
  );
  signBoard.position.set(9, 3, 9);
  signBoard.castShadow = true;
  scene.add(signBoard);

  // Scattered interactive blocks (physics-enabled)
  const world = getWorld();
  const blockMat = new THREE.MeshStandardMaterial({ color: 0xd67c2f, roughness: 0.6 });
  for (let i = 0; i < 6; i++) {
    const bx = (Math.random() - 0.5) * 20 - 10;
    const bz = (Math.random() - 0.5) * 20 - 30;
    const block = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), blockMat);
    block.castShadow = true;
    block.receiveShadow = true;
    scene.add(block);
    const blockBody = new CANNON.Body({ mass: 5 });
    blockBody.addShape(new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)));
    blockBody.position.set(bx, 5 + i * 2, bz);
    world.addBody(blockBody);
    addPhysicsBody(block, blockBody);
  }
}

function buildGrassClusters(scene) {
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x6a9e40, roughness: 0.9 });
  const grassMat2 = new THREE.MeshStandardMaterial({ color: 0x5d8a38, roughness: 0.9 });
  for (let i = 0; i < 80; i++) {
    const x = (Math.random() - 0.5) * 150;
    const z = (Math.random() - 0.5) * 150;
    if (nearPlatform(x, z, 4)) continue;
    const s = 0.15 + Math.random() * 0.25;
    const blades = 2 + Math.floor(Math.random() * 3);
    for (let b = 0; b < blades; b++) {
      const blade = new THREE.Mesh(
        new THREE.ConeGeometry(s * 0.3, s * 2, 4),
        Math.random() > 0.5 ? grassMat : grassMat2
      );
      blade.position.set(
        x + (Math.random() - 0.5) * 0.6,
        s,
        z + (Math.random() - 0.5) * 0.6
      );
      blade.rotation.set(0, Math.random() * Math.PI, (Math.random() - 0.5) * 0.3);
      blade.receiveShadow = true;
      scene.add(blade);
    }
  }
}

function buildParticles(scene) {
  const count = 550;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 170;
    pos[i * 3 + 1] = 0.5 + Math.random() * 14;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 170;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffe8a0, size: 0.12, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false
  });
  particleSystem = new THREE.Points(geo, mat);
  scene.add(particleSystem);
}

function setupInteractions() {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const canvas = getRenderer().domElement;

  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, getCamera());
    const hits = raycaster.intersectObjects(platformMeshes);
    if (hits.length > 0) {
      window.dispatchEvent(new CustomEvent('aura-navigate', { detail: hits[0].object.userData.id }));
    }
  });
}

// Helpers
function nearPlatform(x, z, margin) {
  for (const p of PLATFORMS) {
    if (Math.abs(x - p.position.x) < p.size.width / 2 + margin &&
        Math.abs(z - p.position.z) < p.size.depth / 2 + margin) return true;
  }
  return false;
}

function makeLabel(text, color) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  c.width = 512; c.height = 128;
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.font = 'Bold 48px Space Grotesk, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#' + color.toString(16).padStart(6, '0');
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#fff8ee';
  ctx.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(c);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sprite.scale.set(8, 2, 1);
  return sprite;
}

function darken(hex, factor) {
  const r = ((hex >> 16) & 255) * factor;
  const g = ((hex >> 8) & 255) * factor;
  const b = (hex & 255) * factor;
  return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
}

function lighten(hex, factor) {
  const r = Math.min(255, ((hex >> 16) & 255) * factor);
  const g = Math.min(255, ((hex >> 8) & 255) * factor);
  const b = Math.min(255, (hex & 255) * factor);
  return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
}
