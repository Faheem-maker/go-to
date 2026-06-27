// Default setup shortcuts list
const DEFAULT_SHORTCUTS = [
  {
    keyword: "yt",
    displayName: "YouTube",
    type: "url",
    url: "https://www.youtube.com/results?search_query={query}",
    defaultUrl: "https://www.youtube.com/"
  },
  {
    keyword: "gemini",
    displayName: "Gemini",
    type: "url",
    url: "https://gemini.google.com/#goto-q={query}",
    defaultUrl: "https://gemini.google.com/"
  },
  {
    keyword: "chatgpt",
    displayName: "ChatGPT",
    type: "url",
    url: "https://chatgpt.com/#goto-q={query}",
    defaultUrl: "https://chatgpt.com/"
  },
  {
    keyword: "claude",
    displayName: "Claude",
    type: "url",
    url: "https://claude.ai/#goto-q={query}",
    defaultUrl: "https://claude.ai/"
  },
  {
    keyword: "llm",
    displayName: "Compare LLMs",
    type: "tool",
    toolId: "compare_llm"
  }
];

// Built-in Tool Bank Registry
const TOOL_BANK = {
  compare_llm: {
    description: "Compare LLM models or search llm-stats",
    suggest: (argsText) => {
      const trimmed = argsText.trim();
      if (!trimmed) {
        return "Type: compare <modelA> vs <modelB>";
      }
      if (trimmed.startsWith("compare ")) {
        const comparePart = trimmed.substring(8).trim();
        const models = comparePart.split(/\s+vs\s+/i);
        if (models.length === 2 && models[1].trim()) {
          return `Compare LLM: ${models[0].trim()} vs ${models[1].trim()}`;
        }
        return `Compare LLM: ${models[0].trim()} vs [second model]`;
      }
      return `Search LLM Stats for: "${trimmed}"`;
    },
    handle: (argsText, disposition) => {
      const trimmed = argsText.trim();
      let url = "";
      if (trimmed.startsWith("compare ")) {
        const comparePart = trimmed.substring(8).trim();
        const models = comparePart.split(/\s+vs\s+/i);
        if (models.length === 2 && models[1].trim()) {
          const m1 = encodeURIComponent(models[0].trim());
          const m2 = encodeURIComponent(models[1].trim());
          url = `https://llm-stats.com/compare?modelA=${m1}&modelB=${m2}`;
        } else {
          url = `https://llm-stats.com/compare?modelA=${encodeURIComponent(comparePart)}`;
        }
      } else {
        url = `https://llm-stats.com/?q=${encodeURIComponent(trimmed)}`;
      }
      navigate(url, disposition);
    }
  }
};
