// FORCE CACHE RESET
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(r => { for (let reg of r) reg.unregister(); });
}
if ('caches' in window) {
  caches.keys().then(names => { for (let n of names) caches.delete(n); });
}

import {
  DAYS, addDraftIngredient, addNotification, addRecipeToPlanner,
  createVersionSnapshot, deleteRecipe, duplicateRecipe, getDraftTotals,
  getPlannerTotals, getState, loadRecipeIntoDraft, movePlannerItem,
  refreshDailyChecklist, removeDraftIngredient, removePlannerItem,
  resetDraftRecipe, saveDraftRecipe, setRoute, setSearchQuery, subscribe,
  toggleChecklistItem, toggleTheme, updateDraftField, updateDraftIngredient,
  hardResetWorkspace, closeModal, openModal, setTrainingIntensity,
  setIntroComplete, toggleHudVisible, setHudVisible
} from './state.js?v=1774726033.62067';
import { renderRoute } from './ui.js?v=1774726033.62067';
import { setupKeyboardShortcuts, COMMANDS, searchCommands } from './commands.js?v=1774726033.62067';
import { createModalSystem, createNotificationSystem } from './modals.js?v=1774726033.62067';
import { initEngine, registerUpdate } from './engine3d.js?v=1774726033.62067';
import { initPhysics, updatePhysics } from './physics.js?v=1774726033.62067';
import { buildEnvironment, updateEnvironment } from './environment.js?v=1774726033.62067';
import { initCharacter, updateCharacter, getCharacterPosition, getCarSpeed } from './character.js?v=1774726033.62067';
import { playChime } from './sounds.js';

const appRoot = document.querySelector("#app-root");
const navButtons = Array.from(document.querySelectorAll("[data-route]"));
const themeToggle = document.querySelector("#theme-toggle");
const hudToggle = document.querySelector("#hud-toggle");
const resetButton = document.querySelector("#reset-workspace");
const quickAddForm = document.querySelector("#quick-add-form");
const savedRecipesList = document.querySelector("#saved-recipes-list");
const macroEls = {
  calories: document.querySelector("#macro-calories"),
  protein: document.querySelector("#macro-protein"),
  carbs: document.querySelector("#macro-carbs"),
  fats: document.querySelector("#macro-fats")
};
const plannerEls = {
  meals: document.querySelector("#planner-meals"),
  calories: document.querySelector("#planner-calories"),
  protein: document.querySelector("#planner-protein")
};
const ROUTES = ["/", "/recipe-editor", "/meal-planner", "/analytics", "/suggestions"];
const appShell = document.querySelector(".app-shell");
const brandSubtitle = document.querySelector("#brand-subtitle");
let introOverlay = null;
let minimapEl = null;
let minimapDot = null;
let hudFabButton = null;
let speedHud = document.querySelector("#speed-hud");
let speedValue = document.querySelector("#speed-value");
let zoneToast = document.querySelector("#zone-toast");
let zoneToastTimer = null;
let elapsedTime = 0;

const modalSystem = createModalSystem();
const notificationSystem = createNotificationSystem();

function formatValue(v, u = "") {
  const n = Number(v);
  return `${Math.round((Number.isFinite(n) ? n : 0) * 10) / 10}${u}`;
}

function debounce(cb, d) {
  let t = null;
  return (...a) => { if (t) clearTimeout(t); t = setTimeout(() => cb(...a), d); };
}
const onSearchInput = debounce((v) => setSearchQuery(v), 180);

function syncTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme === "light" ? "light" : "");
  document.body.style.background = theme === "light" ? "#f5e6d0" : "#1a1209";
}

// === Loading Screen ===
function dismissLoadingScreen() {
  const ls = document.querySelector("#loading-screen");
  if (ls) {
    setTimeout(() => { ls.classList.add("done"); }, 2000);
    setTimeout(() => { ls.remove(); }, 3000);
  }
}

// === Zone Toast ===
function showZoneToast(name) {
  if (!zoneToast) return;
  zoneToast.textContent = name;
  zoneToast.classList.add("show");
  if (zoneToastTimer) clearTimeout(zoneToastTimer);
  zoneToastTimer = setTimeout(() => zoneToast.classList.remove("show"), 2000);
}

// === Speed HUD ===
function updateSpeedHud() {
  if (!speedHud || !speedValue) return;
  const speed = getCarSpeed ? getCarSpeed() : 0;
  const display = Math.round(speed * 3.6); // rough km/h feel
  speedValue.textContent = display;
  speedHud.classList.toggle("visible", display > 0);
}

