// popup.js — UI logic for SOQL Formatter extension

const inputArea    = document.getElementById('inputArea');
const outputArea   = document.getElementById('outputArea');
const formatBtn    = document.getElementById('formatBtn');
const copyBtn      = document.getElementById('copyBtn');
const clearBtn     = document.getElementById('clearBtn');
const errorMsg     = document.getElementById('errorMsg');
const optUppercase = document.getElementById('optUppercase');
const apexToggle   = document.getElementById('apexToggle');
const themeBtn     = document.getElementById('themeBtn');

let isUppercase = true;
let lastFormatted = '';

// ── Theme management ─────────────────────────────────
const STORAGE_KEY = 'soql-formatter-theme';
const moonSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
const sunSVG  = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme) {
  const isLight = theme === 'light';
  document.body.classList.toggle('light', isLight);
  themeBtn.innerHTML = isLight ? moonSVG : sunSVG;
  themeBtn.title = isLight ? 'Switch to dark theme' : 'Switch to light theme';
}

function loadTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    applyTheme(stored);
  } else {
    applyTheme(getSystemTheme());
  }
}

themeBtn.addEventListener('click', () => {
  const isLight = document.body.classList.contains('light');
  const newTheme = isLight ? 'dark' : 'light';
  localStorage.setItem(STORAGE_KEY, newTheme);
  applyTheme(newTheme);
});

// Listen for OS theme changes while popup is open
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    applyTheme(getSystemTheme());
  }
});

// Apply theme on load
loadTheme();

// ── Toggle uppercase ─────────────────────────────────
optUppercase.addEventListener('click', () => {
  isUppercase = !isUppercase;
  optUppercase.classList.toggle('active', isUppercase);
  if (lastFormatted) doFormat();
});

// ── Format button ────────────────────────────────────
formatBtn.addEventListener('click', doFormat);

// ── Ctrl+Enter shortcut ──────────────────────────────
inputArea.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    doFormat();
  }
});

// ── Clear ────────────────────────────────────────────
clearBtn.addEventListener('click', () => {
  inputArea.value = '';
  outputArea.innerHTML =
    '<div class="empty">' +
      '<div class="empty-icon">🔍</div>' +
      '<p>Paste a SOQL query above and click Format</p>' +
    '</div>';
  lastFormatted = '';
  errorMsg.style.display = 'none';
  inputArea.focus();
});

// ── Copy ─────────────────────────────────────────────
copyBtn.addEventListener('click', () => {
  if (!lastFormatted) return;
  navigator.clipboard.writeText(lastFormatted).then(() => {
    copyBtn.textContent = '✓ Copied!';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.textContent = 'Copy';
      copyBtn.classList.remove('copied');
    }, 1800);
  });
});

// ── Apex toggle ──────────────────────────────────────
apexToggle.addEventListener('change', () => {
  if (lastFormatted) doFormat();
});

// ── Main format function ─────────────────────────────
function doFormat() {
  const raw = inputArea.value.trim();
  if (!raw) return;

  errorMsg.style.display = 'none';

  try {
    let formatted = window.SOQLFormatter.formatSOQL(raw, {
      uppercaseKeywords: isUppercase
    });

    if (apexToggle.checked) {
      const fromMatch = raw.match(/\bFROM\s+(\w+)/i);
      const objectType = fromMatch ? fromMatch[1] : 'SObject';
      const varName = objectType.charAt(0).toLowerCase() + objectType.slice(1) + 'List';
      formatted = window.SOQLFormatter.wrapInApex(formatted, { varName, objectType });
    }

    lastFormatted = formatted;
    outputArea.innerHTML = highlightSOQL(formatted);

  } catch (err) {
    errorMsg.textContent = '⚠ ' + err.message;
    errorMsg.style.display = 'block';
  }
}


// ── Syntax highlighter ───────────────────────────────
function highlightSOQL(code) {
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'ORDER BY', 'GROUP BY',
    'HAVING', 'LIMIT', 'OFFSET', 'WITH', 'SECURITY_ENFORCED', 'USER_MODE',
    'SYSTEM_MODE', 'FOR', 'VIEW', 'UPDATE', 'REFERENCE', 'IN', 'NOT IN',
    'INCLUDES', 'EXCLUDES', 'LIKE', 'NULL', 'TRUE', 'FALSE', 'ASC', 'DESC',
    'NULLS FIRST', 'NULLS LAST', 'TYPEOF', 'END', 'ELSE', 'WHEN', 'THEN',
    'List', 'void', 'public', 'private', 'global', 'static', 'return', 'new'
  ];

  // 1. Escape HTML first
  let out = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2. Operators FIRST — before any <span> tags exist, so = in class="..." won't be matched
  out = out.replace(/(!=|&lt;=|&gt;=|&lt;&gt;|&lt;|&gt;|=)/g, '<span class="op">$1</span>');

  // 3. Strings
  out = out.replace(/'[^']*'/g, m => '<span class="str">' + m + '</span>');

  // 4. Numbers — skip over existing HTML tags to avoid double-wrapping
  out = out.replace(/(<[^>]+>)|(\b\d+(?:\.\d+)?\b)/g, (m, tag, num) => {
    if (tag) return tag;
    return '<span class="num">' + num + '</span>';
  });

  // 5. Keywords (longest first) — skip over existing HTML tags to avoid double-wrapping
  const sorted = [...keywords].sort((a, b) => b.length - a.length);
  sorted.forEach(kw => {
    const pat = new RegExp('(<[^>]+>)|(\\b' + kw.replace(/\s+/g, '\\s+') + '\\b)', 'gi');
    out = out.replace(pat, (m, tag, word) => {
      if (tag) return tag;
      return '<span class="kw">' + m + '</span>';
    });
  });

  return out;
}