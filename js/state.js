const STORAGE_KEY = "aura-workspace-state-v3";
const BACKUP_PREFIX = "aura-backup-";
const TRAINING_KEY = "aura-training-intensity";

export const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];

// Built-in recipe database for quick start
export const RECIPE_DATABASE = [
  {
    name: "Grilled Chicken Breast",
    tags: "protein, cutting, post-workout",
    notes: "Lean protein powerhouse. ~31g protein per 100g",
    ingredients: [
      { name: "Chicken Breast", grams: 200, caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatsPer100g: 3.6 }
    ]
  },
  {
    name: "Brown Rice & Veggies",
    tags: "carbs, bulking, fiber",
    notes: "Clean carbs + micronutrients",
    ingredients: [
      { name: "Brown Rice (cooked)", grams: 150, caloriesPer100g: 111, proteinPer100g: 2.6, carbsPer100g: 23, fatsPer100g: 0.9 },
      { name: "Broccoli", grams: 100, caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatsPer100g: 0.4 }
    ]
  },
  {
    name: "Greek Yogurt & Granola",
    tags: "protein, breakfast, calcium",
    notes: "Probiotics + protein combo",
    ingredients: [
      { name: "Greek Yogurt", grams: 200, caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.3, fatsPer100g: 0.4 },
      { name: "Granola", grams: 40, caloriesPer100g: 471, proteinPer100g: 11, carbsPer100g: 63, fatsPer100g: 21 }
    ]
  },
  {
    name: "Salmon & Sweet Potato",
    tags: "omega3, bulking, vitamins",
    notes: "Healthy fats + clean carbs",
    ingredients: [
      { name: "Salmon", grams: 150, caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatsPer100g: 13 },
      { name: "Sweet Potato (baked)", grams: 150, caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatsPer100g: 0.1 }
    ]
  },
  {
    name: "Protein Shake",
    tags: "protein, quick, post-workout",
    notes: "Fast absorption post-training",
    ingredients: [
      { name: "Whey Protein Powder", grams: 30, caloriesPer100g: 400, proteinPer100g: 80, carbsPer100g: 5, fatsPer100g: 2 },
      { name: "Banana", grams: 100, caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatsPer100g: 0.3 }
    ]
  },
  {
    name: "Egg White Omelette",
    tags: "protein, breakfast, lean",
    notes: "Pure protein, minimal fat",
    ingredients: [
      { name: "Egg Whites", grams: 240, caloriesPer100g: 17, proteinPer100g: 3.6, carbsPer100g: 0.7, fatsPer100g: 0.1 },
      { name: "Spinach", grams: 50, caloriesPer100g: 23, proteinPer100g: 2.7, carbsPer100g: 3.6, fatsPer100g: 0.4 }
    ]
  },
  {
    name: "Tuna Salad",
    tags: "protein, cutting, omega3",
    notes: "Zero carb protein bomb",
    ingredients: [
      { name: "Canned Tuna", grams: 142, caloriesPer100g: 129, proteinPer100g: 26, carbsPer100g: 0, fatsPer100g: 1.3 },
      { name: "Mixed Greens", grams: 100, caloriesPer100g: 15, proteinPer100g: 1.2, carbsPer100g: 2.9, fatsPer100g: 0.2 }
    ]
  },
  {
    name: "Oats with Berries",
    tags: "carbs, breakfast, antioxidants",
    notes: "Slow digestion carbs + fiber",
    ingredients: [
      { name: "Oats (dry)", grams: 50, caloriesPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatsPer100g: 6.9 },
      { name: "Blueberries", grams: 100, caloriesPer100g: 57, proteinPer100g: 0.7, carbsPer100g: 14, fatsPer100g: 0.3 }
    ]
  },
  {
    name: "Lean Ground Turkey",
    tags: "protein, bulking, macro-friendly",
    notes: "93/7 lean. 28g protein per 100g",
    ingredients: [
      { name: "Ground Turkey (93% lean)", grams: 200, caloriesPer100g: 170, proteinPer100g: 28, carbsPer100g: 0, fatsPer100g: 7.4 }
    ]
  },
  {
    name: "Cottage Cheese Parfait",
    tags: "protein, bedtime, slow-release",
    notes: "Casein protein for overnight",
    ingredients: [
      { name: "Cottage Cheese", grams: 250, caloriesPer100g: 98, proteinPer100g: 11, carbsPer100g: 3.4, fatsPer100g: 5.3 },
      { name: "Almonds", grams: 30, caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatsPer100g: 50 }
    ]
  }
];

const listeners = new Set();
let state = load();