// === Intro Overlay === DISABLED (was blocking UI clicks)
// buildIntroOverlay is no longer called — we go straight to the live dashboard.


// === Minimap ===
function buildMinimap() {
  if (minimapEl) return;
  minimapEl = document.createElement("div");
  minimapEl.id = "mini-map";
  const platformData = [
    { label: 'Dash', x: 0, z: 0, color: '#d4915a', w: 14, d: 14 },
    { label: 'Recipe', x: -25, z: -18, color: '#c67a3e', w: 12, d: 12 },
    { label: 'Planner', x: 25, z: -18, color: '#8fbc5a', w: 16, d: 12 },
    { label: 'Analytics', x: 22, z: 25, color: '#5a8fb8', w: 12, d: 12 },
    { label: 'Asst', x: -22, z: 25, color: '#9a6dbf', w: 12, d: 12 },
  ];
  const scale = 2.5;
  const zones = platformData.map(p => `<div class="mini-map-zone" style="
    position:absolute;left:calc(50%+${p.x*scale}px);top:calc(50%+${p.z*scale}px);
    width:${p.w*scale}px;height:${p.d*scale}px;transform:translate(-50%,-50%);
    border:1px solid ${p.color};background:${p.color}30;font-size:7px;
    display:flex;align-items:center;justify-content:center;color:#f5e6d0;text-shadow:0 0 2px #000;
  ">${p.label}</div>`).join('');

  minimapEl.innerHTML = `
    <div class="mini-map-grid"></div>
    ${zones}
    <div class="mini-map-dot" style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:10px solid #e8943a;background:transparent;border-radius:0;position:absolute;top:0;left:0;transform-origin:50% 50%;pointer-events:none;z-index:10;"></div>
  `;
  minimapDot = minimapEl.querySelector(".mini-map-dot");
  document.body.appendChild(minimapEl);
}

function updateMinimap() {
  if (!minimapDot || !minimapEl) return;
  const pos = getCharacterPosition();
  if (!pos) return;
  const scale = 2.5;
  const x = pos.x * scale, z = pos.z * scale;
  const rot = pos.rotation !== undefined ? -pos.rotation : 0;
  minimapDot.style.transform = `translate(calc(-50% + 75px + ${x}px), calc(-50% + 75px + ${z}px)) rotate(${rot}rad)`;
}

function buildHudFab() {
  if (hudFabButton) return;
  hudFabButton = document.createElement("button");
  hudFabButton.id = "hud-fab";
  hudFabButton.type = "button";
  hudFabButton.textContent = "HUD (H)";
  hudFabButton.addEventListener("click", () => toggleHudVisible());
  document.body.appendChild(hudFabButton);
}

// === Navigation ===
function navigate(route, push = true) {
  console.log('[Aura] navigate →', route);
  if (push) { try { history.pushState({ route }, "", route); } catch (e) {} }
  setRoute(route);
}

const ZONE_NAMES = { "/": "Dashboard", "/recipe-editor": "Recipe Editor", "/meal-planner": "Weekly Planner", "/analytics": "Analytics", "/suggestions": "Smart Assistant" };

// NUCLEAR FIX: Document-level event delegation for ALL interactive elements.
// This catches clicks regardless of DOM timing, re-renders, or stale references.
function mountGlobalClickDelegation() {
  console.log('[Aura] Mounting GLOBAL click delegation');
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    // --- Navigation buttons [data-route] ---
    const routeBtn = target.closest("[data-route]");
    if (routeBtn) {
      const r = routeBtn.getAttribute("data-route");
      console.log('[Aura] Route click →', r);
      if (r) navigate(r);
      return;
    }

    // --- Theme toggle ---
    if (target.closest("#theme-toggle")) {
      console.log('[Aura] Theme toggle');
      toggleTheme();
      return;
    }

    // --- HUD toggle ---
    if (target.closest("#hud-toggle")) {
      console.log('[Aura] HUD toggle');
      toggleHudVisible();
      return;
    }

    // --- Reset workspace ---
    if (target.closest("#reset-workspace")) {
      console.log('[Aura] Reset workspace');
      if (window.confirm("Remove all recipes and planner data?")) {
        hardResetWorkspace();
        try { history.replaceState({ route: "/" }, "", "/"); } catch (e) {}
      }
      return;
    }

    // --- Saved recipes sidebar ---
    const recipeBtn = target.closest("#saved-recipes-list button[data-recipe-id]");
    if (recipeBtn) {
      loadRecipeIntoDraft(recipeBtn.getAttribute("data-recipe-id"));
      return;
    }
  });

  // Popstate for browser back/forward
  window.addEventListener("popstate", () => {
    const p = window.location.pathname;
    setRoute(ROUTES.includes(p) ? p : "/");
  });
}

