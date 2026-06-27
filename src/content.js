(function() {
  const hash = window.location.hash;
  if (!hash) return;

  const params = new URLSearchParams(hash.substring(1));
  const query = params.get('goto-q');
  if (!query) return;

  // Clean the hash parameters from the browser address bar immediately
  const cleanHash = hash.replace(/goto-q=[^&]*(&|$)/, '').replace(/#&/, '#').replace(/#$/, '');
  window.history.replaceState(
    null, 
    document.title, 
    window.location.pathname + window.location.search + cleanHash
  );

  // Poll for the input textbox element
  const interval = setInterval(() => {
    let inputEl = null;
    const hostname = window.location.hostname;

    if (hostname.includes('gemini.google.com')) {
      inputEl = document.querySelector('div[contenteditable="true"]');
    } else if (hostname.includes('chatgpt.com')) {
      inputEl = document.querySelector('#prompt-textarea');
    } else if (hostname.includes('claude.ai')) {
      inputEl = document.querySelector('div[contenteditable="true"]');
    }

    if (inputEl) {
      clearInterval(interval);
      inputEl.focus();

      // Write text based on whether it is contenteditable or a standard textarea/input
      if (inputEl.getAttribute('contenteditable') === 'true') {
        inputEl.textContent = query;
      } else {
        inputEl.value = query;
      }

      // Dispatch 'input' and 'change' events to trigger framework state updates
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));

      // Position caret at the end of the text
      try {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(inputEl);
        range.collapse(false); // collapse range to the end
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (err) {
        console.error('GoTo Extension: Failed to position caret', err);
      }
    }
  }, 100);

  // Stop polling after 10 seconds to save resources if layout changes
  setTimeout(() => clearInterval(interval), 10000);
})();
