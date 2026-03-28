// Command Palette - Power user keyboard shortcuts and actions
import {
  addNotification,
  closeModal,
  downloadBackup,
  getState,
  hardResetWorkspace,
  importBuiltInRecipes,
  openModal,
  setRoute,
  setTrainingIntensity,
  toggleCommandPalette,
  toggleTheme
} from './state.js?v=1774726033.62067';

export const COMMANDS = [
  {
    id: "nav-dashboard",
    label: "Go to Dashboard",
    category: "Navigation",
    shortcut: "Cmd+1",
    action: () => setRoute("/")
  },
  {
    id: "nav-recipes",
    label: "Go to Recipe Editor",
    category: "Navigation",
    shortcut: "Cmd+2",
    action: () => setRoute("/recipe-editor")
  },
  {
    id: "nav-planner",
    label: "Go to Weekly Planner",
    category: "Navigation",
    shortcut: "Cmd+3",
    action: () => setRoute("/meal-planner")
  },
  {
    id: "nav-analytics",
    label: "Go to Analytics",
    category: "Navigation",
    shortcut: "Cmd+4",
    action: () => setRoute("/analytics")
  },
  {
    id: "toggle-theme",
    label: "Toggle Dark/Light Theme",
    category: "Appearance",
    shortcut: "Cmd+Shift+L",
    action: () => {
      toggleTheme();
      addNotification("Theme updated", "info", 1500);
    }
  },
  {
    id: "intensity-low",
    label: "Set Training: Low",
    category: "Training",
    shortcut: null,
    action: () => {
      setTrainingIntensity("low");
      addNotification("Training intensity: Low (2000 cal)", "info");
    }
  },
  {
    id: "intensity-moderate",
    label: "Set Training: Moderate",
    category: "Training",
    shortcut: "Cmd+M",
    action: () => {
      setTrainingIntensity("moderate");
      addNotification("Training intensity: Moderate (2500 cal)", "info");
    }
  },
  {
    id: "intensity-high",
    label: "Set Training: High",
    category: "Training",
    shortcut: "Cmd+H",
    action: () => {
      setTrainingIntensity("high");
      addNotification("Training intensity: High (3200 cal)", "info");
    }
  },
  {
    id: "intensity-peak",
    label: "Set Training: Peak",
    category: "Training",
    shortcut: "Cmd+P",
    action: () => {
      setTrainingIntensity("peak");
      addNotification("Training intensity: Peak (4000 cal)", "info");
    }
  },
  {
    id: "import-recipes",
    label: "Import Built-in Recipes",
    category: "Data",
    shortcut: null,
    action: () => {
      importBuiltInRecipes();
      closeModal();
    }
  },
  {
    id: "download-backup",
    label: "Download Backup",
    category: "Data",
    shortcut: "Cmd+Shift+S",
    action: () => downloadBackup()
  },
  {
    id: "open-import",
    label: "Import from File",
    category: "Data",
    shortcut: null,
    action: () => openModal("import-file")
  },
  {
    id: "hard-reset",
    label: "Reset All Data (⚠️)",
    category: "Danger",
    shortcut: null,
    action: () => {
      const approved = window.confirm("Permanently delete ALL recipes and plans?");
      if (approved) {
        hardResetWorkspace();
        addNotification("Workspace reset", "info");
      }
    }
  }
];

export function getCommandsByCategory() {
  const grouped = {};
  COMMANDS.forEach(cmd => {
    if (!grouped[cmd.category]) {
      grouped[cmd.category] = [];
    }
    grouped[cmd.category].push(cmd);
  });
  return grouped;
}

export function searchCommands(query) {
  const lower = query.toLowerCase();
  return COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(lower) ||
    cmd.category.toLowerCase().includes(lower)
  );
}

export function getCommandByShortcut(shortcut) {
  return COMMANDS.find(cmd => cmd.shortcut === shortcut);
}

export function normalizeShortcut(key, ctrl, shift, alt) {
  const parts = [];
  if (ctrl) parts.push("Cmd");
  if (shift) parts.push("Shift");
  if (alt) parts.push("Alt");
  parts.push(key.toUpperCase());
  return parts.join("+");
}

export function setupKeyboardShortcuts() {
  document.addEventListener("keydown", e => {
    // Cmd/Ctrl + K opens command palette
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      toggleCommandPalette();
      return;
    }

    // Only process shortcuts when command palette is not open
    if (getState().ui.commandPaletteOpen) return;

    const shortcut = normalizeShortcut(
      e.key,
      e.ctrlKey || e.metaKey,
      e.shiftKey,
      e.altKey
    );

    const cmd = getCommandByShortcut(shortcut);
    if (cmd) {
      e.preventDefault();
      cmd.action();
    }
  });
}
