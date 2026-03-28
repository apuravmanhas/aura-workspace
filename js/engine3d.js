import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js?v=1774726033.62067';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js?v=1774726033.62067';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js?v=1774726033.62067';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js?v=1774726033.62067';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js?v=1774726033.62067';

let renderer, scene, camera, composer;
let updateCallbacks = [];
let lastTime = 0;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

export function initEngine(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) { console.error("No canvas:", canvasId); return; }

  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  } catch (e) {
    console.error("WebGL init failed:", e);
    return;
  }

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;

  // Warm sunset scene
  scene = new THREE.Scene();
  // Bright sunny daylight
  scene.background = new THREE.Color(0x88d0ee);
  scene.fog = new THREE.FogExp2(0xa8d8b0, 0.004);

  // Camera
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 35, 55);
  camera.lookAt(0, 0, 0);

  // === Warm Lighting ===
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x98d882, 0.7);
  scene.add(hemiLight);

  const sun = new THREE.DirectionalLight(0xfff5e0, 2.8);
  sun.position.set(30, 50, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 120;
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xfff0d0, 0.5);
  fill.position.set(-20, 15, -20);
  scene.add(fill);

  // Post-processing
  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.25, 0.4, 0.92
  );
  const fxaaPass = new ShaderPass(FXAAShader);
  const pixelRatio = renderer.getPixelRatio();
  fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
  fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);

  composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(fxaaPass);

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    const pr = Math.min(window.devicePixelRatio, 3);
    renderer.setPixelRatio(pr);
    if (composer) {
      composer.setSize(window.innerWidth, window.innerHeight);
      fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pr);
      fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pr);
    }
  });

  // Click-to-drive removed from canvas (canvas has pointer-events:none)
  // WASD/Arrow keys are the primary navigation method

  requestAnimationFrame(animate);
}

export function registerUpdate(cb) { updateCallbacks.push(cb); }

function animate(time) {
  requestAnimationFrame(animate);
  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;
  updateCallbacks.forEach(cb => cb(dt));
  if (composer) composer.render();
  else if (renderer && scene && camera) renderer.render(scene, camera);
}

export function getScene() { return scene; }
export function getCamera() { return camera; }
export function getRenderer() { return renderer; }
