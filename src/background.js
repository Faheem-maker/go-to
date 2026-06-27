// Helper function to escape special XML characters for omnibox descriptions.
function escapeXml(str) {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
}

// Helper to parse omnibox text into command and argument parts
function parseInput(text) {
  const trimmed = text.trim();
  const index = trimmed.indexOf(" ");
  if (index === -1) {
    return { cmd: trimmed.toLowerCase(), argsText: "" };
  }
  return {
    cmd: trimmed.substring(0, index).toLowerCase(),
    argsText: trimmed.substring(index + 1).trim()
  };
}

// Navigation utility wrapper supporting different target window/tab behaviors
function navigate(url, disposition) {
  if (!url) return;
  if (disposition === "currentTab") {
    chrome.tabs.update({ url: url });
  } else if (disposition === "newForegroundTab") {
    chrome.tabs.create({ url: url, active: true });
  } else if (disposition === "newBackgroundTab") {
    chrome.tabs.create({ url: url, active: false });
  }
}

importScripts("defaults.js");


// Active routing registry loaded dynamically from storage
const activeRoutes = {};

// Helper to construct routes in memory from storage objects
function buildRoutesFromShortcuts(shortcuts) {
  // Clear existing keys
  for (const key in activeRoutes) {
    delete activeRoutes[key];
  }

  // Populate active routes
  shortcuts.forEach(shortcut => {
    if (shortcut.type === "url") {
      activeRoutes[shortcut.keyword] = {
        displayName: shortcut.displayName,
        type: "redirect",
        description: `Search ${shortcut.displayName} for '%s'`,
        url: shortcut.url,
        defaultUrl: shortcut.defaultUrl
      };
    } else if (shortcut.type === "tool") {
      const tool = TOOL_BANK[shortcut.toolId];
      if (tool) {
        activeRoutes[shortcut.keyword] = {
          displayName: shortcut.displayName,
          type: "controller",
          description: tool.description,
          suggest: tool.suggest,
          handle: tool.handle
        };
      }
    }
  });
}

// Load configurations
function loadRoutes() {
  chrome.storage.local.get({ shortcuts: DEFAULT_SHORTCUTS }, (result) => {
    // Seed storage with defaults if not present
    chrome.storage.local.get("shortcuts", (data) => {
      if (!data.shortcuts) {
        chrome.storage.local.set({ shortcuts: DEFAULT_SHORTCUTS });
      }
    });
    buildRoutesFromShortcuts(result.shortcuts);
  });
}

// Initialize routes at startup
loadRoutes();

// Dynamically listen to configurations changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.shortcuts) {
    buildRoutesFromShortcuts(changes.shortcuts.newValue || []);
  }
});

// Listen for when the user types after the "go" keyword.
chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  const { cmd, argsText } = parseInput(text);
  const route = activeRoutes[cmd];

  if (route) {
    let desc = "";
    if (route.type === "redirect") {
      if (!argsText && route.defaultUrl) {
        desc = `Go to ${route.displayName} (${route.defaultUrl})`;
      } else {
        desc = route.description.replace("%s", argsText || "...");
      }
    } else if (route.type === "controller" && typeof route.suggest === "function") {
      desc = route.suggest(argsText);
    } else {
      desc = route.description || `Run command: ${cmd}`;
    }

    suggest([
      {
        content: text,
        description: escapeXml(desc)
      }
    ]);
  } else {
    const query = text.trim().toLowerCase();
    const suggestions = [];

    for (const [key, value] of Object.entries(activeRoutes)) {
      if (!query || key.startsWith(query)) {
        const displayName = value.displayName || key;
        const descriptionText = value.type === "redirect" 
          ? (value.description ? value.description.replace(" for '%s'", "") : "") 
          : value.description;
        
        suggestions.push({
          content: `${key} `,
          description: escapeXml(`${displayName} (${key}) - ${descriptionText}`)
        });
      }
    }

    suggest(suggestions);
  }
});

// Listen for when the user presses Enter in the omnibox.
chrome.omnibox.onInputEntered.addListener((text, disposition) => {
  const { cmd, argsText } = parseInput(text);
  const route = activeRoutes[cmd];

  if (route) {
    if (route.type === "redirect") {
      let url;
      if (!argsText && route.defaultUrl) {
        url = route.defaultUrl;
      } else {
        const query = encodeURIComponent(argsText);
        url = route.url.replace("{query}", query);
      }
      navigate(url, disposition);
    } else if (route.type === "controller" && typeof route.handle === "function") {
      route.handle(argsText, disposition);
    }
  } else {
    // Default fallback: Google Search
    const url = `https://www.google.com/search?q=${encodeURIComponent(text.trim())}`;
    navigate(url, disposition);
  }
});
