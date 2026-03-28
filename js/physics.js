import * as CANNON from 'cannon-es';

let world;
const bodies = []; // mesh-body pairs to sync

export function initPhysics() {
  world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0)
  });

  const defaultMaterial = new CANNON.Material("default");
  const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial, defaultMaterial, {
      friction: 0.5,
      restitution: 0.3,
    }
  );
  world.addContactMaterial(defaultContactMaterial);
  world.defaultMaterial = defaultMaterial;
  world.broadphase = new CANNON.SAPBroadphase(world);
  world.allowSleep = true;
}

export function getWorld() {
  return world;
}

// Track a mesh-body pair for sync. Body must already be in the world.
export function addPhysicsBody(mesh, body) {
  bodies.push({ mesh, body });
}

export function updatePhysics(dt) {
  if (!world) return;
  world.step(1 / 60, dt, 3);
  bodies.forEach(({ mesh, body }) => {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  });
}
