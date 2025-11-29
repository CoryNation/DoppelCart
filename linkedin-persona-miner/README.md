# LinkedIn Persona Miner (MV3) — Quick Rebuild Guide

## Files
- manifest.json
- popup.html
- popup.js
- content.js
- dom-parsers.js
- styles.css
- csv.js (placeholder)
- icon16.png, icon24.png, icon32.png, icon48.png, icon128.png (icon files)

## Setup
**Important:** Copy the icon files (icon16.png, icon24.png, icon32.png, icon48.png, icon128.png) from the original extension folder to this folder if they're not already present.

## Load in Chrome
1) Go to `chrome://extensions`.
2) Enable **Developer mode** (top right).
3) Click **Load unpacked** and select the `linkedin-persona-miner` folder.
4) Pin the extension if desired (puzzle icon → pin).

## Use
1) Open a LinkedIn **profile** → open the extension popup → check consent → **Create Resume PDF** (tries *More → Save to PDF*, else falls back to Print).
2) Open **Recent activity → Posts** or **Comments** → **Start Auto-Scroll** (defaults to 1 minute) → **Extract Posts/Comments → CSV**.
3) CSVs will download via Chrome's download manager.
4) Upload the CSV files to DoppelCart's LinkedIn Persona Analysis page for AI-powered insights.

## Notes
- The extension requires icon files to display properly in Chrome.
- If LinkedIn's page structure changes, adjust selectors in `content.js` and `dom-parsers.js`.
- Always ensure you have permission before extracting data from LinkedIn profiles.

