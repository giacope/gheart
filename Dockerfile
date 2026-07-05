# gheart — one Node process that serves the API and the built React app.
#
# Secrets stay where they already live: the age-encrypted, committed fnox.toml.
# The ONLY thing Fly holds is the age identity (GHEART_AGE_KEY_B64, a Fly
# secret), which the entrypoint uses to decrypt GITHUB_APP_CLIENT_SECRET at boot.
# The non-secret App id/slug/client-id come from fly.toml [env].
FROM node:22-slim

# fnox: grab the static musl binary matching the build arch (works on any libc).
ARG FNOX_VERSION=1.29.0
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends curl ca-certificates; \
    rm -rf /var/lib/apt/lists/*; \
    case "$(uname -m)" in \
      x86_64)        arch=x86_64 ;; \
      aarch64|arm64) arch=aarch64 ;; \
      *) echo "unsupported arch: $(uname -m)"; exit 1 ;; \
    esac; \
    curl -fsSL "https://github.com/jdx/fnox/releases/download/v${FNOX_VERSION}/fnox-${arch}-unknown-linux-musl.tar.gz" -o /tmp/fnox.tgz; \
    tar -xzf /tmp/fnox.tgz -C /tmp; \
    mv "$(find /tmp -type f -name fnox | head -1)" /usr/local/bin/fnox; \
    chmod +x /usr/local/bin/fnox; \
    rm -rf /tmp/fnox.tgz; \
    fnox --version

WORKDIR /app

# Install ALL deps: tsx/vite/cross-env are devDependencies but needed both to
# build and to run `npm start`. Do NOT set NODE_ENV=production here — npm would
# then skip them. NODE_ENV=production is applied at runtime (fly.toml + npm start).
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# The server reads PORT (default 8788) and serves dist/ when NODE_ENV=production.
EXPOSE 8788
RUN chmod +x /app/scripts/docker-entrypoint.sh
ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