// Legacy mount functions (kept as no-ops for compatibility)
function mountNavigation() { /* handled by global delegation */ }
function mountThemeToggle() { /* handled by global delegation */ }
function mountHudToggle() { /* handled by global delegation */ }
function mountResetAction() { /* handled by global delegation */ }

function mountQuickAdd() {
  // Use delegation for quick-add form too
  document.addEventListener("submit", (e) => {
    if (!(e.target instanceof HTMLFormElement) || e.target.id !== "quick-add-form") return;
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector("#quick-item")?.value?.trim();
    if (!name) return;
    addDraftIngredient({ name, grams: Number(form.querySelector("#quick-grams")?.value || 100) });
    form.reset();
    const gi = form.querySelector("#quick-grams");
    if (gi) gi.value = "100";
    navigate("/recipe-editor");
  });
}

function mountSidebarRecipes() {
  /* handled by global delegation */
}

function mountAppEvents() {
  appRoot.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const el = target.closest("[data-action]");
    const action = el?.getAttribute("data-action");
    if (!action) return;

    if (action === "add-ing") { addDraftIngredient(); return; }
    if (action === "remove-ing") { const id = el.getAttribute("data-ing-id"); if (id) removeDraftIngredient(id); return; }
    if (action === "reset-draft") { resetDraftRecipe(); return; }
    if (action === "load-recipe") { const id = el.getAttribute("data-recipe-id"); if (id) loadRecipeIntoDraft(id); return; }
    if (action === "duplicate-recipe") { const id = el.getAttribute("data-recipe-id"); if (id) duplicateRecipe(id); return; }
    if (action === "delete-recipe") { const id = el.getAttribute("data-recipe-id"); if (id) deleteRecipe(id); return; }
    if (action === "remove-plan-item") { const d = el.getAttribute("data-day"); const i = Number(el.getAttribute("data-index")); if (d && Number.isInteger(i)) removePlannerItem(d, i); return; }
    if (action === "add-to-planner") { const id = el.getAttribute("data-recipe-id"); if (id) { addRecipeToPlanner("monday", id); addNotification("Added to planner!", "success", 2000); } return; }
    if (action === "open-import") { openModal("import-file"); return; }
    if (action === "view-shortcuts") { openModal("shortcuts"); return; }
    if (action === "set-intensity") { const i = el.getAttribute("data-intensity"); if (i) { setTrainingIntensity(i); addNotification(`Training: ${i.toUpperCase()}`, "info", 1500); } return; }
  });

  appRoot.addEventListener("submit", (e) => {
    const f = e.target;
    if (f instanceof HTMLFormElement && f.id === "recipe-form") { e.preventDefault(); const r = saveDraftRecipe(); if (!r.ok) alert(r.error); }
  });

  appRoot.addEventListener("input", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement)) return;
    const df = t.getAttribute("data-draft-field");
    if (df) { updateDraftField(df, t.value); return; }
    const iid = t.getAttribute("data-ing-id"), ifield = t.getAttribute("data-ing-field");
    if (iid && ifield) { updateDraftIngredient(iid, ifield, t.value); return; }
    if (t.id === "recipe-search") onSearchInput(t.value);
  });

  appRoot.addEventListener("change", (e) => {
    const t = e.target;
    if (t instanceof HTMLInputElement && t.matches('[data-action="toggle-check"]')) {
      const k = t.getAttribute("data-key"); if (k) toggleChecklistItem(k);
    }
  });

  // Drag & Drop
  appRoot.addEventListener("dragstart", (e) => {
    const t = e.target; if (!(t instanceof HTMLElement)) return;
    const rc = t.closest('[data-drag-kind="recipe"]');
    if (rc && e.dataTransfer) { e.dataTransfer.effectAllowed = "copy"; e.dataTransfer.setData("text/plain", JSON.stringify({ kind: "recipe", recipeId: rc.getAttribute("data-recipe-id") })); return; }
    const pi = t.closest('[data-drag-kind="planned"]');
    if (pi && e.dataTransfer) { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", JSON.stringify({ kind: "planned", recipeId: pi.getAttribute("data-recipe-id"), day: pi.getAttribute("data-day"), index: Number(pi.getAttribute("data-index")) })); }
  });
  appRoot.addEventListener("dragover", (e) => { const t = e.target; if (t instanceof HTMLElement && t.closest("[data-drop-day]")) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; } });
  appRoot.addEventListener("drop", (e) => {
    const t = e.target; if (!(t instanceof HTMLElement)) return;
    const z = t.closest("[data-drop-day]"); if (!z) return;
    e.preventDefault();
    const day = z.getAttribute("data-drop-day"); if (!day || !DAYS.includes(day)) return;
    const raw = e.dataTransfer?.getData("text/plain"); if (!raw) return;
    try { const p = JSON.parse(raw); if (p.kind === "recipe" && p.recipeId) addRecipeToPlanner(day, p.recipeId); else if (p.kind === "planned") movePlannerItem(p.day, Number(p.index), day); } catch {}
  });
}

