// popup.js — UI logic for SOQL Formatter extension

const inputArea    = document.getElementById('inputArea');
const outputArea   = document.getElementById('outputArea');
const formatBtn    = document.getElementById('formatBtn');
const copyBtn      = document.getElementById('copyBtn');
const clearBtn     = document.getElementById('clearBtn');
const errorMsg     = document.getElementById('errorMsg');
const optUppercase = document.getElementById('optUppercase');
const apexToggle   = document.getElementById('apexToggle');

let isUppercase = true;
let lastFormatted = '';

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