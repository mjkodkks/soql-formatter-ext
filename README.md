# ⚡ SOQL Formatter — Chrome Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](/LICENSE)

Format & prettify Salesforce SOQL queries with a clean vertical style.

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `soql-formatter` folder
5. The ⚡ icon will appear in your Chrome toolbar

## Features

- **Vertical formatting** — each field and condition on its own line
- **Clause alignment** — SELECT, FROM, WHERE, ORDER BY etc. as block headers
- **WHERE clause formatting** — AND / OR conditions properly indented
- **Syntax highlighting** — keywords, strings, numbers all colored
- **Apex wrapping** — optionally wrap output as `List<SObject> results = [...]`
- **Uppercase toggle** — format keywords as UPPER or lower case
- **One-click copy** — copy formatted output to clipboard
- **Ctrl+Enter** shortcut — format without clicking the button

## Example

**Input:**
```
SELECT Id, Name, Phone, Industry, AnnualRevenue FROM Account WHERE Industry = 'Technology' AND AnnualRevenue > 500000 WITH SECURITY_ENFORCED ORDER BY Name ASC LIMIT 10
```

**Output:**
```
SELECT
    Id,
    Name,
    Phone,
    Industry,
    AnnualRevenue
FROM
    Account
WHERE
    Industry = 'Technology'
    AND AnnualRevenue > 500000
WITH SECURITY_ENFORCED
ORDER BY
    Name ASC
LIMIT 10
```

## Supported Clauses

`SELECT` · `FROM` · `WHERE` · `ORDER BY` · `GROUP BY` · `HAVING` · `LIMIT` · `OFFSET` · `WITH SECURITY_ENFORCED` · `FOR VIEW/UPDATE`

## Building from source

Create a distributable `.zip` file for publishing or sideloading:

### macOS / Linux
```bash
# Run the build script
./build.sh
```

### Windows
```bat
# Run the build script
build.bat
```

Both scripts produce `chrome-extension.zip` in the project root, excluding `.git/`, `node_modules/`, `build.sh`, `build.bat`, `*.zip`, `package.json`, and `package-lock.json`.

## License

MIT © 2026 DKKs

---

Make with ❤️ DKKs