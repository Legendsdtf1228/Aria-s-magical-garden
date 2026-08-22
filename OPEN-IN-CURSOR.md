# Aria's Color Garden — Local Setup

## Easiest method on Windows

1. Open this folder in Cursor (**File → Open Folder**).
2. Double-click `START-GAME.bat`.
3. The game opens at `http://localhost:5173`.

The first launch runs `npm.cmd install` and can take a couple of minutes. Later launches are faster.

`START-GAME.bat` uses `npm.cmd` so Windows PowerShell execution policy does not block startup.

## Exact Windows commands

Open **Terminal → New Terminal** in Cursor, then run:

```powershell
cd "C:\Users\Mark\Aria's Magical Garden\Aria-Color-Garden-Cursor\Aria-Color-Garden"
npm.cmd install
npm.cmd run dev
```

Then open `http://localhost:5173` in Chrome or Edge.

## Requirement

Install Node.js 22 or newer if Windows says `node` or `npm` is not recognized: https://nodejs.org/

## Stop the game

Click the game terminal window and press `Ctrl+C`.

## Parent settings

On the welcome or activity hub screen, press and hold the flower button for about 2 seconds to open parent settings (voices, speech/music volume, reset collection).

Parent settings show the actual selected English and Spanish voice names, plus whether a **Natural voice** is available or the app is **Using device voice**.

## Desktop shortcuts (easiest daily play)

1. Double-click `CREATE-DESKTOP-SHORTCUTS.bat` once.
2. On your Desktop, use:
   - **Play Aria's Color Garden** → starts the game and opens the browser
   - **Close Aria's Color Garden** → stops only the server on port 5173

You can also double-click `LAUNCH-ARIA-GAME.bat` / `STOP-ARIA-GAME.bat` in this folder.

## Progressive Web App (phones & tablets)

See `PWA.md` for install steps. Short version:

- **iPhone/iPad (Safari):** Share → Add to Home Screen  
- **Android (Chrome):** Menu → Install app  

After one online visit, the game can start offline. Collection progress is kept across updates.

See `VOICE-RECORDING-LIST.md` and folders:

- `public/audio/voice/en-US/`
- `public/audio/voice/es-MX/`

The game works fully with browser speech synthesis if no recordings are present. Natural/Online/Neural system voices are preferred when available.

## Main folders to edit

- `app/page.tsx` — navigation shell
- `app/activities/` — each garden activity
- `app/hooks/` — bilingual voice, audio, collection, settings
- `app/data/` — colors, animals, shapes, friends, phrases
- `app/globals.css` — storybook garden visuals
