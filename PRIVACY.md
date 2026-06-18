# Privacy Policy

The SOQL Formatter browser extension is a **local-only** tool. All processing happens entirely within your browser. **No data is sent to any external servers, APIs, or third parties.**

The extension does **not** communicate with Salesforce servers, does **not** access any Salesforce sessions or cookies, and does **not** make any network requests whatsoever.

You can validate this by inspecting the [source code](https://github.com/DKKs/soql-formatter) or monitoring the network traffic in your browser's Developer Tools.

## Data Collection

### What we collect

**Nothing.** The SOQL Formatter extension:

- Does **not** collect, store, or transmit any personal information
- Does **not** use cookies, trackers, or analytics
- Does **not** make any network requests
- Does **not** access Salesforce APIs or sessions
- Does **not** read browser cookies
- Does **not** require any special browser permissions

### User Input

The SOQL query you paste into the input field is processed **locally** in your browser's memory. Once you close the popup, the input is discarded. No query text is ever saved, logged, or transmitted anywhere.

## Local Storage Policy

The SOQL Formatter extension does **not** use `localStorage`, `sessionStorage`, `IndexedDB`, or any other browser storage mechanism. All preferences (uppercase/lowercase toggle, Apex wrapping option) are held in memory only and reset when the popup is closed.

## Permissions

The extension requests **zero** permissions in its manifest. It operates entirely within the popup UI and has no access to:

- Your browsing history
- Your Salesforce environment
- Any external websites or APIs
- Your clipboard (the copy button uses the standard `navigator.clipboard` API, triggered only by your explicit click)

## Changes to This Policy

If this policy changes in the future (for example, if the extension gains new features), the version history of this document will be available in the [GitHub repository](https://github.com/DKKs/soql-formatter).

---

*Last updated: June 18, 2026*
