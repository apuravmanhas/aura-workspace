// Modal & Notification System
export function createModalSystem() {
  const modalContainer = document.createElement("div");
  modalContainer.id = "modal-container";
  modalContainer.className = "modal-container";
  modalContainer.style.display = "none";  // Hidden until a modal is opened
  document.body.appendChild(modalContainer);

  return {
    render(state) {
      if (!state.ui.modalOpen) {
        modalContainer.innerHTML = "";
        modalContainer.style.display = "none";  // CRITICAL: hide container so it doesn't eat clicks
        return;
      }

      modalContainer.style.display = "flex";  // Show container when modal is active

      const modal = renderModal(state);
      modalContainer.innerHTML = modal;

      // Setup modal event handlers
      const closeBtn = modalContainer.querySelector("[data-action='close-modal']");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          import('./state.js?v=1774726033.62067').then(m => m.closeModal());
        });
      }

      // Setup import file handler
      const fileInput = modalContainer.querySelector("#import-file-input");
      if (fileInput) {
        fileInput.addEventListener("change", async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const text = await file.text();
          import('./state.js?v=1774726033.62067').then(m => {
            const result = m.importWorkspace(text);
            if (result.ok) m.closeModal();
          });
        });
      }
    }
  };
}

function renderModal(state) {
  const modal = state.ui.modalOpen;

  if (modal === "import-file") {
    return `
      <div class="modal-backdrop" data-action="close-modal"></div>
      <div class="modal-dialog">
        <header class="modal-header">
          <h3>Import Workspace</h3>
          <button type="button" class="icon-btn" data-action="close-modal">✕</button>
        </header>
        <div class="modal-body">
          <p>Select a previously exported JSON backup file.</p>
          <input type="file" id="import-file-input" accept=".json" />
        </div>
      </div>
    `;
  }

  if (modal === "shortcuts") {
    return `
      <div class="modal-backdrop" data-action="close-modal"></div>
      <div class="modal-dialog modal-large">
        <header class="modal-header">
          <h3>Keyboard Shortcuts</h3>
          <button type="button" class="icon-btn" data-action="close-modal">✕</button>
        </header>
        <div class="modal-body">
          <div class="shortcuts-grid">
            <div class="shortcut-item">
              <code>Cmd+K</code><span>Open Command Palette</span>
            </div>
            <div class="shortcut-item">
              <code>Cmd+1</code><span>Dashboard</span>
            </div>
            <div class="shortcut-item">
              <code>Cmd+2</code><span>Recipe Editor</span>
            </div>
            <div class="shortcut-item">
              <code>Cmd+3</code><span>Weekly Planner</span>
            </div>
            <div class="shortcut-item">
              <code>Cmd+4</code><span>Analytics</span>
            </div>
            <div class="shortcut-item">
              <code>Cmd+M</code><span>Set Training: Moderate</span>
            </div>
            <div class="shortcut-item">
              <code>Cmd+H</code><span>Set Training: High</span>
            </div>
            <div class="shortcut-item">
              <code>Cmd+P</code><span>Set Training: Peak</span>
            </div>
            <div class="shortcut-item">
              <code>Cmd+Shift+L</code><span>Toggle Theme</span>
            </div>
            <div class="shortcut-item">
              <code>Cmd+Shift+S</code><span>Download Backup</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return "";
}

export function createNotificationSystem() {
  const container = document.createElement("div");
  container.id = "notification-container";
  container.className = "notification-container";
  document.body.appendChild(container);

  return {
    render(state) {
      const notifs = state.ui.notifications;
      container.innerHTML = notifs
        .map(n => `
          <div class="notification notification-${n.type}" role="alert">
            <span>${n.message}</span>
            <button type="button" class="icon-btn" data-notif-id="${n.id}">✕</button>
          </div>
        `)
        .join("");

      container.querySelectorAll("[data-notif-id]").forEach(btn => {
        btn.addEventListener("click", () => {
          import('./state.js?v=1774726033.62067').then(m =>
            m.removeNotification(btn.getAttribute("data-notif-id"))
          );
        });
      });
    }
  };
}
