# gheart mobile 💚📱

**Installable PWA that swipes your PR review queue straight to GitHub — no gheart backend.**

The web version (`../`) proxies GitHub through an Express server with a shared
`GITHUB_TOKEN`. The mobile version drops the server entirely: it talks to the
GitHub REST API directly from the browser (GitHub sends CORS headers), signed in
with **your own token**, so each person reviews with their own permissions. Add
it to your home screen and it runs fullscreen like a native app.

## Run it

```bash
cd mobile
npm install
npm run dev        # http://localhost:5174  (--host so your phone on the same Wi-Fi can reach it)
```

Open the URL on your phone → **Share → Add to Home Screen** → launch the icon.

## Test on iOS

Three ways, pick by what you need. Start the dev server first (`npm run dev`,
runs on `:5174`).

### A. iOS Simulator — Mac-only, no device, SW works (verified ✅)

Because the Simulator shares the host network, `localhost` reaches the dev
server and it counts as a secure context, so the Service Worker runs too.

```bash
# list available iPhones and grab a UDID
xcrun simctl list devices available | grep -i iphone

open -a Simulator                                   # launch the Simulator app
xcrun simctl boot "<UDID>"                           # e.g. iPhone 17 Pro
xcrun simctl bootstatus "<UDID>" -b                  # wait until fully booted
xcrun simctl openurl "<UDID>" "http://localhost:5174"  # open in Safari
xcrun simctl io "<UDID>" screenshot /tmp/gheart-sim.png  # grab a screenshot
```

Notes:
- **`openurl` may print `Operation timed out` (code 60) on a fresh boot yet the
  page still opens.** Wait for `bootstatus … Finished`, then check with a
  screenshot before retrying.
- Boot **one** device at a time — several booted sims make `simctl` sluggish and
  commands hang. Shut extras with `xcrun simctl shutdown "<UDID>"`.
- Paste a token in: copy on the Mac, then Simulator menu **Edit → Paste**
  (`Cmd+V`), or push the clipboard with `xcrun simctl pbcopy "<UDID>"`.

### B. Real iPhone over LAN — fastest, HTTP only (no SW / offline)

Same Wi-Fi, open the Network URL vite prints, e.g. `http://<mac-ip>:5174`
(`ipconfig getifaddr en0` to find `<mac-ip>`). Swiping and sending reviews work;
the Service Worker won't register over plain HTTP.

### C. Real iPhone, full PWA — HTTPS via a tunnel (demo-recording grade)

Home-screen icon launch, installability, and Service Worker all work.

```bash
ngrok http 5174        # open the https://… URL on the iPhone, then Add to Home Screen
```

## Sign in (the "send" path, as simple as it gets)

1. Create a **fine-grained token** with **Pull requests: write**
   (or a classic token with `public_repo` for public repos only) —
   <https://github.com/settings/tokens?type=beta>
2. Paste it once. It's verified via `GET /user`, then stored in `localStorage`
   on the device. No secrets ship in the app.
3. Type an `owner/repo`, and swipe:

| Gesture | Result | GitHub call |
| --- | --- | --- |
| → right | Approve | `POST /pulls/{n}/reviews` `event: APPROVE` |
| ← left | Request changes | `POST /pulls/{n}/reviews` `event: REQUEST_CHANGES` |
| ↑ up | Skip | none |

Swipes are **optimistic** — the card leaves immediately; if GitHub rejects the
review, the card flies back and a toast explains why.

## What's reused vs new

- **Reused verbatim** from the web app: all swipe/card components
  (`SwipeDeck`, `PRCard`, `ActionBar`, `MatchOverlay`, `EmptyDeck`), `styles.css`,
  and the pure libs `summarize.ts` / `media.ts` / `shared/types.ts`.
- **New for mobile**: `src/github.ts` (direct-to-GitHub client + `whoami`),
  `src/App.tsx` (token gate + optimistic rollback), PWA shell
  (`manifest.webmanifest`, `sw.js`, `icon.svg`, home-screen meta).
- **Changed**: `summarize.ts` uses the heuristic summarizer only (no server /
  API key in the browser).

## Build

```bash
npm run build      # tsc --noEmit + vite build → dist/ (static, host anywhere)
npm run preview
```

## Next steps (see `../docs/hackathon-context/mobile-app-version.md`)

- **Device Flow** login (no token pasting) — needs a tiny proxy for the
  non-CORS `login/device/code` endpoints.
- **Web Push** "your queue filled up overnight" morning trigger.
- **Capacitor** wrapper if an App Store binary / native icon is wanted.
- **Biometric unlock** (Face ID / Touch ID) guarding the stored token.
