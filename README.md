# Neon Command — High-Tech New Tab (no quick links)

This version removes the quick links section — the new tab is focused on the large clock, greeting, search bar, a persistent quick note, and the animated neon background.

Features:
- Animated particle background and neon grid
- Large live clock and time-based greeting
- Search box (uses Google by default)
- Persistent quick note (saved locally / synced)
- Theme color setting in the settings modal (no quick links)

Installation (developer mode):
1. Save these files into your extension directory (keep the folder structure: icons/, index.html, manifest.json, styles.css, script.js).
2. Open Chrome and go to chrome://extensions.
3. Enable "Developer mode".
4. Click "Load unpacked" and select the extension directory.
5. Open a new tab to see the extension.

Privacy:
- Settings and notes are saved using chrome.storage.sync when available and fall back to localStorage; nothing is transmitted elsewhere by the extension.

License: MIT