function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekKey() {
  const now = new Date();
  const year = now.getFullYear();
  const weekNum = Math.ceil((( now - new Date(year, 0, 1)) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7);
  return `${year}-w${weekNum}`;
}

function createIngredient(seed = {}) {
  return {
    id: seed.id || uid("ing"),
    name: seed.name || "",
    grams: Number(seed.grams || 100),
    caloriesPer100g: Number(seed.caloriesPer100g || 0),
    proteinPer100g: Number(seed.proteinPer100g || 0),
    carbsPer100g: Number(seed.carbsPer100g || 0),
    fatsPer100g: Number(seed.fatsPer100g || 0)
  };
}

function createDraftRecipe(seed = {}) {
  const incomingIngredients = Array.isArray(seed.ingredients) ? seed.ingredients : [];
  return {
    id: seed.id || null,
    name: seed.name || "",
    servings: Number(seed.servings || 1),
    tags: seed.tags || "",
    notes: seed.notes || "",
    ingredients:
      incomingIngredients.length > 0
        ? incomingIngredients.map((item) => createIngredient(item))
        : [createIngredient()]
  };
}

function createTrainingProfile() {
  return {
    intensity: "moderate", // "low", "moderate", "high", "peak"
    lastUpdated: Date.now(),
    weekHistory: []
  };
}

function createBaseState() {
  const planner = DAYS.reduce((acc, day) => {
    acc[day] = [];
    return acc;
  }, {});

  return {
    route: "/",
    theme: "dark",
    searchQuery: "",
    recipes: [],
    planner,
    draftRecipe: createDraftRecipe(),
    ui: {
      activeRecipeId: null,
      modalOpen: null,
      notifications: [],
      commandPaletteOpen: false,
      introComplete: false,
      hudVisible: false
    },
    dailyChecklist: {
      dateKey: todayKey(),
      items: {
        water: false,
        multivitamin: false,
        fishOil: false,
        fiber: false
      }
    },
    training: createTrainingProfile(),
    versionHistory: [],
    stats: {
      totalRecipes: 0,
      planDaysCompleted: 0,
      mealsLogged: 0,
      lastBackupDate: null
    }
  };
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeLoadedState(parsed) {
  const fresh = createBaseState();
  const draftRecipe = createDraftRecipe(parsed?.draftRecipe || {});
  const recipes = Array.isArray(parsed?.recipes)
    ? parsed.recipes.map((recipe) => {
        const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
        return {
          id: recipe.id || uid("recipe"),
          name: recipe.name || "Untitled Recipe",
          servings: Number(recipe.servings || 1),
          tags: recipe.tags || "",
          notes: recipe.notes || "",
          createdAt: recipe.createdAt || Date.now(),
          ingredients: ingredients.length > 0 ? ingredients.map((item) => createIngredient(item)) : []
        };
      })
    : [];

  const planner = DAYS.reduce((acc, day) => {
    const raw = parsed?.planner?.[day];
    acc[day] = Array.isArray(raw) ? raw.filter((item) => typeof item === "string") : [];
    return acc;
  }, {});

  const merged = {
    ...fresh,
    ...parsed,
    route: typeof parsed?.route === "string" ? parsed.route : fresh.route,
    theme: parsed?.theme === "light" ? "light" : "dark",
    searchQuery: typeof parsed?.searchQuery === "string" ? parsed.searchQuery : "",
    recipes,
    planner,
    draftRecipe,
    ui: {
      activeRecipeId: parsed?.ui?.activeRecipeId || null,
      modalOpen: parsed?.ui?.modalOpen || null,
      notifications: Array.isArray(parsed?.ui?.notifications) ? parsed.ui.notifications : [],
      commandPaletteOpen: !!parsed?.ui?.commandPaletteOpen,
      introComplete: !!parsed?.ui?.introComplete,
      hudVisible: !!parsed?.ui?.hudVisible
    },
    dailyChecklist: {
      dateKey: parsed?.dailyChecklist?.dateKey || todayKey(),
      items: {
        ...fresh.dailyChecklist.items,
        ...parsed?.dailyChecklist?.items
      }
    }
  };

  if (merged.dailyChecklist.dateKey !== todayKey()) {
    merged.dailyChecklist = {
      dateKey: todayKey(),
      items: { ...fresh.dailyChecklist.items }
    };
  }

  return merged;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createBaseState();
    }
    return normalizeLoadedState(JSON.parse(raw));
  } catch {
    return createBaseState();
  }
}

