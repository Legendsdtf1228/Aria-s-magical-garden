# Voice recording list — Aria's Color Garden

Recorded clips are the **preferred** voice source. Place MP3 files here:

```text
public/audio/voice/en-US/
public/audio/voice/es-MX/
```

If a file is missing, the game quietly falls back to the best natural browser voice.
The game does **not** require any recordings to run.

## Delivery notes for recording

- Warm, friendly preschool-teacher energy (original — not imitating any real person)
- One language per file
- Short conversational lines
- Clear pronunciation over speed
- Mexican Spanish for `es-MX` files
- Leave a little natural silence at the start/end of each clip

## Required phrase files

| Phrase key | English file | Spanish file | English script | Spanish script |
| --- | --- | --- | --- | --- |
| `welcome` | `en-US/welcome.mp3` | `es-MX/welcome.mp3` | Welcome to the color garden! | ¡Bienvenida al jardín de colores! |
| `tryAgain` | `en-US/try-again.mp3` | `es-MX/try-again.mp3` | Let's try another one. | Intentemos otra vez. |
| `greatJob` | `en-US/great-job.mp3` | `es-MX/great-job.mp3` | Great job! | ¡Muy bien! |
| `playAgain` | `en-US/play-again.mp3` | `es-MX/play-again.mp3` | Want to play again? | ¿Quieres jugar otra vez? |
| `newFriend` | `en-US/new-friend.mp3` | `es-MX/new-friend.mp3` | You found a new friend! | ¡Encontraste un nuevo amigo! |
| `caughtFriend` | `en-US/caught-friend.mp3` | `es-MX/caught-friend.mp3` | You caught a friend! | ¡Atrapaste un amigo! |
| `findColor` | `en-US/find-color.mp3` | `es-MX/find-color.mp3` | Can you find the matching basket? | ¿Puedes encontrar la canasta correcta? |
| `findRed` | `en-US/find-red.mp3` | `es-MX/find-red.mp3` | Can you find the red basket? | ¿Puedes encontrar la canasta roja? |
| `findBlue` | `en-US/find-blue.mp3` | `es-MX/find-blue.mp3` | Can you find the blue basket? | ¿Puedes encontrar la canasta azul? |
| `findYellow` | `en-US/find-yellow.mp3` | `es-MX/find-yellow.mp3` | Can you find the yellow basket? | ¿Puedes encontrar la canasta amarilla? |
| `findGreen` | `en-US/find-green.mp3` | `es-MX/find-green.mp3` | Can you find the green basket? | ¿Puedes encontrar la canasta verde? |
| `findPurple` | `en-US/find-purple.mp3` | `es-MX/find-purple.mp3` | Can you find the purple basket? | ¿Puedes encontrar la canasta morada? |
| `findOrange` | `en-US/find-orange.mp3` | `es-MX/find-orange.mp3` | Can you find the orange basket? | ¿Puedes encontrar la canasta anaranjada? |
| `findPink` | `en-US/find-pink.mp3` | `es-MX/find-pink.mp3` | Can you find the pink basket? | ¿Puedes encontrar la canasta rosa? |
| `findBrown` | `en-US/find-brown.mp3` | `es-MX/find-brown.mp3` | Can you find the brown basket? | ¿Puedes encontrar la canasta café? |
| `findBlack` | `en-US/find-black.mp3` | `es-MX/find-black.mp3` | Can you find the black basket? | ¿Puedes encontrar la canasta negra? |
| `findWhite` | `en-US/find-white.mp3` | `es-MX/find-white.mp3` | Can you find the white basket? | ¿Puedes encontrar la canasta blanca? |
| `findAnimal` | `en-US/find-animal.mp3` | `es-MX/find-animal.mp3` | Can you find the animal? | ¿Puedes encontrar el animal? |
| `findShape` | `en-US/find-shape.mp3` | `es-MX/find-shape.mp3` | Can you find the matching shape? | ¿Puedes encontrar la forma correcta? |
| `howMany` | `en-US/how-many.mp3` | `es-MX/how-many.mp3` | How many do you see? | ¿Cuántas ves? |
| `feedFriend` | `en-US/feed-friend.mp3` | `es-MX/feed-friend.mp3` | What should we feed our friend? | ¿Qué le damos de comer a nuestro amigo? |
| `movement` | `en-US/movement.mp3` | `es-MX/movement.mp3` | Let's move together! | ¡Vamos a movernos juntos! |
| `previewEnglish` | `en-US/preview-english.mp3` | _(optional)_ | Hi there! This is the English garden voice. | — |
| `previewSpanish` | _(optional)_ | `es-MX/preview-spanish.mp3` | — | ¡Hola! Esta es la voz del jardín en español. |

## Dynamic lines (TTS fallback only for now)

These still use the selected natural browser voices until you add matching clips:

- Color / animal / shape / number / food names
- Movement commands (Clap, Stomp, Spin, Jump, Wiggle, Freeze)
- Friend names (Butterfly, Bunny, …)
- Counting one–five in both languages

## Parent settings honesty

- **Natural voice available** — a Natural/Online/Neural system voice was detected, or recordings are in use when present
- **Using device voice** — falling back to a standard installed voice

Never claim the experience is “fully natural” unless recordings exist or a natural system voice was detected.
