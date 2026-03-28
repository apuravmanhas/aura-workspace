import {
  DAYS,
  getDraftTotals,
  getFilteredRecipes,
  getMealSuggestions,
  getPlannerTotals,
  getRecipeById,
  getRecipeTotals,
  getState,
  getWeeklyStats,
  getTopRecipesByProtein
} from './state.js?v=1774726033.62067';
import { searchCommands, COMMANDS } from './commands.js?v=1774726033.62067';

const routeViews = {
  "/": renderDashboard,
  "/recipe-editor": renderRecipeEditor,
  "/meal-planner": renderMealPlanner,
  "/analytics": renderAnalytics,
  "/suggestions": renderSuggestions
};

export function renderRoute(root, route) {
  const view = routeViews[route] ?? renderNotFound;
  root.innerHTML = view(getState());
}

function fmt(value, unit = "") {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}${unit}`;
}

function renderDashboard(state) {
  const plannerTotals = getPlannerTotals();
  const checklist = state.dailyChecklist.items;
  const intensity = state.training.intensity;

  const checklistMarkup = Object.entries(checklist)
    .map(
      ([key, checked]) => `
      <label class="check-row">
        <input type="checkbox" data-action="toggle-check" data-key="${key}" ${checked ? "checked" : ""} />
        <span>${humanizeKey(key)}</span>
      </label>
    `
    )
    .join("");

  return `
    <section class="view stack">
      <header class="view-header">
        <h2>Command Dashboard</h2>
        <p>Local state, instant renders, zero reload workflow.</p>
      </header>

      <section class="stats-grid">
        <article class="stat-card">
          <h3>Recipes</h3>
          <p>${state.recipes.length}</p>
        </article>
        <article class="stat-card">
          <h3>Planned Meals</h3>
          <p>${plannerTotals.meals}</p>
        </article>
        <article class="stat-card">
          <h3>Week Calories</h3>
          <p>${fmt(plannerTotals.calories)}</p>
        </article>
        <article class="stat-card">
          <h3>Week Protein</h3>
          <p>${fmt(plannerTotals.protein, "g")}</p>
        </article>
      </section>

      <section class="two-col">
        <article class="panel">
          <h3>Training Intensity</h3>
          <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-2); margin-bottom: var(--space-3);">
            ${["low", "moderate", "high", "peak"].map(lvl => `
              <button type="button"
                class="ghost-button"
                data-action="set-intensity"
                data-intensity="${lvl}"
                style="padding: var(--space-3); text-align: center; ${intensity === lvl ? 'border-color: var(--color-accent); background: color-mix(in srgb, var(--color-accent) 12%, var(--color-surface-soft));' : ''}">
                ${humanizeKey(lvl)}
              </button>
            `).join('')}
          </div>
          <p style="color: var(--color-text-muted); font-size: var(--text-sm); margin: 0;">
            Current: <strong>${intensity.toUpperCase()}</strong>
          </p>
        </article>

        <article class="panel">
          <h3>Daily Checklist</h3>
          <div class="check-grid">
            ${checklistMarkup}
          </div>
        </article>
      </section>

      <section class="panel">
        <h3>Planner Snapshot</h3>
        <ul class="day-snapshot">
          ${DAYS.map((day) => `<li><span>${humanizeKey(day)}</span><strong>${state.planner[day].length}</strong></li>`).join("")}
        </ul>
      </section>
    </section>
  `;
}

function renderRecipeEditor(state) {
  const recipes = getFilteredRecipes();
  const draft = state.draftRecipe;
  const totals = getDraftTotals();

  const rows = draft.ingredients
    .map(
      (ing) => `
      <tr>
        <td>
          <input type="text" value="${escapeHtml(ing.name)}" data-ing-id="${ing.id}" data-ing-field="name" placeholder="Ingredient" />
        </td>
        <td><input type="number" min="0" step="1" value="${ing.grams}" data-ing-id="${ing.id}" data-ing-field="grams" /></td>
        <td><input type="number" min="0" step="1" value="${ing.caloriesPer100g}" data-ing-id="${ing.id}" data-ing-field="caloriesPer100g" /></td>
        <td><input type="number" min="0" step="0.1" value="${ing.proteinPer100g}" data-ing-id="${ing.id}" data-ing-field="proteinPer100g" /></td>
        <td><input type="number" min="0" step="0.1" value="${ing.carbsPer100g}" data-ing-id="${ing.id}" data-ing-field="carbsPer100g" /></td>
        <td><input type="number" min="0" step="0.1" value="${ing.fatsPer100g}" data-ing-id="${ing.id}" data-ing-field="fatsPer100g" /></td>
        <td>
          <button type="button" class="icon-btn" data-action="remove-ing" data-ing-id="${ing.id}">Remove</button>
        </td>
      </tr>
    `
    )
    .join("");

  return `
    <section class="view stack">
      <header class="view-header split">
        <div>
          <h2>Recipe Engineering Studio</h2>
          <p>Dynamic ingredients, live macro math, and local persistence.</p>
        </div>
        <div class="input-wrap">
          <input id="recipe-search" type="search" placeholder="Search recipes..." value="${escapeHtml(state.searchQuery)}" />
        </div>
      </header>

      <section class="editor-grid">
        <aside class="panel recipe-list-panel">
          <h3>Recipe Library (${recipes.length})</h3>
          <div class="recipe-list">
            ${renderRecipeList(recipes)}
          </div>
        </aside>

        <section class="panel">
          <form id="recipe-form" class="recipe-form">
            <div class="inline-fields">
              <label>
                Recipe Name
                <input type="text" data-draft-field="name" value="${escapeHtml(draft.name)}" placeholder="High Protein Bowl" required />
              </label>
              <label>
                Servings
                <input type="number" min="1" step="1" data-draft-field="servings" value="${draft.servings}" />
              </label>
            </div>

            <div class="inline-fields">
              <label>
                Tags
                <input type="text" data-draft-field="tags" value="${escapeHtml(draft.tags)}" placeholder="cutting, pre-workout" />
              </label>
            </div>

            <label>
              Notes
              <textarea rows="3" data-draft-field="notes" placeholder="Method, prep tips, timing...">${escapeHtml(draft.notes)}</textarea>
            </label>

            <div class="table-wrap">
              <table class="ingredient-table">
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>g</th>
                    <th>kcal/100g</th>
                    <th>P/100g</th>
                    <th>C/100g</th>
                    <th>F/100g</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>

            <div class="row-actions">
              <button type="button" data-action="add-ing">Add Ingredient</button>
              <button type="submit" data-action="save-recipe">Save Recipe</button>
              <button type="button" class="ghost-button" data-action="reset-draft">New Draft</button>
            </div>
          </form>

          <section class="macro-strip">
            <h3>Live Totals</h3>
            <div class="macro-pills">
              <span>Calories: <strong>${fmt(totals.calories)}</strong></span>
              <span>Protein: <strong>${fmt(totals.protein, "g")}</strong></span>
              <span>Carbs: <strong>${fmt(totals.carbs, "g")}</strong></span>
              <span>Fats: <strong>${fmt(totals.fats, "g")}</strong></span>
            </div>
          </section>
        </section>
      </section>
    </section>
  `;
}

function renderMealPlanner(state) {
  const recipes = getFilteredRecipes();

  return `
    <section class="view stack">
      <header class="view-header">
        <h2>Weekly Meal Planner</h2>
        <p>Drag recipes to any day column. Reorder planned meals with drag and drop.</p>
      </header>

      <section class="planner-layout">
        <aside class="panel planner-library">
          <h3>Draggable Recipe Cards</h3>
          <div class="recipe-library" id="planner-library">
            ${recipes
              .map((recipe) => {
                const totals = getRecipeTotals(recipe);
                return `
                <article class="recipe-card" draggable="true" data-drag-kind="recipe" data-recipe-id="${recipe.id}">
                  <h4>${escapeHtml(recipe.name)}</h4>
                  <p>${fmt(totals.calories)} kcal | ${fmt(totals.protein, "g")} protein</p>
                </article>
              `;
              })
              .join("")}
          </div>
        </aside>

        <section class="planner-board" id="planner-board">
          ${DAYS.map((day) => renderPlannerDay(day, state.planner[day])).join("")}
        </section>
      </section>
    </section>
  `;
}

function renderAnalytics(state) {
  const totals = getPlannerTotals();
  const weeklyStats = getWeeklyStats();
  const topRecipes = getTopRecipesByProtein(6);

  const recipeData = state.recipes
    .map((recipe) => {
      const recipeTotals = getRecipeTotals(recipe);
      return {
        id: recipe.id,
        name: recipe.name,
        calories: recipeTotals.calories,
        protein: recipeTotals.protein
      };
    })
    .sort((a, b) => b.protein - a.protein)
    .slice(0, 6);

  const maxProtein = Math.max(1, ...recipeData.map((item) => item.protein));
  const proteinRatio = totals.calories > 0 ? (totals.protein * 4 / totals.calories * 100) : 0;
  const carbRatio = totals.calories > 0 ? (totals.carbs * 4 / totals.calories * 100) : 0;
  const fatRatio = totals.calories > 0 ? (totals.fats * 9 / totals.calories * 100) : 0;

  return `
    <section class="view stack">
      <header class="view-header">
        <h2>Advanced Analytics</h2>
        <p>Performance insights and macro breakdown.</p>
      </header>

      <section class="stats-grid">
        <article class="stat-card"><h3>Total Meals Planned</h3><p>${totals.meals}</p></article>
        <article class="stat-card"><h3>Total Calories</h3><p>${fmt(totals.calories)}</p></article>
        <article class="stat-card"><h3>Total Protein</h3><p>${fmt(totals.protein, "g")}</p></article>
        <article class="stat-card"><h3>Total Carbs</h3><p>${fmt(totals.carbs, "g")}</p></article>
      </section>

      <section class="two-col">
        <article class="panel">
          <h3>Macro Breakdown (%)</h3>
          <dl class="macro-grid" style="gap: var(--space-4);">
            <div><dt>Protein</dt><dd>${fmt(proteinRatio, "%")}</dd></div>
            <div><dt>Carbs</dt><dd>${fmt(carbRatio, "%")}</dd></div>
            <div><dt>Fats</dt><dd>${fmt(fatRatio, "%")}</dd></div>
          </dl>
        </article>

        <article class="panel">
          <h3>Daily Averages</h3>
          <dl class="macro-grid" style="gap: var(--space-4);">
            <div><dt>Calories/day</dt><dd>${fmt(weeklyStats.calories, "kcal")}</dd></div>
            <div><dt>Protein/day</dt><dd>${fmt(weeklyStats.protein, "g")}</dd></div>
            <div><dt>Carbs/day</dt><dd>${fmt(weeklyStats.carbs, "g")}</dd></div>
          </dl>
        </article>
      </section>

      <section class="panel chart-panel">
        <h3>Top Protein Recipes</h3>
        <div class="chart-list">
          ${
            recipeData.length
              ? recipeData
                  .map(
                    (item) => `
                <div class="chart-row">
                  <span>${escapeHtml(item.name)}</span>
                  <div class="bar-wrap">
                    <div class="bar" style="width:${Math.max(8, (item.protein / maxProtein) * 100)}%"></div>
                  </div>
                  <strong>${fmt(item.protein, "g")}</strong>
                </div>
              `
                  )
                  .join("")
              : `<p class="muted">Create recipes first to unlock analytics.</p>`
          }
        </div>
      </section>
    </section>
  `;
}

function renderSuggestions(state) {
  const suggestions = getMealSuggestions();
  const intensity = state.training.intensity;
  const plannerTotals = getPlannerTotals();

  const targets = {
    low: 2000,
    moderate: 2500,
    high: 3200,
    peak: 4000
  };

  const target = targets[intensity] || 2500;
  const remaining = Math.max(0, target - plannerTotals.calories);

  return `
    <section class="view stack">
      <header class="view-header">
        <h2>Smart Meal Assistant</h2>
        <p>AI-powered suggestions based on your training intensity.</p>
      </header>

      <section class="two-col">
        <article class="panel">
          <h3>Training Level</h3>
          <p style="font-size: var(--text-lg); color: var(--color-accent); margin: var(--space-2) 0;">
            ${intensity.toUpperCase()}
          </p>
          <p style="color: var(--color-text-muted); font-size: var(--text-sm);">
            Daily target: <strong>${target} kcal</strong>
          </p>
          <div style="width: 100%; height: 8px; background: var(--color-bg-elevated); border-radius: 999px; margin-top: var(--space-2);">
            <div style="height: 100%; width: ${Math.min(100, (plannerTotals.calories / target) * 100)}%; background: linear-gradient(90deg, var(--color-accent-strong), var(--color-accent)); border-radius: inherit;"></div>
          </div>
          <p style="margin-top: var(--space-2); color: var(--color-text-muted); font-size: var(--text-sm);">
            ${fmt(plannerTotals.calories)} / ${target} kcal • ${fmt(remaining)} remaining
          </p>
        </article>

        <article class="panel">
          <h3>Quick Stats</h3>
          <dl class="macro-grid" style="gap: var(--space-3);">
            <div><dt>Current Protein</dt><dd>${fmt(plannerTotals.protein, "g")}</dd></div>
            <div><dt>Macros</dt><dd>${fmt(plannerTotals.carbs, "g")} C / ${fmt(plannerTotals.fats, "g")} F</dd></div>
            <div><dt>Meals Planned</dt><dd>${plannerTotals.meals}</dd></div>
          </dl>
        </article>
      </section>

      <section class="panel">
        <h3>Recommended Meals (${suggestions.length})</h3>
        <div style="display: grid; gap: var(--space-2);">
          ${
            suggestions.length
              ? suggestions.map(recipe => {
                  const totals = getRecipeTotals(recipe);
                  return `
                    <article style="border: var(--border-width) solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-3); background: color-mix(in srgb, var(--color-surface-soft) 35%, transparent); display: grid; gap: var(--space-2);">
                      <div style="display: flex; justify-content: space-between; align-items: start;">
                        <h4 style="margin: 0;">${escapeHtml(recipe.name)}</h4>
                        <button type="button" class="ghost-button" style="font-size: var(--text-xs);" data-action="add-to-planner" data-recipe-id="${recipe.id}">+ Add</button>
                      </div>
                      <p style="margin: 0; color: var(--color-text-muted); font-size: var(--text-sm);">${fmt(totals.calories)} kcal • ${fmt(totals.protein, "g")} protein</p>
                    </article>
                  `;
                }).join("")
              : `<p class="muted">No suggestions for current macros.</p>`
          }
        </div>
      </section>
    </section>
  `;
}

function renderNotFound() {
  return `
    <section class="view">
      <h2>View Not Found</h2>
      <p>Use the sidebar navigation to open an available screen.</p>
    </section>
  `;
}

function renderRecipeList(recipes) {
  if (recipes.length === 0) {
    return `<p class="muted">No recipes found.</p>`;
  }

  return recipes
    .map((recipe) => {
      const totals = getRecipeTotals(recipe);
      return `
      <article class="recipe-list-item">
        <button type="button" class="route-button" data-action="load-recipe" data-recipe-id="${recipe.id}">
          ${escapeHtml(recipe.name)}
        </button>
        <p>${fmt(totals.calories)} kcal | ${fmt(totals.protein, "g")} protein</p>
        <div class="mini-actions">
          <button type="button" class="ghost-button" data-action="duplicate-recipe" data-recipe-id="${recipe.id}">Duplicate</button>
          <button type="button" class="danger-button" data-action="delete-recipe" data-recipe-id="${recipe.id}">Delete</button>
        </div>
      </article>
    `;
    })
    .join("");
}

function renderPlannerDay(day, recipeIds) {
  const cards = recipeIds
    .map((recipeId, index) => {
      const recipe = getRecipeById(recipeId);
      if (!recipe) {
        return "";
      }
      return `
      <article class="planner-item" draggable="true" data-drag-kind="planned" data-day="${day}" data-index="${index}" data-recipe-id="${recipe.id}">
        <div>
          <h4>${escapeHtml(recipe.name)}</h4>
          <p>${fmt(getRecipeTotals(recipe).calories)} kcal</p>
        </div>
        <button type="button" class="icon-btn" data-action="remove-plan-item" data-day="${day}" data-index="${index}">x</button>
      </article>
    `;
    })
    .join("");

  return `
    <section class="planner-column" data-day="${day}">
      <header>
        <h3>${humanizeKey(day)}</h3>
        <span>${recipeIds.length}</span>
      </header>
      <div class="dropzone" data-drop-day="${day}">
        ${cards || `<p class="muted">Drop recipe here</p>`}
      </div>
    </section>
  `;
}

function humanizeKey(value) {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/([A-Z])/g, " $1");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