function renderCommandPalette(state) {
  if (!state.ui.commandPaletteOpen) return;
  const el = document.getElementById("command-palette-ui"); if (!el) return;
  const input = el.querySelector("input"), results = el.querySelector(".command-palette-results");
  if (!input || !results) return;
  const q = input.value.trim();
  const cmds = q ? searchCommands(q) : COMMANDS;
  const grouped = {};
  cmds.forEach(c => { if (!grouped[c.category]) grouped[c.category] = []; grouped[c.category].push(c); });
  results.innerHTML = Object.entries(grouped).map(([cat, cs]) => `
    <div class="command-category"><div class="command-category-label">${cat}</div>
    ${cs.map((c, i) => `<div class="command-item" data-command-id="${c.id}" ${i === 0 ? 'data-active="true"' : ''}><span>${c.label}</span>${c.shortcut ? `<span class="command-item-shortcut">${c.shortcut}</span>` : ''}</div>`).join('')}
    </div>`).join('');
  results.querySelectorAll(".command-item").forEach((item, i) => {
    item.addEventListener("click", () => {
      const cmd = COMMANDS.find(c => c.id === item.getAttribute("data-command-id"));
      if (cmd) { cmd.action(); import('./state.js?v=1774726033.62067').then(m => m.toggleCommandPalette()); }
    });
    if (i === 0) item.classList.add("active");
  });
}

function renderSavedRecipes(state) {
  if (!savedRecipesList) return;
  if (state.recipes.length === 0) { savedRecipesList.innerHTML = '<p class="muted">No recipes yet.</p>'; return; }
  savedRecipesList.innerHTML = state.recipes.slice(0, 12).map(r => `<button type="button" class="list-link" data-recipe-id="${r.id}">${r.name}</button>`).join("");
}

function renderHeaderMetrics() {
  const dt = getDraftTotals(), pt = getPlannerTotals();
  if (macroEls.calories) macroEls.calories.textContent = formatValue(dt.calories);
  if (macroEls.protein) macroEls.protein.textContent = formatValue(dt.protein, "g");
  if (macroEls.carbs) macroEls.carbs.textContent = formatValue(dt.carbs, "g");
  if (macroEls.fats) macroEls.fats.textContent = formatValue(dt.fats, "g");
  if (plannerEls.meals) plannerEls.meals.textContent = String(pt.meals);
  if (plannerEls.calories) plannerEls.calories.textContent = formatValue(pt.calories);
  if (plannerEls.protein) plannerEls.protein.textContent = formatValue(pt.protein, "g");
}

function syncNav(route) {
  navButtons.forEach(b => { b.classList.toggle("active", b.getAttribute("data-route") === route); });
}

function syncHeadline(route) {
  if (!brandSubtitle) return;
  const labels = { "/": "Dashboard · habits and focus", "/recipe-editor": "Recipe Editor · build plans", "/meal-planner": "Weekly Planner · schedule meals", "/analytics": "Analytics · progress", "/suggestions": "Smart Assistant · guided choices" };
  brandSubtitle.textContent = `${labels[route] || "Health Planner"} · H toggles HUD`;
}

