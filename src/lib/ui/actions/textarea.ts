export function autogrow(textarea: HTMLTextAreaElement) {
  function adjustHeight() {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
    textarea.style.resize = 'none';
  }

  textarea.addEventListener('input', adjustHeight);
  // it will catch when  `textarea.value = 'new value'`
  textarea.addEventListener('change', adjustHeight);

  adjustHeight();

  return {
    destroy() {
      textarea.removeEventListener('input', adjustHeight);
      textarea.addEventListener('change', adjustHeight);
    }
  };
}