// SOQL Formatter Core Logic

const SOQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT',
  'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET',
  'WITH', 'SECURITY_ENFORCED', 'USER_MODE', 'SYSTEM_MODE',
  'FOR', 'VIEW', 'UPDATE', 'REFERENCE',
  'IN', 'NOT IN', 'INCLUDES', 'EXCLUDES',
  'LIKE', 'NULL', 'TRUE', 'FALSE',
  'ASC', 'DESC', 'NULLS FIRST', 'NULLS LAST',
  'TYPEOF', 'END', 'ELSE', 'WHEN', 'THEN'
];

const CLAUSE_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY',
  'HAVING', 'LIMIT', 'OFFSET', 'WITH', 'FOR'
];

function tokenize(soql) {
  // Tokenize while preserving strings in quotes
  const tokens = [];
  let i = 0;
  const s = soql.trim();

  while (i < s.length) {
    // Skip whitespace
    if (/\s/.test(s[i])) {
      i++;
      continue;
    }

    // Handle single-quoted strings
    if (s[i] === "'") {
      let j = i + 1;
      while (j < s.length && s[j] !== "'") {
        if (s[j] === '\\') j++;
        j++;
      }
      tokens.push({ type: 'string', value: s.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Handle parentheses
    if (s[i] === '(' || s[i] === ')') {
      tokens.push({ type: 'paren', value: s[i] });
      i++;
      continue;
    }

    // Handle commas
    if (s[i] === ',') {
      tokens.push({ type: 'comma', value: ',' });
      i++;
      continue;
    }

    // Handle operators
    if (/[=<>!]/.test(s[i])) {
      let op = s[i];
      if (s[i + 1] === '=' || (s[i] === '<' && s[i + 1] === '>')) {
        op += s[i + 1];
        i++;
      }
      tokens.push({ type: 'operator', value: op });
      i++;
      continue;
    }

    // Handle numbers
    if (/\d/.test(s[i]) || (s[i] === '-' && /\d/.test(s[i + 1]))) {
      let j = i;
      if (s[j] === '-') j++;
      while (j < s.length && /[\d.]/.test(s[j])) j++;
      tokens.push({ type: 'number', value: s.slice(i, j) });
      i = j;
      continue;
    }

    // Handle identifiers and keywords
    let j = i;
    while (j < s.length && !/[\s,()=<>!'"]/.test(s[j])) j++;
    const word = s.slice(i, j);

    // Look-ahead for multi-word keywords
    let multiWord = word;
    for (const kw of ['ORDER BY', 'GROUP BY', 'NULLS FIRST', 'NULLS LAST', 'NOT IN']) {
      if (soql.toUpperCase().startsWith(kw, i)) {
        multiWord = kw;
        j = i + kw.length;
        break;
      }
    }

    const upper = multiWord.toUpperCase();
    if (SOQL_KEYWORDS.includes(upper)) {
      tokens.push({ type: 'keyword', value: upper });
    } else {
      tokens.push({ type: 'identifier', value: multiWord });
    }
    i = j;
  }

  return tokens;
}

function formatSOQL(rawSOQL, options = {}) {
  const {
    indent = '  ',
    fieldIndent = '    ',
    uppercaseKeywords = true
  } = options;

  // Clean up the input
  const soql = rawSOQL.replace(/\s+/g, ' ').trim();

  // Split on major clauses using regex
  const clausePattern = /\b(SELECT|FROM|WHERE|ORDER\s+BY|GROUP\s+BY|HAVING|LIMIT|OFFSET|WITH|FOR)\b/gi;

  // Find all clause positions
  const clausePositions = [];
  let match;
  const regex = new RegExp(clausePattern.source, 'gi');
  while ((match = regex.exec(soql)) !== null) {
    clausePositions.push({
      index: match.index,
      keyword: match[0].replace(/\s+/g, ' ').toUpperCase()
    });
  }

  if (clausePositions.length === 0) {
    return soql; // Not a valid SOQL query
  }

  // Extract clause segments
  const clauses = [];
  for (let i = 0; i < clausePositions.length; i++) {
    const start = clausePositions[i].index;
    const end = i + 1 < clausePositions.length ? clausePositions[i + 1].index : soql.length;
    const keyword = clausePositions[i].keyword;
    const content = soql.slice(start + clausePositions[i].keyword.length, end).trim();
    clauses.push({ keyword, content });
  }

  // Format each clause
  const lines = [];

  for (const clause of clauses) {
    const kw = uppercaseKeywords ? clause.keyword : clause.keyword.toLowerCase();

    switch (clause.keyword) {
      case 'SELECT':
        lines.push(kw);
        formatFieldList(clause.content, fieldIndent, lines);
        break;

      case 'FROM':
        lines.push(kw);
        lines.push(`${fieldIndent}${clause.content.trim()}`);
        break;

      case 'WHERE':
        lines.push(kw);
        formatWhereClause(clause.content, fieldIndent, uppercaseKeywords, lines);
        break;

      case 'ORDER BY':
      case 'GROUP BY':
        lines.push(kw);
        formatFieldList(clause.content, fieldIndent, lines);
        break;

      case 'WITH':
        // Handle WITH SECURITY_ENFORCED / USER_MODE etc.
        lines.push(`${kw} ${clause.content.trim()}`);
        break;

      case 'HAVING':
        lines.push(kw);
        formatWhereClause(clause.content, fieldIndent, uppercaseKeywords, lines);
        break;

      default:
        // LIMIT, OFFSET, FOR
        lines.push(`${kw} ${clause.content.trim()}`);
        break;
    }
  }

  return lines.join('\n');
}

function formatFieldList(content, indent, lines) {
  // Split by commas, respecting nested parens
  const fields = splitByComma(content);
  fields.forEach((field, idx) => {
    const trimmed = field.trim();
    const isLast = idx === fields.length - 1;
    lines.push(`${indent}${trimmed}${isLast ? '' : ','}`);
  });
}

function formatWhereClause(content, indent, uppercaseKeywords, lines) {
  // Split by AND/OR at the top level (not inside parens)
  const conditions = splitByLogical(content);

  conditions.forEach((cond, idx) => {
    const { prefix, expr } = cond;
    const kw = uppercaseKeywords ? prefix.toUpperCase() : prefix.toLowerCase();
    if (idx === 0) {
      lines.push(`${indent}${expr.trim()}`);
    } else {
      lines.push(`${indent}${kw} ${expr.trim()}`);
    }
  });
}

function splitByComma(str) {
  const parts = [];
  let depth = 0;
  let current = '';

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function splitByLogical(str) {
  const parts = [];
  let depth = 0;
  let current = '';
  let nextPrefix = '';  // AND/OR prefix for the next condition
  let i = 0;

  while (i < str.length) {
    const remaining = str.slice(i).toUpperCase();

    if (str[i] === '(') depth++;
    else if (str[i] === ')') depth--;

    if (depth === 0) {
      if (remaining.startsWith('AND ') || remaining.startsWith('AND(')) {
        parts.push({ prefix: nextPrefix, expr: current.trim() });
        current = '';
        nextPrefix = 'AND';
        i += 3;
        while (i < str.length && str[i] === ' ') i++;
        continue;
      } else if (remaining.startsWith('OR ') || remaining.startsWith('OR(')) {
        parts.push({ prefix: nextPrefix, expr: current.trim() });
        current = '';
        nextPrefix = 'OR';
        i += 2;
        while (i < str.length && str[i] === ' ') i++;
        continue;
      }
    }

    current += str[i];
    i++;
  }

  // Push the last condition
  if (current.trim()) {
    parts.push({ prefix: nextPrefix, expr: current.trim() });
  }

  // Remove any entries with empty expr (safety net)
  return parts.filter(p => p.expr !== '');
}

// Wrap a SOQL query in an Apex-style context
function wrapInApex(soqlFormatted, options = {}) {
  const { varName = 'results', objectType = 'SObject' } = options;
  const indented = soqlFormatted.split('\n').map(l => '      ' + l).join('\n');
  return `List<${objectType}> ${varName} = [\n${indented}\n    ];`;
}

// Export for use in popup
if (typeof module !== 'undefined') {
  module.exports = { formatSOQL, wrapInApex };
} else {
  window.SOQLFormatter = { formatSOQL, wrapInApex };
}
