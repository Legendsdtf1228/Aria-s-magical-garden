# Optional recorded voice files

The game works without any files in this folder. Browser `speechSynthesis` is used **only** when a recorded file is missing.

## Offline generation (Cloudflare Workers AI)

Do **not** generate audio in the browser. Use the protected CLI:

```bash
npx wrangler login
npm.cmd run voice:audition
# or force regenerate:
node scripts/generate-voice-narration.mjs --audition --force
```

- Model: `elevenlabs/eleven-multilingual-v2`
- Format: `mp3_44100_128`
- Auth: Wrangler OAuth (or local `.env` `CLOUDFLARE_API_TOKEN` — never commit)
- Audition output: `public/audio/voice/audition/{voiceId}/en-US|es-MX/{phraseId}.mp3`
- Manifest: `public/audio/voice/audition/voice-manifest.json`
- Compare locally: open `/voice-audition/`

**Stop after the audition pack** and pick one `voice_id` before generating the full library into:

```
public/audio/voice/en-US/{phraseId}.mp3
public/audio/voice/es-MX/{phraseId}.mp3
```

## Phrase IDs

Identical IDs are used for English and Spanish. See `app/data/phraseManifest.ts` for gameplay keys; audition pack IDs are listed in `scripts/generate-voice-narration.mjs`.
