(() => {
  const editor = document.getElementById('editor');
  const preview = document.getElementById('preview');
  const autosaveStatus = document.getElementById('autosave-status');
  const fileInput = document.getElementById('file-input');
  const syncCheckbox = document.getElementById('sync-scroll');
  const uploadButton = document.getElementById('upload-button');
  const clearButton = document.getElementById('clear-button');
  const copyPreviewButton = document.getElementById('copy-preview');
  const snackbar = document.getElementById('snackbar');
  const collapseEditorButton = document.getElementById('collapse-editor');
  const collapsePreviewButton = document.getElementById('collapse-preview');
  const editorPane = document.querySelector('.editor-pane');
  const previewPane = document.querySelector('.preview-pane');

  const STORAGE_KEY = 'markdown-studio-content';
  const THEME_KEY = 'markdown-studio-theme';
  const AUTOSAVE_DELAY = 400;
  const COPY_RESET_DELAY = 1500;

  const marked = window.marked;
  if (!marked) {
    console.error('Markdown renderer failed to load.');
    if (preview) {
      preview.innerHTML = '<div class="empty-state">Markdown preview unavailable. Please refresh the page.</div>';
    }
    return;
  }

  if (!window.hljs) {
    console.error('Highlight.js failed to load.');
  } else {
    console.log('Highlight.js loaded successfully', window.hljs.listLanguages());
  }

  // Configure marked renderer for code highlighting
  const renderer = new marked.Renderer();
  const originalCodeRenderer = renderer.code.bind(renderer);

  renderer.code = function(code, language) {
    if (!window.hljs || !language) {
      return originalCodeRenderer(code, language);
    }

    try {
      const validLanguage = window.hljs.getLanguage(language) ? language : 'plaintext';
      const highlighted = window.hljs.highlight(code, { language: validLanguage });
      return `<pre><code class="hljs language-${language}">${highlighted.value}</code></pre>`;
    } catch (err) {
      console.error('Highlight error:', err);
      return originalCodeRenderer(code, language);
    }
  };

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

  marked.setOptions({
    renderer: renderer,
    pedantic: false,
    gfm: true,
    breaks: true
  });

  function render(value) {
    if (!value.trim()) {
      preview.innerHTML = '<div class="empty-state">Start by typing your Markdown on the left panel.</div>';
      return;
    }
    
    // Strip YAML front matter (metadata between --- delimiters)
    let content = value;
    const frontMatterRegex = /^---\s*\n[\s\S]*?\n---\s*\n/;
    content = content.replace(frontMatterRegex, '');
    
    preview.innerHTML = marked.parse(content);
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
  let snackbarTimer;

  function showSnackbar(message) {
    if (!snackbar) return;
    snackbar.textContent = message;
    snackbar.classList.add('show');
    clearTimeout(snackbarTimer);
    snackbarTimer = setTimeout(() => {
      snackbar.classList.remove('show');
    }, 2000);
  }

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

  function copyWithSelection(element) {
    console.log('copyWithSelection: Starting selection-based copy');
    if (!element) {
      console.log('copyWithSelection: No element provided');
      return false;
    }
    const selection = window.getSelection();
    if (!selection) {
      console.log('copyWithSelection: No selection API available');
      return false;
    }

    const storedRanges = [];
    for (let i = 0; i < selection.rangeCount; i += 1) {
      storedRanges.push(selection.getRangeAt(i));
    }

    const range = document.createRange();
    range.selectNodeContents(element);

    selection.removeAllRanges();
    selection.addRange(range);

    let successful = false;
    try {
      successful = document.execCommand('copy');
      console.log(`copyWithSelection: execCommand('copy') returned ${successful}`);
    } catch (err) {
      console.error('copyWithSelection: execCommand failed with error', err);
      successful = false;
    }

    selection.removeAllRanges();
    storedRanges.forEach(savedRange => selection.addRange(savedRange));

    return successful;
  }

  function copyPlainText(text) {
    console.log('copyPlainText: Starting plain text copy');
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    let successful = false;
    try {
      successful = document.execCommand('copy');
      console.log(`copyPlainText: execCommand('copy') returned ${successful}`);
    } catch (err) {
      console.error('copyPlainText: execCommand failed with error', err);
      successful = false;
    }
    document.body.removeChild(textarea);
    return successful;
  }

  function normalizeHtmlForCopy(htmlContent) {
    console.log('normalizeHtmlForCopy: Starting HTML normalization');

    // Create a temporary div to manipulate the HTML
    const temp = document.createElement('div');
    temp.innerHTML = htmlContent;

    // CRITICAL: Normalize text nodes to remove extra whitespace between inline elements
    // This prevents **Bold**: from breaking across lines in WeChat
    function normalizeWhitespace(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        // Only normalize text nodes that are direct children of inline containers
        const parent = node.parentElement;
        if (parent && ['P', 'LI', 'TD', 'TH', 'BLOCKQUOTE'].includes(parent.tagName)) {
          // Replace multiple spaces with single space, but preserve single spaces
          node.textContent = node.textContent.replace(/\s+/g, ' ');
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Don't normalize whitespace in code blocks
        if (node.tagName !== 'PRE' && node.tagName !== 'CODE') {
          Array.from(node.childNodes).forEach(child => normalizeWhitespace(child));
        }
      }
    }

    normalizeWhitespace(temp);

    // Base font styling for WeChat 公众号 compatibility (following doocs/md approach)
    // CRITICAL: Use -apple-system-font (with hyphen at end) for WeChat
    const baseFontFamily = '-apple-system-font, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif';
    const baseLineHeight = '1.75';
    const baseFontSize = '14px'; // WeChat uses 14px, not 16px
    const primaryColor = '#0F4C81'; // WeChat 公众号 primary color
    const baseColor = 'hsl(0, 0%, 15%)'; // Equivalent to foreground color

    // Add inline styles to ALL elements for better paste compatibility
    const allElements = temp.querySelectorAll('*');
    console.log(`normalizeHtmlForCopy: Found ${allElements.length} elements to normalize`);

    allElements.forEach(el => {
      const tagName = el.tagName.toLowerCase();

      // Add base styles to EVERY element (critical for 公众号 compatibility)
      el.style.fontFamily = baseFontFamily;
      el.style.lineHeight = baseLineHeight;
      el.style.textAlign = 'left';
      el.style.fontSize = baseFontSize;

      // Handle inline elements (must use font-size: inherit)
      if (['strong', 'em', 'code', 'a', 'span', 'b', 'i'].includes(tagName)) {
        el.style.fontSize = 'inherit';
        el.style.display = 'inline';
      }

      // Strong/bold tags (use actual color, not CSS variable)
      if (tagName === 'strong' || tagName === 'b') {
        el.style.fontWeight = 'bold';
        el.style.color = primaryColor; // Use actual color value

        // CRITICAL: Append following punctuation into the strong tag to prevent line breaks
        const nextNode = el.nextSibling;
        if (nextNode && nextNode.nodeType === Node.TEXT_NODE) {
          const text = nextNode.textContent;
          // If text starts with punctuation, move it inside strong tag
          const punctuationMatch = text.match(/^[:：,，.。;；!！?？]/);
          if (punctuationMatch) {
            el.textContent += punctuationMatch[0];
            nextNode.textContent = text.substring(punctuationMatch[0].length);
          }
        }
      }

      // Emphasis/italic tags
      if (tagName === 'em' || tagName === 'i') {
        el.style.fontStyle = 'italic';
      }

      // Code elements (inline code)
      if (tagName === 'code') {
        const isInPre = el.closest('pre');
        if (!isInPre) {
          // Inline code
          el.style.fontFamily = 'Consolas, Monaco, "Courier New", monospace';
          el.style.fontSize = '90%';
          el.style.color = '#d14';
          el.style.backgroundColor = 'rgba(27,31,35,0.05)';
          el.style.padding = '3px 5px';
          el.style.borderRadius = '4px';
        }
      }

      // Pre/code blocks
      if (tagName === 'pre') {
        el.style.backgroundColor = '#22272e';
        el.style.color = '#e6edf3';
        el.style.padding = '16px';
        el.style.borderRadius = '6px';
        el.style.overflow = 'auto';
        el.style.fontSize = '14px';
      }

      // Paragraphs (WeChat-specific formatting)
      if (tagName === 'p') {
        el.style.textAlign = 'justify'; // WeChat uses justify, not left
        el.style.margin = '1.5em 8px'; // WeChat uses specific margin values
        el.style.letterSpacing = '0.1em'; // WeChat adds letter spacing
        el.style.fontSize = baseFontSize;
      }

      // Headings
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        el.style.marginTop = '1em';
        el.style.marginBottom = '0.5em';
        el.style.fontWeight = 'bold';
        el.style.color = baseColor;
      }

      // List items (公众号-specific formatting - CRITICAL)
      if (tagName === 'li') {
        el.style.textIndent = '-1em'; // CRITICAL: Prevents text wrapping issues
        el.style.display = 'block';
        el.style.margin = '0.2em 8px';
        el.style.color = baseColor;
        el.style.whiteSpace = 'normal'; // Allow wrapping but keep inline elements together
        el.style.wordBreak = 'normal'; // Don't break words

        // Add bullet character if parent is UL (公众号 doesn't render CSS list-style properly)
        const parentList = el.parentElement;
        if (parentList && parentList.tagName === 'UL') {
          // Check if bullet already exists
          const firstChild = el.firstChild;
          if (!firstChild || firstChild.nodeType !== Node.TEXT_NODE || !firstChild.textContent.startsWith('•')) {
            // Prepend bullet character
            el.insertBefore(document.createTextNode('• '), el.firstChild);
          }
        }
      }

      // Lists (公众号-specific formatting)
      if (tagName === 'ul') {
        el.style.listStyle = 'none'; // We add bullets manually as text
        el.style.paddingLeft = '1em'; // doocs/md uses 1em, not 2em
        el.style.marginLeft = '0';
        el.style.color = baseColor;
        // Remove margin-top from first ul
        if (!el.previousElementSibling) {
          el.style.marginTop = '0';
        } else {
          el.style.marginTop = '0.5em';
        }
        el.style.marginBottom = '0.5em';
      }

      if (tagName === 'ol') {
        el.style.paddingLeft = '1em';
        el.style.marginLeft = '0';
        el.style.fontSize = baseFontSize;
        el.style.marginTop = '0.5em';
        el.style.marginBottom = '0.5em';
      }

      // Blockquotes
      if (tagName === 'blockquote') {
        el.style.borderLeft = '4px solid #dfe2e5';
        el.style.paddingLeft = '1em';
        el.style.marginLeft = '0';
        el.style.color = '#6a737d';
      }

      // Tables
      if (tagName === 'table') {
        el.style.borderCollapse = 'collapse';
        el.style.width = '100%';
        el.style.marginTop = '1em';
        el.style.marginBottom = '1em';
      }

      if (tagName === 'th' || tagName === 'td') {
        el.style.border = '1px solid #dfe2e5';
        el.style.padding = '6px 13px';
      }

      if (tagName === 'th') {
        el.style.fontWeight = 'bold';
        el.style.backgroundColor = '#f6f8fa';
      }
    });

    // Wrap the content in a <section> tag (公众号 requirement, not <div>)
    const wrapper = document.createElement('section');
    wrapper.style.fontFamily = baseFontFamily;
    wrapper.style.fontSize = baseFontSize;
    wrapper.style.lineHeight = baseLineHeight;
    wrapper.style.textAlign = 'left';
    wrapper.appendChild(temp);

    console.log('normalizeHtmlForCopy: HTML normalization complete');
    return wrapper.outerHTML; // Return the entire section including the tag
  }

  // Following doocs/md implementation for copying HTML with multi-format support
  async function copyPreview() {
    console.log('copyPreview: Starting copy operation');
    if (!copyPreviewButton) return;

    const html = preview.innerHTML;
    const plain = preview.textContent || preview.innerText;

    // DEBUG: Log the HTML before and after normalization
    console.log('=== ORIGINAL HTML (first 500 chars) ===');
    console.log(html.substring(0, 500));

    const normalizedHtml = normalizeHtmlForCopy(html);

    console.log('=== NORMALIZED HTML (first 500 chars) ===');
    console.log(normalizedHtml.substring(0, 500));

    try {
      // Try modern Clipboard API with ClipboardItem (doocs/md approach)
      if (window.isSecureContext && navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        console.log('copyPreview: Using modern Clipboard API with ClipboardItem');

        const item = new ClipboardItem({
          'text/html': new Blob([normalizedHtml], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' })
        });

        await navigator.clipboard.write([item]);
        console.log('copyPreview: Modern Clipboard API succeeded');
        setCopyFeedback({ title: 'Copied!', active: true });
        showSnackbar('✓ Copied with formatting');
        return;
      }

      // Fallback to writeText if Clipboard API with items not available
      console.log('copyPreview: Falling back to clipboard.writeText');
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(plain);
        console.log('copyPreview: clipboard.writeText succeeded');
        setCopyFeedback({ title: 'Copied!', active: true });
        showSnackbar('✓ Copied to clipboard');
        return;
      }

      // Legacy fallback using document.execCommand
      console.log('copyPreview: Trying legacy copy method');
      if (copyPlainText(plain)) {
        console.log('copyPreview: Legacy copy succeeded');
        setCopyFeedback({ title: 'Copied!', active: true });
        showSnackbar('✓ Copied to clipboard');
        return;
      }

      throw new Error('Clipboard API not supported');
    } catch (err) {
      console.warn('copyPreview: Copy failed with error', err);

      // Final fallback attempt
      console.log('copyPreview: Trying final fallback');
      try {
        if (copyPlainText(plain)) {
          console.log('copyPreview: Final fallback succeeded');
          setCopyFeedback({ title: 'Copied!', active: true });
          showSnackbar('✓ Copied to clipboard');
          return;
        }
      } catch (fallbackErr) {
        console.error('copyPreview: Final fallback failed', fallbackErr);
      }

      console.error('copyPreview: All copy methods failed');
      setCopyFeedback({ title: 'Copy failed', active: false, delay: 2000 });
      showSnackbar('✗ Copy failed');
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

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      editor.value = '';
      render(editor.value);
      scheduleSave();
    });
  }

  if (copyPreviewButton) {
    copyPreviewButton.addEventListener('click', copyPreview);
  }

  syncCheckbox.addEventListener('change', () => {
    if (syncCheckbox.checked) {
      syncPreviewScroll();
    }
  });

  if (collapseEditorButton && editorPane) {
    collapseEditorButton.addEventListener('click', () => {
      editorPane.classList.toggle('collapsed');
    });
  }

  if (collapsePreviewButton && previewPane) {
    collapsePreviewButton.addEventListener('click', () => {
      previewPane.classList.toggle('collapsed');
    });
  }

  loadTheme();
  loadContent();
})();