function persist(nextState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function notify() {
  listeners.forEach((fn) => fn(state));
}

function commit(nextState) {
  state = nextState;
  persist(state);
  notify();
}

function numberSafe(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function findRecipeById(recipeId) {
  return state.recipes.find((recipe) => recipe.id === recipeId);
}

export function getState() {
  return state;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setRoute(route) {
  commit({ ...state, route });
}

export function toggleTheme() {
  const theme = state.theme === "dark" ? "light" : "dark";
  commit({ ...state, theme });
}

export function setIntroComplete(done) {
  commit({
    ...state,
    ui: {
      ...state.ui,
      introComplete: !!done
    }
  });
}

export function setHudVisible(flag) {
  commit({
    ...state,
    ui: {
      ...state.ui,
      hudVisible: !!flag
    }
  });
}

export function toggleHudVisible() {
  setHudVisible(!state.ui.hudVisible);
}

export function setSearchQuery(query) {
  commit({ ...state, searchQuery: query });
}

export function updateDraftField(field, value) {
  const nextDraft = { ...state.draftRecipe, [field]: value };
  commit({ ...state, draftRecipe: nextDraft });
}

export function addDraftIngredient(seed = {}) {
  const nextDraft = {
    ...state.draftRecipe,
    ingredients: [...state.draftRecipe.ingredients, createIngredient(seed)]
  };
  commit({ ...state, draftRecipe: nextDraft });
}

export function removeDraftIngredient(ingredientId) {
  const ingredients = state.draftRecipe.ingredients.filter((item) => item.id !== ingredientId);
  const nextDraft = {
    ...state.draftRecipe,
    ingredients: ingredients.length > 0 ? ingredients : [createIngredient()]
  };
  commit({ ...state, draftRecipe: nextDraft });
}

export function updateDraftIngredient(ingredientId, field, value) {
  const numericFields = [
    "grams",
    "caloriesPer100g",
    "proteinPer100g",
    "carbsPer100g",
    "fatsPer100g"
  ];

  const ingredients = state.draftRecipe.ingredients.map((item) => {
    if (item.id !== ingredientId) {
      return item;
    }
    return {
      ...item,
      [field]: numericFields.includes(field) ? numberSafe(value) : value
    };
  });

  commit({
    ...state,
    draftRecipe: {
      ...state.draftRecipe,
      ingredients
    }
  });
}

export function resetDraftRecipe() {
  commit({
    ...state,
    draftRecipe: createDraftRecipe(),
    ui: {
      ...state.ui,
      activeRecipeId: null
    }
  });
}

export function loadRecipeIntoDraft(recipeId) {
  const recipe = findRecipeById(recipeId);
  if (!recipe) {
    return;
  }

  commit({
    ...state,
    route: "/recipe-editor",
    draftRecipe: createDraftRecipe(recipe),
    ui: {
      ...state.ui,
      activeRecipeId: recipeId
    }
  });
}

export function saveDraftRecipe() {
  const draft = state.draftRecipe;
  const cleanedName = draft.name.trim();
  const cleanedIngredients = draft.ingredients
    .map((item) => ({ ...item, name: item.name.trim() }))
    .filter((item) => item.name.length > 0);

  if (!cleanedName || cleanedIngredients.length === 0) {
    return { ok: false, error: "Recipe name and at least one ingredient are required." };
  }

  const targetId = draft.id || uid("recipe");
  const recipePayload = {
    id: targetId,
    name: cleanedName,
    servings: Number(draft.servings || 1),
    tags: draft.tags.trim(),
    notes: draft.notes.trim(),
    createdAt: draft.id ? (findRecipeById(draft.id)?.createdAt || Date.now()) : Date.now(),
    ingredients: cleanedIngredients.map((item) => createIngredient(item))
  };

  const exists = state.recipes.some((item) => item.id === targetId);
  const recipes = exists
    ? state.recipes.map((item) => (item.id === targetId ? recipePayload : item))
    : [recipePayload, ...state.recipes];

  commit({
    ...state,
    recipes,
    draftRecipe: createDraftRecipe(recipePayload),
    ui: {
      ...state.ui,
      activeRecipeId: recipePayload.id
    }
  });

  return { ok: true, id: recipePayload.id };
}

export function duplicateRecipe(recipeId) {
  const recipe = findRecipeById(recipeId);
  if (!recipe) {
    return;
  }

  const duplicate = {
    ...deepClone(recipe),
    id: uid("recipe"),
    name: `${recipe.name} Copy`,
    createdAt: Date.now(),
    ingredients: recipe.ingredients.map((item) => ({ ...item, id: uid("ing") }))
  };

  commit({ ...state, recipes: [duplicate, ...state.recipes] });
}

export function deleteRecipe(recipeId) {
  const recipes = state.recipes.filter((recipe) => recipe.id !== recipeId);
  const planner = DAYS.reduce((acc, day) => {
    acc[day] = state.planner[day].filter((id) => id !== recipeId);
    return acc;
  }, {});
  const isActive = state.ui.activeRecipeId === recipeId;

  commit({
    ...state,
    recipes,
    planner,
    draftRecipe: isActive ? createDraftRecipe() : state.draftRecipe,
    ui: {
      ...state.ui,
      activeRecipeId: isActive ? null : state.ui.activeRecipeId
    }
  });
}

export function addRecipeToPlanner(day, recipeId) {
  if (!DAYS.includes(day)) {
    return;
  }
  if (!findRecipeById(recipeId)) {
    return;
  }
  const planner = {
    ...state.planner,
    [day]: [...state.planner[day], recipeId]
  };
  commit({ ...state, planner });
}

export function removePlannerItem(day, index) {
  if (!DAYS.includes(day)) {
    return;
  }
  const row = [...state.planner[day]];
  row.splice(index, 1);
  commit({
    ...state,
    planner: {
      ...state.planner,
      [day]: row
    }
  });
}

export function movePlannerItem(sourceDay, sourceIndex, targetDay, targetIndex) {
  if (!DAYS.includes(sourceDay) || !DAYS.includes(targetDay)) {
    return;
  }

  const sourceRow = [...state.planner[sourceDay]];
  const [moved] = sourceRow.splice(sourceIndex, 1);
  if (!moved) {
    return;
  }

  const targetRow = sourceDay === targetDay ? sourceRow : [...state.planner[targetDay]];
  const safeIndex = Number.isFinite(targetIndex)
    ? Math.max(0, Math.min(targetIndex, targetRow.length))
    : targetRow.length;

  targetRow.splice(safeIndex, 0, moved);

  const nextPlanner = { ...state.planner, [targetDay]: targetRow };
  if (sourceDay !== targetDay) {
    nextPlanner[sourceDay] = sourceRow;
  }

  commit({ ...state, planner: nextPlanner });
}

export function toggleChecklistItem(itemKey) {
  const current = !!state.dailyChecklist.items[itemKey];
  commit({
    ...state,
    dailyChecklist: {
      ...state.dailyChecklist,
      dateKey: todayKey(),
      items: {
        ...state.dailyChecklist.items,
        [itemKey]: !current
      }
    }
  });
}

export function refreshDailyChecklist() {
  if (state.dailyChecklist.dateKey === todayKey()) {
    return;
  }

  const fresh = createBaseState();
  commit({
    ...state,
    dailyChecklist: {
      dateKey: todayKey(),
      items: { ...fresh.dailyChecklist.items }
    }
  });
}

export function hardResetWorkspace() {
  const fresh = createBaseState();
  state = fresh;
  persist(state);
  notify();
}

export function getRecipeTotals(recipe) {
  return recipe.ingredients.reduce(
    (acc, ing) => {
      const factor = numberSafe(ing.grams) / 100;
      acc.calories += numberSafe(ing.caloriesPer100g) * factor;
      acc.protein += numberSafe(ing.proteinPer100g) * factor;
      acc.carbs += numberSafe(ing.carbsPer100g) * factor;
      acc.fats += numberSafe(ing.fatsPer100g) * factor;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
}

export function getDraftTotals() {
  return getRecipeTotals(state.draftRecipe);
}

export function getRecipeById(recipeId) {
  return findRecipeById(recipeId);
}

export function getFilteredRecipes() {
  const query = state.searchQuery.trim().toLowerCase();
  if (!query) {
    return state.recipes;
  }
  return state.recipes.filter((recipe) => {
    const haystack = `${recipe.name} ${recipe.tags} ${recipe.notes}`.toLowerCase();
    return haystack.includes(query);
  });
}

export function getPlannerTotals() {
  return DAYS.reduce(
    (acc, day) => {
      const ids = state.planner[day];
      ids.forEach((id) => {
        const recipe = findRecipeById(id);
        if (!recipe) {
          return;
        }
        const totals = getRecipeTotals(recipe);
        acc.meals += 1;
        acc.calories += totals.calories;
        acc.protein += totals.protein;
        acc.carbs += totals.carbs;
        acc.fats += totals.fats;
      });
      return acc;
    },
    { meals: 0, calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
}

// ===== TRAINING & AI SUGGESTIONS =====
export function setTrainingIntensity(intensity) {
  const valid = ["low", "moderate", "high", "peak"];
  if (!valid.includes(intensity)) return;
  commit({
    ...state,
    training: {
      ...state.training,
      intensity,
      lastUpdated: Date.now()
    }
  });
}

export function getMealSuggestions() {
  const totals = getPlannerTotals();
  const intensity = state.training.intensity;

  // Calorie targets per intensity level
  const targets = {
    low: 2000,
    moderate: 2500,
    high: 3200,
    peak: 4000
  };

  const target = targets[intensity] || 2500;
  const needed = Math.max(0, target - totals.calories);
  const proteinRatio = intensity === "peak" ? 0.4 : 0.35;

  return state.recipes.filter(recipe => {
    const totals = getRecipeTotals(recipe);
    if (totals.calories > needed * 1.2) return false;
    if (totals.protein / totals.calories < proteinRatio / 4) return false;
    return true;
  }).slice(0, 5);
}

// ===== NOTIFICATIONS =====
export function addNotification(message, type = "info", duration = 3000) {
  const id = uid("notif");
  const notification = { id, message, type };
  const newNotifications = [...state.ui.notifications, notification];
  commit({
    ...state,
    ui: { ...state.ui, notifications: newNotifications }
  });
  if (duration > 0) {
    setTimeout(() => removeNotification(id), duration);
  }
}

export function removeNotification(id) {
  const notifications = state.ui.notifications.filter(n => n.id !== id);
  commit({
    ...state,
    ui: { ...state.ui, notifications }
  });
}

// ===== MODAL MANAGEMENT =====
export function openModal(modalName) {
  commit({
    ...state,
    ui: { ...state.ui, modalOpen: modalName }
  });
}

export function closeModal() {
  commit({
    ...state,
    ui: { ...state.ui, modalOpen: null }
  });
}

export function toggleCommandPalette() {
  commit({
    ...state,
    ui: { ...state.ui, commandPaletteOpen: !state.ui.commandPaletteOpen }
  });
}

// ===== IMPORT / EXPORT & VERSIONING =====
export function exportWorkspace() {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    recipes: state.recipes,
    planner: state.planner,
    training: state.training,
    stats: state.stats
  };
  return JSON.stringify(backup, null, 2);
}

export function importWorkspace(jsonString) {
  try {
    const backup = JSON.parse(jsonString);
    if (!backup.version || !backup.recipes) {
      return { ok: false, error: "Invalid backup format" };
    }
    const newRecipes = Array.isArray(backup.recipes) ? backup.recipes : [];
    const newPlanner = backup.planner || state.planner;

    commit({
      ...state,
      recipes: newRecipes,
      planner: newPlanner,
      training: backup.training || state.training,
      stats: {
        ...state.stats,
        totalRecipes: newRecipes.length,
        lastBackupDate: Date.now()
      }
    });

    addNotification("Workspace imported successfully!", "success");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Failed to parse backup file" };
  }
}

export function createVersionSnapshot() {
  const snapshot = {
    timestamp: Date.now(),
    dateKey: todayKey(),
    recipes: deepClone(state.recipes),
    planner: deepClone(state.planner),
    stats: deepClone(state.stats)
  };
  const history = [snapshot, ...state.versionHistory].slice(0, 20);
  commit({
    ...state,
    versionHistory: history,
    stats: {
      ...state.stats,
      lastBackupDate: Date.now()
    }
  });
}

export function downloadBackup() {
  const data = exportWorkspace();
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aura-backup-${todayKey()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  addNotification("Backup downloaded!", "success");
}

// ===== BUILT-IN RECIPES =====
export function importBuiltInRecipes() {
  const newRecipes = RECIPE_DATABASE.map(seed => ({
    ...createDraftRecipe(seed),
    id: uid("recipe"),
    createdAt: Date.now()
  }));

  commit({
    ...state,
    recipes: [...newRecipes, ...state.recipes],
    stats: {
      ...state.stats,
      totalRecipes: state.recipes.length + newRecipes.length
    }
  });

  addNotification(`Added ${newRecipes.length} starter recipes!`, "success");
}

// ===== ANALYTICS & INSIGHTS =====
export function getWeeklyStats() {
  const totals = getPlannerTotals();
  const avgDaily = {
    calories: totals.calories / 7,
    protein: totals.protein / 7,
    carbs: totals.carbs / 7,
    fats: totals.fats / 7
  };
  return { ...totals, ...avgDaily };
}

export function getTopRecipesByProtein(limit = 5) {
  return state.recipes
    .map(r => ({ ...r, totals: getRecipeTotals(r) }))
    .sort((a, b) => b.totals.protein - a.totals.protein)
    .slice(0, limit);
}

export function getRecipesByTag(tag) {
  const lower = tag.toLowerCase();
  return state.recipes.filter(r =>
    r.tags.toLowerCase().includes(lower)
  );
}
