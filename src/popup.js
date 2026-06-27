document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("shortcut-form");
  const keywordInput = document.getElementById("keyword");
  const displayNameInput = document.getElementById("display-name");
  const typeRadios = document.getElementsByName("shortcut-type");
  const urlFields = document.getElementById("url-fields");
  const toolFields = document.getElementById("tool-fields");
  const searchUrlInput = document.getElementById("search-url");
  const defaultUrlInput = document.getElementById("default-url");
  const toolSelect = document.getElementById("tool-select");
  const shortcutsList = document.getElementById("shortcuts-list");
  const shortcutCount = document.getElementById("shortcut-count");
  const resetBtn = document.getElementById("reset-defaults");

  let activeShortcuts = [];

  // Toggle fields based on type
  typeRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      const type = e.target.value;
      
      // Update radio button active label styles
      document.querySelectorAll(".type-option").forEach(label => {
        label.classList.remove("active");
      });
      e.target.closest(".type-option").classList.add("active");

      if (type === "url") {
        urlFields.classList.remove("hidden");
        toolFields.classList.add("hidden");
        searchUrlInput.setAttribute("required", "required");
      } else {
        urlFields.classList.add("hidden");
        toolFields.classList.remove("hidden");
        searchUrlInput.removeAttribute("required");
      }
    });
  });

  // Load shortcuts from storage
  function loadShortcuts() {
    chrome.storage.local.get({ shortcuts: DEFAULT_SHORTCUTS }, (result) => {
      activeShortcuts = result.shortcuts;
      renderShortcuts();
    });
  }

  // Render list of shortcuts
  function renderShortcuts() {
    shortcutsList.innerHTML = "";
    shortcutCount.textContent = activeShortcuts.length;

    if (activeShortcuts.length === 0) {
      shortcutsList.innerHTML = `
        <div class="empty-state">
          <p>No shortcuts configured yet.</p>
        </div>
      `;
      return;
    }

    activeShortcuts.forEach((shortcut, index) => {
      const item = document.createElement("div");
      item.className = "shortcut-item";

      const info = document.createElement("div");
      info.className = "shortcut-info";

      const titleRow = document.createElement("div");
      titleRow.className = "shortcut-title-row";

      const kwBadge = document.createElement("span");
      kwBadge.className = "shortcut-kw";
      kwBadge.textContent = shortcut.keyword;

      const name = document.createElement("span");
      name.className = "shortcut-name";
      name.textContent = shortcut.displayName;

      const typeTag = document.createElement("span");
      typeTag.className = `type-tag tag-${shortcut.type}`;
      typeTag.textContent = shortcut.type === "url" ? "URL" : "Tool";

      titleRow.appendChild(kwBadge);
      titleRow.appendChild(name);
      titleRow.appendChild(typeTag);

      const detail = document.createElement("div");
      detail.className = "shortcut-detail";
      if (shortcut.type === "url") {
        if (shortcut.defaultUrl) {
          detail.textContent = `${shortcut.url} (Fallback: ${shortcut.defaultUrl})`;
        } else {
          detail.textContent = shortcut.url;
        }
        detail.title = `Search URL: ${shortcut.url}${shortcut.defaultUrl ? '\nDefault URL: ' + shortcut.defaultUrl : ''}`;
      } else {
        detail.textContent = `Tool Bank: ${shortcut.toolId}`;
        detail.title = `Tool ID: ${shortcut.toolId}`;
      }

      info.appendChild(titleRow);
      info.appendChild(detail);

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.title = "Delete Shortcut";
      deleteBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
      `;
      deleteBtn.addEventListener("click", () => {
        deleteShortcut(index);
      });

      item.appendChild(info);
      item.appendChild(deleteBtn);
      shortcutsList.appendChild(item);
    });
  }

  // Add new shortcut
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const keyword = keywordInput.value.trim().toLowerCase();
    const displayName = displayNameInput.value.trim();
    const type = document.querySelector('input[name="shortcut-type"]:checked').value;

    // Validation: duplicate keyword
    if (activeShortcuts.some(s => s.keyword === keyword)) {
      alert(`The keyword "${keyword}" is already in use.`);
      return;
    }

    const newShortcut = {
      keyword,
      displayName,
      type
    };

    if (type === "url") {
      const searchUrl = searchUrlInput.value.trim();
      const defaultUrl = defaultUrlInput.value.trim();

      if (!searchUrl.includes("{query}")) {
        alert("The Search URL Pattern must contain '{query}' where the search term will go.");
        return;
      }

      newShortcut.url = searchUrl;
      if (defaultUrl) {
        newShortcut.defaultUrl = defaultUrl;
      }
    } else {
      newShortcut.toolId = toolSelect.value;
    }

    activeShortcuts.push(newShortcut);
    chrome.storage.local.set({ shortcuts: activeShortcuts }, () => {
      renderShortcuts();
      form.reset();
      
      // Reset visible states
      document.querySelector('input[name="shortcut-type"][value="url"]').click();
    });
  });

  // Delete shortcut
  function deleteShortcut(index) {
    activeShortcuts.splice(index, 1);
    chrome.storage.local.set({ shortcuts: activeShortcuts }, () => {
      renderShortcuts();
    });
  }

  // Reset defaults
  resetBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all shortcuts to the defaults? This will erase your custom shortcuts.")) {
      chrome.storage.local.set({ shortcuts: DEFAULT_SHORTCUTS }, () => {
        loadShortcuts();
      });
    }
  });

  // Initial load
  loadShortcuts();
});
