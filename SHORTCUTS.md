# ⌨️ Keyboard Shortcuts Reference

## Navigation
| Shortcut | Action | Category |
|----------|--------|----------|
| **Cmd+1** | Go to Dashboard | Navigation |
| **Cmd+2** | Go to Recipe Editor | Navigation |
| **Cmd+3** | Go to Weekly Planner | Navigation |
| **Cmd+4** | Go to Analytics | Navigation |
| **Cmd+K** | Open Command Palette | Navigation |

## Appearance
| Shortcut | Action | Category |
|----------|--------|----------|
| **Cmd+Shift+L** | Toggle Dark/Light Theme | Appearance |

## Training & Macros
| Shortcut | Action | Targets | Category |
|----------|--------|---------|----------|
| **Cmd+M** | Set Training: Moderate | 2500 cal | Training |
| **Cmd+H** | Set Training: High | 3200 cal | Training |
| **Cmd+P** | Set Training: Peak | 4000 cal | Training |

> **Note**: Set training: Low is available via Command Palette → "training" → "low"

## Data Management
| Shortcut | Action | Category |
|----------|--------|----------|
| **Cmd+Shift+S** | Download Backup | Data |

## General
| Shortcut | Action | Works In |
|----------|--------|----------|
| **Escape** | Close modal/palette | Anywhere |
| **Enter** | Execute command | Command Palette |
| **↑ ↓** | Navigate in palette | Command Palette |

---

## Command Palette Guide

### What is the Command Palette?
A powerful search interface to execute app actions without menus.

### How to Use
1. Press **Cmd+K** (or Ctrl+K on Windows/Linux)
2. Type to search (e.g., "set training", "dashboard", "import")
3. Press **Enter** or click to execute
4. View all shortcuts in the palette

### Example Searches
- `dashboard` → Go to Dashboard
- `planner` → Go to Weekly Planner
- `training` → View all training commands
- `theme` → Toggle theme
- `backup` → Download backup
- `import` → Open import dialog
- `reset` → Reset all data (⚠️)

---

## Tips & Tricks

### Power User Workflow
```
1. Cmd+K                           # Open palette
2. Type "recipes"                  # Search
3. Press Enter                     # Navigate to recipes
4. Create new recipe
5. Cmd+3                           # Jump to planner
6. Drag recipe to Monday
7. Cmd+4                           # Check analytics
```

### Create a Meal Plan in 30 Seconds
```
1. Cmd+M                           # Set moderate intensity
2. Cmd+3                           # Open planner
3. Drag recipes from sidebar to days
4. View macros update in real-time
```

### Backup Your Data
```
1. Cmd+Shift+S                     # Download backup
2. Save JSON file safely
3. Later: Sidebar → Import Recipes → Select the JSON
```

### Explore Features
```
1. Cmd+K                           # Open Command Palette
2. See all available commands
3. Sorted by category
4. Each shows shortcut if exists
```

---

## Advanced Workflows

### Mobile (no keyboard)
- Use sidebar navigation buttons
- Long-press for context menus
- Tap buttons labeled with actions

### Recipe Management
| Task | How |
|------|-----|
| Create | Go to Recipe Editor → Fill form |
| Edit | Click recipe name in library |
| Duplicate | Click Duplicate button |
| Delete | Click Delete button (⚠️) |
| Search | Type in search box, debounced |

### Weekly Planning
| Task | How |
|------|-----|
| Add meal | Drag from library sidebar to day |
| Move meal | Drag between day columns |
| Reorder | Drag within same column |
| Remove | Click 'x' button on meal card |

### Training Intensity

Affects:
- Daily calorie target
- Smart Assistant recommendations
- Macro ratios suggested

Levels:
| Level | Calories | Use Case |
|-------|----------|----------|
| Low | 2000 | Rest days, cutting |
| Moderate | 2500 | Regular training |
| High | 3200 | Heavy lifting days |
| Peak | 4000 | Competition prep |

---

## Troubleshooting Keyboard Shortcuts

**Shortcuts not working?**
- Ensure focus is not in an input field
- Some browsers (Safari) use different modifier keys
- Try **Ctrl** instead of **Cmd** on Windows/Linux

**Command Palette won't open?**
- Check browser console for errors (F12)
- Ensure JavaScript is enabled
- Try refreshing the page

**Theme toggle stuck?**
- Clear browser cache
- Check if localStorage is enabled
- Try a different browser

---

## Browser Compatibility

| Browser | Cmd+K | Shortcuts | PWA |
|---------|-------|-----------|-----|
| Chrome | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ |
| Safari | ⚠️* | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ |
| Mobile (Chrome) | ❌** | Via UI | ✅ |

*Safari: Use Cmd instead of Ctrl
**Mobile: No keyboard, use touch UI

---

## Customizing Shortcuts

### Add a New Shortcut
Edit `js/commands.js`:

```javascript
{
  id: "my-command",
  label: "My Custom Command",
  category: "Custom",
  shortcut: "Cmd+Shift+X",
  action: () => {
    // Your code here
    addNotification("My command ran!", "success");
  }
}
```

Then restart the app.

---

## Hidden Features

🔓 **Easter Eggs**
- View source for all view rendering logic
- Check localStorage for exported schemas
- Inspect design tokens in variables.css

---

**Last Updated**: March 2026
**Version**: 1.0
**Status**: Stable, Production Ready
