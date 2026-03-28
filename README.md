# AURA -- Interactive 3D Web Workspace

AURA is a browser-based interactive 3D environment where users navigate a virtual world by driving a car to explore different application modules. Instead of traditional tab-based navigation, users physically drive between zones -- each zone representing a different feature of a health and meal planning dashboard.

The project runs entirely in the browser with no backend or server dependency. All user data is stored locally using the browser's localStorage API.

## Live Demo

🚀 **[Experience AURA Live Here](https://apuravmanhas.github.io/aura-workspace/)**

*(Note: The live demo runs entirely in your browser using WebGL and local storage. No installation required.)*

Alternatively, to run it locally, open `index.html` via a local server (required for ES module support). A simple PowerShell server is included -- just run `Start-Aura.bat` on Windows.

## Features

- Full 3D environment rendered with WebGL and Three.js
- Physics-based car movement powered by Cannon-es
- Five navigable zones: Dashboard, Recipe Editor, Weekly Planner, Analytics, and Smart Assistant
- Real-time car physics with acceleration, damping, and dust particle effects
- Post-processing pipeline with bloom glow and FXAA anti-aliasing
- Cinematic camera that follows the car with speed-dependent zoom
- Glassmorphism-styled HUD panels with full interactivity
- Recipe creation, ingredient tracking, and macro calculation
- Weekly meal planner with drag-and-drop scheduling
- Daily checklist and training intensity settings
- Command palette with keyboard shortcuts (Cmd+K / Ctrl+K)
- Minimap with real-time car position tracking
- Speed HUD displaying current velocity
- Zone entry detection with toast notifications
- Responsive layout that adapts to different screen sizes
- Dark and light theme support
- Full PWA support with offline capability
- Loading screen with animated car and progress indicators
- Zero build step -- runs directly from source using import maps

## Tech Stack

- **HTML5** -- Semantic structure with accessibility attributes
- **CSS3** -- Custom properties, CSS Grid, glassmorphism, keyframe animations
- **JavaScript (ES Modules)** -- Modular architecture with no bundler required
- **Three.js v0.160** -- 3D scene rendering, materials, lighting, post-processing
- **Cannon-es v0.20** -- Rigid body physics simulation
- **Web Audio API** -- Dynamic engine sound effects
- **Import Maps** -- Browser-native module resolution via esm.sh CDN

## Project Structure

```
aura-workspace/
  index.html          -- Main entry point
  manifest.json       -- PWA manifest
  sw.js               -- Service worker for offline support
  Start-Aura.bat      -- Windows launcher (starts local server + browser)
  server.ps1          -- PowerShell HTTP server script
  css/
    variables.css     -- Design tokens and CSS custom properties
    main.css          -- All component and layout styles
  js/
    app.js            -- Application bootstrap and event wiring
    state.js          -- Centralized state management with localStorage
    ui.js             -- Route-based view rendering
    engine3d.js       -- WebGL renderer, camera, lighting, post-processing
    environment.js    -- 3D world construction (terrain, roads, trees, zones)
    character.js      -- Car model, physics body, input handling, camera follow
    physics.js        -- Cannon-es world setup and sync
    sounds.js         -- Web Audio engine sound generation
    commands.js       -- Keyboard shortcut system and command palette
    modals.js         -- Modal dialog and notification system
```

## How It Works

The application initializes a Three.js scene with a ground plane, roads connecting five platform zones, trees, rocks, and floating particles. A physics-enabled car spawns at the center Dashboard zone. Users drive using WASD or arrow keys. The car interacts with a Cannon-es physics world for realistic movement and gravity.

Each zone is defined as a circular area on the ground. When the car enters a zone boundary, the system detects the overlap and triggers a navigation event, loading the corresponding dashboard view into the HUD panels.

The HUD uses a glassmorphism design system built entirely in vanilla CSS. It overlays the 3D canvas and can be toggled with the H key, allowing users to switch between full 3D exploration and detailed dashboard interaction.

State management follows a publish-subscribe pattern. All application data (recipes, planner, preferences) is serialized to localStorage on every change, providing persistence across sessions without any server.

## Controls

- **WASD / Arrow Keys** -- Drive the car
- **H** -- Toggle HUD visibility (must be on a platform zone)
- **Ctrl+K / Cmd+K** -- Open command palette
- **T** -- Toggle dark/light theme

## Running Locally

The project uses ES modules, which browsers restrict when loading from the file system. You need a local HTTP server:

**Option 1: Included launcher (Windows)**
```
Double-click Start-Aura.bat
```

**Option 2: Python**
```
python -m http.server 8080
```

**Option 3: Node.js**
```
npx serve .
```

Then open `http://localhost:8080` in your browser.

## Browser Support

Tested on Chrome, Edge, and Firefox. Requires WebGL 2.0 support. For the best experience, use a Chromium-based browser.

## Architecture Decisions

**No build step**: The project intentionally avoids webpack, vite, or any bundler. It uses browser-native import maps to resolve third-party modules from CDN. This keeps the project simple to understand and deploy -- just static files.

**Local-first data**: All state lives in localStorage. This eliminates server costs and complexity while providing instant read/write performance. The tradeoff is that data does not sync across devices.

**Physics-driven movement**: Rather than simple position tweening, the car uses a full rigid body simulation. This enables features like realistic deceleration, collision response, and gravity -- making the driving feel tangible.

**Event delegation**: All UI click handlers use document-level event delegation rather than direct element binding. This avoids stale reference issues caused by dynamic DOM re-renders.

## Future Considerations

- Backend integration with user accounts for cross-device data sync
- Multiplayer mode with shared 3D world
- Custom car skins and environment themes
- Mobile touch controls for driving
- Additional dashboard modules (workout tracker, hydration log)

## Author

Built by WuXin.

## License

This project is open source. Feel free to learn from it and build upon it.
