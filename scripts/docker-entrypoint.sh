#!/bin/sh
# Boot gheart in production. The only secret Fly holds is FNOX_AGE_KEY — the age
# identity that fnox uses to decrypt the committed fnox.toml. Everything else
# (App id/slug/client-id, base URL, data paths) is non-secret and set in
# fly.toml [env]. See Dockerfile for the whole story.
set -e
export HOME="${HOME:-/root}"

if [ -n "${GHEART_AGE_KEY_B64:-}" ]; then
  mkdir -p "$HOME/.config/fnox"
  # base64 of ~/.config/fnox/age.txt — the age identity fnox uses to decrypt
  # fnox.toml. base64 keeps the multi-line key out of shell args/logs when
  # setting the Fly secret. NOTE: the var is GHEART_* not FNOX_* on purpose —
  # fnox reads a FNOX_AGE_KEY env var as an *inline* identity and would then
  # ignore the key file entirely (silent decrypt failure).
  printf '%s' "$GHEART_AGE_KEY_B64" | base64 -d > "$HOME/.config/fnox/age.txt"
  chmod 600 "$HOME/.config/fnox/age.txt"
  if secret="$(fnox get GITHUB_APP_CLIENT_SECRET 2>/dev/null)"; then
    export GITHUB_APP_CLIENT_SECRET="$secret"
    echo "gheart: decrypted GITHUB_APP_CLIENT_SECRET via fnox"
  else
    echo "gheart: WARN — fnox could not decrypt GITHUB_APP_CLIENT_SECRET (check GHEART_AGE_KEY_B64)"
  fi
else
  echo "gheart: GHEART_AGE_KEY_B64 unset — starting without the GitHub App secret"
fi

exec npm run start
