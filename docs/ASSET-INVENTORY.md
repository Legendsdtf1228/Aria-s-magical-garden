# Asset Inventory — layered garden map rebuild

## Environment (no animals / insects / text / UI / notes)
| File | Use |
| --- | --- |
| `public/art/scenes/garden-map-landscape.webp` | Desktop / landscape 16:9–16:10 |
| `public/art/scenes/garden-map-portrait.webp` | Phone portrait |

## Character layer (consistent WebP cast, white keyed to alpha)
| File |
| --- |
| `public/art/characters/butterfly-idle.webp` |
| `public/art/characters/bunny-idle.webp` |
| `public/art/characters/bird-idle.webp` |
| `public/art/characters/ladybug-idle.webp` |
| `public/art/characters/bee-idle.webp` |
| `public/art/characters/frog-idle.webp` |
| `public/art/characters/cat-idle.webp` |
| `public/art/characters/puppy-idle.webp` |

## Removed from garden map
- Visible hotspot bubbles / glow rings
- SVG `GardenAnimal` overlays on the map
- Duplicate picnic bunny
- DEV auto `dev-hotspots` class
- Baked title “Aria’s Garden”
- Old `garden-map.webp` (animals baked in) — superseded; keep file unused

## Layers in `GardenMap.tsx`
1. `map-env-layer` — background image only  
2. `MapCharacterLayer` — collected friends only  
3. `map-hotspot-layer` — invisible semantic buttons  
4. `map-ui-layer` — “Aria’s Magical Garden” text + parent flower + arrows  

Debug hotspots: pass `debugHotspots={true}` explicitly (off in production).