function render(state) {
  const hudActive = state.ui.introComplete && state.ui.hudVisible;
  if (appShell) appShell.classList.toggle("hud-visible", hudActive);
  if (introOverlay) introOverlay.classList.toggle("is-hidden", state.ui.introComplete);
  if (minimapEl) minimapEl.classList.toggle("mini-map--visible", hudActive);
  if (hudToggle) hudToggle.textContent = hudActive ? "Hide HUD" : "Show HUD";
  if (hudFabButton) { hudFabButton.textContent = hudActive ? "Hide HUD (H)" : "Show HUD (H)"; hudFabButton.classList.toggle("is-ready", state.ui.introComplete); }

  try { syncTheme(state.theme); syncNav(state.route); syncHeadline(state.route); renderSavedRecipes(state); renderHeaderMetrics(); } catch (e) { console.warn("HUD render:", e); }
  try { renderRoute(appRoot, state.route); modalSystem.render(state); notificationSystem.render(state); renderCommandPalette(state); } catch (e) { console.error("Route render error:", e); appRoot.innerHTML = `<section class="view"><h2>Render Error</h2><p>${e.message}</p></section>`; }

  const rn = { "/": "Dashboard", "/recipe-editor": "Recipe Editor", "/meal-planner": "Weekly Planner", "/analytics": "Analytics", "/suggestions": "Smart Assistant" };
  document.title = `${rn[state.route] || "Aura"} - Aura Workspace`;
}

function bootstrap() {
  dismissLoadingScreen();
  // Skip intro overlay — go straight to live dashboard
  setIntroComplete(true);
  setHudVisible(true); // Start visible since car spawns on Dashboard

  let activePlatformId = "/";

  document.addEventListener("keydown", (e) => { 
    if (e.key.toLowerCase() === "h" && !e.ctrlKey && !e.metaKey) {
      // Only allow toggling features when at a designated platform
      if (activePlatformId) {
        toggleHudVisible();
      } else {
        showZoneToast("Drive to a platform first!");
      }
    } 
  });

  // Zone enter event (from character.js)
  window.addEventListener("aura-zone-enter", (e) => {
    activePlatformId = e.detail.id;
    const name = ZONE_NAMES[e.detail.id];
    if (name) {
      playChime();
      showZoneToast(name + " — Press H to open features");
    }
  });

  // Zone leave event (from character.js)
  window.addEventListener("aura-zone-leave", () => {
    activePlatformId = null;
    showZoneToast("Driving...");
    setHudVisible(false); // Auto-hide features when leaving platform
  });

  refreshDailyChecklist();
  createVersionSnapshot();

  // === 3D Engine ===
  try {
    initEngine("webgl-canvas");
    initPhysics();
    buildEnvironment();
    initCharacter((newRoute) => navigate(newRoute, true));
    buildMinimap();

    registerUpdate((dt) => {
      elapsedTime += dt;
      updatePhysics(dt);
      updateCharacter(dt);
      updateEnvironment(dt, elapsedTime);
      updateMinimap();
      updateSpeedHud();
    });
  } catch (e) {
    console.warn("3D layer failed; dashboard-only mode:", e);
  }

  // Command palette
  const cpUI = document.createElement("div");
  cpUI.id = "command-palette-ui";
  cpUI.className = "command-palette";
  cpUI.style.display = "none";
  cpUI.innerHTML = `<input type="text" class="command-palette-input" placeholder="Search commands (Cmd+K)..." /><div class="command-palette-results"></div>`;
  document.body.appendChild(cpUI);

  subscribe(state => {
    if (state.ui.commandPaletteOpen) { cpUI.style.display = "grid"; setTimeout(() => cpUI.querySelector("input")?.focus(), 50); }
    else cpUI.style.display = "none";
  });
  cpUI.querySelector("input")?.addEventListener("input", () => render(getState()));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && getState().ui.commandPaletteOpen) { closeModal(); import('./state.js?v=1774726033.62067').then(m => m.toggleCommandPalette()); }
  });

  mountGlobalClickDelegation();  // NUCLEAR: catches ALL clicks via delegation
  mountQuickAdd();
  mountAppEvents();
  setupKeyboardShortcuts();
  subscribe(render);
  console.log('[Aura] Bootstrap complete. All handlers mounted via delegation.');

  window.addEventListener("aura-navigate", (e) => navigate(e.detail, true));

  const path = window.location.pathname;
  if (ROUTES.includes(path)) setRoute(path);
  else { setRoute("/"); try { history.replaceState({ route: "/" }, "", "/"); } catch (e) {} }
}

bootstrap();
