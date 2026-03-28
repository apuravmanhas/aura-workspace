const AudioContext = window.AudioContext || window.webkitAudioContext;
let ctx = null;

// Ensure audio context starts on user interaction
function initAudio() {
  if (!ctx) {
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

// Global listener for first interaction to unlock audio
window.addEventListener('click', initAudio, { once: true });
window.addEventListener('keydown', initAudio, { once: true });

// === Engine Hum ===
let engineOsc = null;
let engineGain = null;

export function startEngine() {
  if (!ctx) initAudio();
  if (engineOsc) return; // Already running

  engineOsc = ctx.createOscillator();
  engineOsc.type = 'sawtooth';
  engineOsc.frequency.setValueAtTime(40, ctx.currentTime);

  // Soften the harsh sawtooth
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(150, ctx.currentTime);

  engineGain = ctx.createGain();
  engineGain.gain.setValueAtTime(0, ctx.currentTime);

  engineOsc.connect(filter);
  filter.connect(engineGain);
  engineGain.connect(ctx.destination);

  engineOsc.start();
}

/**
 * Updates engine sound based on normalized speed (0 to 1).
 */
export function updateEngineSpeed(speedRatio) {
  if (!ctx || !engineOsc || !engineGain) return;
  // Pitch from 40Hz (idle) to 120Hz (max speed)
  const targetFreq = 40 + speedRatio * 80;
  engineOsc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.1);

  // Filter opens up at higher speeds
  const filter = engineOsc.numberOfOutputs > 0 ? engineOsc : null; 
  // Just volume control
  const targetVol = 0.05 + speedRatio * 0.1; // Max 0.15 volume
  engineGain.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.2);
}

// === Chime / UI sound ===
export function playChime() {
  if (!ctx) initAudio();
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(523.25, now); // C5
  osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.1); // C6 up ramp
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
  
  osc.start(now);
  osc.stop(now + 1.5);
}

// === Collision / Thud sound ===
export function playThud(intensity = 1) {
  if (!ctx) initAudio();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'square';
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(100, now);
  osc.frequency.exponentialRampToValueAtTime(20, now + 0.1);
  
  const vol = Math.min(0.3 * intensity, 0.4);
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  
  osc.start(now);
  osc.stop(now + 0.2);
}
