(() => {
  const editor = document.getElementById('editor');
  const preview = document.getElementById('preview');
  const autosaveStatus = document.getElementById('autosave-status');
  const fileInput = document.getElementById('file-input');
  const syncCheckbox = document.getElementById('sync-scroll');
  const uploadButton = document.getElementById('upload-button');
  const copyPreviewButton = document.getElementById('copy-preview');

  const STORAGE_KEY = 'markdown-studio-content';
  const THEME_KEY = 'markdown-studio-theme';
  const AUTOSAVE_DELAY = 400;
  const COPY_RESET_DELAY = 1500;

  const defaultMarkdown = `# Markdown Studio

Start writing on the left and watch your preview update in real time.

## Features
- Clean interface focused on writing and previewing
- Keyboard friendly (Markdown shortcuts still work!)
- Autosaves your progress to this browser
- Upload plain Markdown files to continue working
- Export Markdown or print to PDF when you're done
- Dark mode for those late night writing sessions

## Code highlighting
\`\`\`js
function greet(name) {
  return \`Hello, ${name}!\`;
}
\`\`\`

## Tables
| Syntax | Description |
| ------ | ----------- |
| Header | Title |
| Paragraph | Text |

> “Writing is easy. All you have to do is cross out the wrong words.” – Mark Twain
`;

  marked.use({
    breaks: true,
    highlight(code, lang) {
      if (lang && window.hljs.getLanguage(lang)) {
        return window.hljs.highlight(code, { language: lang }).value;
      }
      return window.hljs.highlightAuto(code).value;
    }
  });

  function render(value) {
    if (!value.trim()) {
      preview.innerHTML = '<div class="empty-state">Start by typing your Markdown on the left panel.</div>';
      return;
    }
    preview.innerHTML = marked.parse(value);
  }

  let saveTimeout;
  function scheduleSave() {
    autosaveStatus.textContent = 'Saving…';
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, editor.value);
        autosaveStatus.textContent = 'Saved';
      } catch (err) {
        console.warn('Autosave failed', err);
        autosaveStatus.textContent = 'Save failed';
      }
    }, AUTOSAVE_DELAY);
  }

  function loadContent() {
    const stored = localStorage.getItem(STORAGE_KEY);
    editor.value = stored ?? defaultMarkdown;
    render(editor.value);
  }

  function loadTheme() {
    const storedTheme = localStorage.getItem(THEME_KEY);
    if (storedTheme === 'dark') {
      document.body.classList.add('dark');
    }
  }

  function toggleTheme() {
    document.body.classList.toggle('dark');
    const mode = document.body.classList.contains('dark') ? 'dark' : 'light';
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch (err) {
      console.warn('Theme preference not saved', err);
    }
  }

  function surroundSelection(before, after = before, placeholder = 'text') {
    const { selectionStart, selectionEnd, value } = editor;
    const selected = value.slice(selectionStart, selectionEnd) || placeholder;
    const nextValue = value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd);
    const cursorStart = selectionStart + before.length;
    const cursorEnd = cursorStart + selected.length;
    editor.value = nextValue;
    editor.focus();
    editor.setSelectionRange(cursorStart, cursorEnd);
    editor.dispatchEvent(new Event('input'));
  }

  function prefixLines(prefix) {
    const { selectionStart, selectionEnd, value } = editor;
    const start = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const end = value.indexOf('\n', selectionEnd);
    const finalEnd = end === -1 ? value.length : end;
    const block = value.slice(start, finalEnd);
    const lines = block.split('\n').map(line => (line.startsWith(prefix) ? line : `${prefix}${line}`));
    const replaced = lines.join('\n');
    const nextValue = value.slice(0, start) + replaced + value.slice(finalEnd);

    const offset = replaced.length - block.length;
    editor.value = nextValue;
    editor.focus();
    editor.setSelectionRange(selectionStart + prefix.length, selectionEnd + offset);
    editor.dispatchEvent(new Event('input'));
  }

  function insertHeading() {
    const { selectionStart, value } = editor;
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const lineEnd = value.indexOf('\n', selectionStart);
    const end = lineEnd === -1 ? value.length : lineEnd;
    const line = value.slice(lineStart, end);
    const nextLine = line.startsWith('#') ? line : `# ${line}`;
    editor.value = value.slice(0, lineStart) + nextLine + value.slice(end);
    const cursor = lineStart + nextLine.length;
    editor.focus();
    editor.setSelectionRange(cursor, cursor);
    editor.dispatchEvent(new Event('input'));
  }

  function insertLink() {
    const url = prompt('Enter URL');
    if (!url) return;
    surroundSelection('[', `](${url})`, 'link text');
  }

  function insertImage() {
    const url = prompt('Enter image URL');
    if (!url) return;
    surroundSelection('![', `](${url})`, 'alt text');
  }

  function insertCodeBlock() {
    const { selectionStart, selectionEnd, value } = editor;
    const selected = value.slice(selectionStart, selectionEnd) || 'console.log("Hello");';
    const block = `\n\n\`\`\`\n${selected}\n\`\`\`\n\n`;
    const nextValue = value.slice(0, selectionStart) + block + value.slice(selectionEnd);
    const cursor = selectionStart + block.length;
    editor.value = nextValue;
    editor.focus();
    editor.setSelectionRange(cursor, cursor);
    editor.dispatchEvent(new Event('input'));
  }

  function resetDocument() {
    const confirmed = confirm('Start a new document? Current content will be cleared.');
    if (!confirmed) return;
    editor.value = defaultMarkdown;
    render(editor.value);
    autosaveStatus.textContent = 'Saved';
    scheduleSave();
  }

  function importMarkdown(file) {
    const reader = new FileReader();
    reader.onload = event => {
      editor.value = event.target.result;
      editor.dispatchEvent(new Event('input'));
    };
    reader.readAsText(file);
  }

  let copyFeedbackTimer;

  function setCopyFeedback({ title, active, delay = COPY_RESET_DELAY }) {
    if (!copyPreviewButton) return;
    copyPreviewButton.title = title;
    copyPreviewButton.classList.toggle('is-active', Boolean(active));
    clearTimeout(copyFeedbackTimer);
    copyFeedbackTimer = setTimeout(() => {
      copyPreviewButton.title = 'Copy rendered HTML';
      copyPreviewButton.classList.remove('is-active');
    }, delay);
  }

  function legacyCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    const selection = document.getSelection();
    const storedRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    textarea.select();
    let successful = false;
    try {
      successful = document.execCommand('copy');
    } catch (err) {
      successful = false;
    }
    document.body.removeChild(textarea);
    if (storedRange && selection) {
      selection.removeAllRanges();
      selection.addRange(storedRange);
    }
    return successful;
  }

  async function copyPreview() {
    if (!copyPreviewButton) return;
    const html = preview.innerHTML;
    const plain = preview.innerText;

    try {
      if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        const blobHtml = new Blob([html], { type: 'text/html' });
        const blobText = new Blob([plain], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blobHtml,
            'text/plain': blobText
          })
        ]);
        setCopyFeedback({ title: 'Copied!', active: true });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(html);
        setCopyFeedback({ title: 'Copied!', active: true });
        return;
      }

      if (legacyCopy(plain)) {
        setCopyFeedback({ title: 'Copied (plain text)', active: true });
        return;
      }

      throw new Error('Clipboard API not supported');
    } catch (err) {
      console.warn('Copy failed', err);
      if (legacyCopy(plain)) {
        setCopyFeedback({ title: 'Copied (plain text)', active: true });
        return;
      }

      setCopyFeedback({ title: 'Copy failed', active: false, delay: 2000 });
    }
  }

  function exportMarkdown() {
    const blob = new Blob([editor.value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'document.md';
    document.body.appendChild(link);
    link.click();
    requestAnimationFrame(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }

  function handleToolbarClick(event) {
    const button = event.target.closest('button');
    if (!button) return;
    const { action } = button.dataset;
    if (!action) return;

    switch (action) {
      case 'new':
        resetDocument();
        break;
      case 'import':
        fileInput.click();
        break;
      case 'export':
        exportMarkdown();
        break;
      case 'bold':
        surroundSelection('**');
        break;
      case 'italic':
        surroundSelection('*');
        break;
      case 'heading':
        insertHeading();
        break;
      case 'quote':
        prefixLines('> ');
        break;
      case 'code':
        insertCodeBlock();
        break;
      case 'ul':
        prefixLines('- ');
        break;
      case 'ol':
        prefixLines('1. ');
        break;
      case 'link':
        insertLink();
        break;
      case 'image':
        insertImage();
        break;
      case 'undo':
        editor.focus();
        document.execCommand('undo');
        break;
      case 'redo':
        editor.focus();
        document.execCommand('redo');
        break;
      case 'theme':
        toggleTheme();
        break;
      case 'print':
        window.print();
        break;
      default:
        break;
    }
  }

  function syncPreviewScroll() {
    if (!syncCheckbox.checked) return;
    const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
    const target = (preview.scrollHeight - preview.clientHeight) * ratio;
    preview.scrollTo({ top: target, behavior: 'auto' });
  }

  editor.addEventListener('input', () => {
    render(editor.value);
    scheduleSave();
  });

  editor.addEventListener('scroll', syncPreviewScroll);

  fileInput.addEventListener('change', event => {
    const [file] = event.target.files;
    if (file) {
      importMarkdown(file);
    }
    fileInput.value = '';
  });

  if (uploadButton) {
    uploadButton.addEventListener('click', () => fileInput.click());
  }

  if (copyPreviewButton) {
    copyPreviewButton.addEventListener('click', copyPreview);
  }

  syncCheckbox.addEventListener('change', () => {
    if (syncCheckbox.checked) {
      syncPreviewScroll();
    }
  });

  loadTheme();
  loadContent();
})();
