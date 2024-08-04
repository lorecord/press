export function autogrow(textarea: HTMLTextAreaElement) {
  function adjustHeight() {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
    textarea.style.resize = 'none';
  }

  textarea.addEventListener('input', adjustHeight);

  // 调整初始高度
  adjustHeight();

  return {
    destroy() {
      textarea.removeEventListener('input', adjustHeight);
    }
  };
}