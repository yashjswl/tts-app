# Duologue

Live speech-to-text and text-to-speech for two-way conversations between a person who types (for example, someone who is deaf or hard of hearing) and a person who speaks.

- **Speaker side:** tap the microphone. Speech is transcribed live (Deepgram for streaming languages, Sarvam AI for the rest).
- **Typist side:** type a message. It is read aloud (Sarvam voice, falling back to the browser's voice).
- Built for Indian languages and code-switching: Hindi, Hinglish, Bengali, Tamil, Telugu, Kannada, Marathi, Gujarati, Urdu, Malayalam, Punjabi, Odia and more, plus English.
- **Invite-only.** There is no public sign-up. One administrator adds, disables, resets and removes people.

## Two layouts

| | Face to face | Shared |
|---|---|---|
| For | A phone or tablet lying between two people | A laptop or desktop, in person or on a call |
| Layout | The screen splits in two; the far half is turned 180° so the person opposite reads it the right way up | One shared transcript, a composer under it, and a speaker panel (mic, language, text size) in a side rail |
| Default | Touch devices | Everything else |

Switch any time in Settings. On phones in Shared view, a Type / Speak switch keeps the controls within thumb reach. On desktop, `Alt + M` starts and stops the microphone.

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars   # then fill in the values
npm run api                      # Pages Functions + local D1 on http://localhost:8788
npm run dev                      # Vite on http://localhost:5173 (proxies /api, /sarvam-api, /deepgram-api)
```

Open http://localhost:5173 and sign in as the administrator with the email below and the `ADMIN_INITIAL_PASSWORD` from `.dev.vars`.

## Deploying to Cloudflare Pages

1. **Create the database** (once) and paste the printed `database_id` into `wrangler.toml`:
   ```bash
   npx wrangler d1 create duologue
   ```
   Tables are created automatically on first request.
2. **Set the secrets** in Pages → Settings → Variables and Secrets (or `npx wrangler pages secret put NAME`):
   - `SARVAM_API_KEY`
   - `DEEPGRAM_API_KEY`
   - `ADMIN_INITIAL_PASSWORD`: pick a strong password; you will use it for your first sign-in.
3. **Build settings:** command `npm run build`, output directory `dist`.
4. Deploy (`npm run deploy`, or push to the connected branch).

### The administrator

The administrator is `yashasvi.jaiswal.2006@gmail.com` (override with an `ADMIN_EMAIL` variable). The account is created the first time that email signs in with `ADMIN_INITIAL_PASSWORD`. After that the password lives only in the database; change it from Settings → Change password, and remove `ADMIN_INITIAL_PASSWORD` if you like.

Lost the admin password? Delete the admin row so the bootstrap runs again:

```bash
npx wrangler d1 execute duologue --remote --command "DELETE FROM users WHERE role = 'admin'"
```

### Managing people

Open **People** (administrators only). **Add person** generates a temporary password, shown once. The person must choose their own password at first sign-in. You can reset a password, disable (signs them out immediately and blocks sign-in) or delete anyone except the administrator.

## Security notes

- Passwords are hashed with PBKDF2-SHA256. Sessions are random tokens in an `HttpOnly`, `SameSite=Lax` cookie; only a hash is stored, so sessions can be revoked.
- Failed sign-ins are rate limited per email and IP address.
- The Deepgram and Sarvam proxies require a signed-in session, only forward the paths the app uses, and never forward the session cookie upstream. API keys stay on the server.
- Requests that change state, and WebSocket upgrades, must come from the app's own origin.

## Project layout

```
functions/            Cloudflare Pages Functions
  _middleware.js      session lookup, origin check, route guards
  _lib/               crypto, D1 schema, auth and HTTP helpers
  api/auth/           login, logout, me, password
  api/admin/users/    list, create, update, delete (administrator only)
  deepgram-api/       authenticated WebSocket proxy
  sarvam-api/         authenticated REST proxy
src/
  config.js           product name and tagline
  pages/              Login, Conversation, People (admin), forced password change
  layouts/            FaceToFaceLayout, SharedLayout
  components/         Transcript, Composer, MicButton, StatusBoard, Dialog, settings...
  hooks/              useHybridSpeech (STT/TTS), useConversation
  context/            Auth and preferences
  styles/             tokens, base, ui, conversation, auth, admin
```

`PRODUCT.md` records who the product is for and its principles.
