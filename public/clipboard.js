(function () {
  function textFromButton(button) {
    if (button.dataset.clipboardText) return button.dataset.clipboardText;
    if (!button.dataset.clipboardTarget) return "";
    const target = document.querySelector(button.dataset.clipboardTarget);
    if (!target) return "";
    if ("value" in target) return target.value;
    return target.textContent || "";
  }

  function fallbackCopy(text) {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "-1000px";
    field.style.left = "-1000px";
    document.body.appendChild(field);
    field.select();
    field.setSelectionRange(0, field.value.length);
    try {
      return document.execCommand("copy");
    } finally {
      document.body.removeChild(field);
    }
  }

  async function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return fallbackCopy(text);
  }

  function markCopied(button) {
    button.classList.add("text-(--color-success)", "border-(--color-success)");
    window.setTimeout(function () {
      button.classList.remove("text-(--color-success)", "border-(--color-success)");
    }, 1200);
  }

  document.addEventListener("click", async function (event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest(".copy-btn");
    if (!button) return;
    const text = textFromButton(button);
    if (!text) return;
    event.preventDefault();
    try {
      if (await copy(text)) markCopied(button);
    } catch {
      if (fallbackCopy(text)) markCopied(button);
    }
  });
})();
