export function autogrow(textarea: HTMLTextAreaElement) {
  let originalStyleResize = textarea.style.resize;
  let originalHeight = textarea.style.height;
  textarea.style.resize = 'none';

  function adjustHeight() {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  textarea.addEventListener('input', adjustHeight);
  // it will catch when `textarea.value = 'new value'`
  textarea.addEventListener('change', adjustHeight);

  adjustHeight();

  return {
    destroy() {
      textarea.removeEventListener('input', adjustHeight);
      textarea.removeEventListener('change', adjustHeight);
      textarea.style.resize = originalStyleResize;
      textarea.style.height = originalHeight;
    }
  };
}