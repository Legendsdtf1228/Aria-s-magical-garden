# Progressive Web App

Aria's Color Garden can be installed on iPhone, iPad, Android, and Windows.

## Install

### iPhone / iPad
1. Open the game in **Safari** (required).
2. Tap **Share**.
3. Tap **Add to Home Screen**.
4. Open **Aria's Garden** from the Home Screen (standalone, no browser bars).

### Android
1. Open the game in **Chrome**.
2. Tap the menu (⋮).
3. Tap **Install app** or **Add to Home screen**.

### Windows
- In Edge/Chrome: use the install icon in the address bar when available.
- For the local copy: use the Desktop **Play Aria's Color Garden** shortcut.

Parent settings (hold the flower 2 seconds) also list these steps.

## Play experience

Navigation is a **full-screen living garden map** (no activity card grid):

| Garden location | Activity |
| --- | --- |
| Rainbow flower patch | Color Garden |
| Bunny picnic | Feed the Friends |
| Animal meadow | Find My Friend |
| Singing tree | Animal Sounds |
| Watering garden | Garden Care |
| Open meadow | Free Play |
| Shape stepping stones | Shape Meadow |
| Frog pond | Counting Pond |
| Music gazebo | Music and Movement |
| Woodland trail | Animal Friends |

Collected friends live in the scenery (not an inventory strip). Parent settings: English / Spanish / English + Spanish, speech, music, voices.

## Offline play

After the game loads once online, the service worker (`aria-garden-pwa-v4`) caches:

- Game interface / activities
- Icons and images
- Music / sound effect assets requested by the game
- English and Spanish voice recordings under `/audio/voice/` when present

Collection progress (`aria-color-garden-friends`) and activity progress (`aria-color-garden-progress`) are **never** cleared by app updates. Missing voice files fall back to device speech without crashing.

## Updates

When a new version is ready, a small **Update** banner appears. Updating reloads the new files and keeps Aria's friends.

## Files

| File | Role |
| --- | --- |
| `public/manifest.webmanifest` | Web app manifest |
| `public/sw.js` | Service worker |
| `public/offline.html` | Friendly offline fallback |
| `public/icons/` | 192, 512, 180, maskable icons |
| `app/components/PwaRegister.tsx` | Registration + update UI |
