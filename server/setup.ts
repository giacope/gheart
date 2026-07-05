import { randomBytes } from 'node:crypto';
import type { Request, Response, Router } from 'express';
import express from 'express';
import type { Auth } from './auth';
import type { Store } from './store';

/**
 * One-click GitHub App creation via the app manifest flow:
 * GET /api/setup renders a page that POSTs a manifest to GitHub; GitHub
 * bounces back to /api/setup/callback with a code we exchange for the app's
 * credentials (client id/secret, PEM, webhook secret), which we persist.
 * https://docs.github.com/en/apps/sharing-github-apps/registering-a-github-app-from-a-manifest
 */

function page(title: string, body: string): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { background: #0d0d14; color: #f2f2f7; font-family: -apple-system, 'Segoe UI', sans-serif;
           display: grid; place-items: center; min-height: 100vh; margin: 0; }
    main { max-width: 520px; padding: 32px; text-align: center; }
    h1 { font-size: 28px; }
    p, li { color: #9a9ab0; line-height: 1.55; font-size: 14px; text-align: left; }
    ul { padding-left: 18px; }
    code { color: #bdbdd6; font-family: ui-monospace, monospace; font-size: 13px; }
    button, a.btn { display: inline-block; background: #35d07f; color: #06281a; border: none;
      border-radius: 12px; padding: 12px 22px; font-weight: 800; font-size: 15px;
      cursor: pointer; text-decoration: none; margin-top: 12px; }
    details { text-align: left; margin-top: 18px; background: #191924; border: 1px solid #2b2b3c;
      border-radius: 12px; padding: 12px 16px; font-size: 13px; }
    pre { overflow-x: auto; white-space: pre-wrap; word-break: break-all; }
  </style>
</head>
<body><main>${body}</main></body>
</html>`;
}

export function setupRouter(auth: Auth, store: Store): Router {
  const r = express.Router();

  r.get('/', (req: Request, res: Response) => {
    if (auth.appCredentials()) {
      res.send(
        page(
          'gheart is configured',
          `<h1>💚 Already configured</h1>
           <p>The gheart GitHub App is set up. If you want to start over, delete the app on
           GitHub and remove the <code>app</code> entry from the data file (or unset the
           <code>GITHUB_APP_*</code> env vars).</p>
           <a class="btn" href="/">Back to gheart</a>`,
        ),
      );
      return;
    }

    const base = auth.baseUrl(req);
    const manifest = {
      name: `gheart-${randomBytes(2).toString('hex')}`,
      url: base,
      redirect_url: `${base}/api/setup/callback`,
      callback_urls: [`${base}/api/auth/callback`],
      setup_url: base,
      public: false,
      request_oauth_on_install: true,
      default_permissions: {
        // Exactly what swiping needs — nothing else.
        pull_requests: 'write',
        contents: 'read',
        checks: 'read',
        metadata: 'read',
      },
    };

    res.send(
      page(
        'Set up gheart',
        `<h1>💚 Create the gheart GitHub App</h1>
         <p>This registers a GitHub App on your account with least-privilege permissions:</p>
         <ul>
           <li><strong>Pull requests: read/write</strong> — list PRs, submit reviews</li>
           <li><strong>Checks &amp; contents: read</strong> — CI status and diffs</li>
         </ul>
         <p>GitHub will ask you to confirm (you can rename the app there). Afterwards you land
         back here and gheart is configured automatically — no restart needed.</p>
         <form action="https://github.com/settings/apps/new" method="post">
           <input type="hidden" name="manifest" value='${JSON.stringify(manifest).replace(/'/g, '&#39;')}' />
           <button type="submit">Create GitHub App</button>
         </form>`,
      ),
    );
  });

  r.get('/callback', (req: Request, res: Response) => {
    void (async () => {
      const code = String(req.query.code || '');
      if (!code) {
        res.status(400).send(page('Setup failed', '<h1>💔 Missing code</h1><p>Try again from <a href="/api/setup">/api/setup</a>.</p>'));
        return;
      }
      const ghRes = await fetch(`https://api.github.com/app-manifests/${code}/conversions`, {
        method: 'POST',
        headers: { accept: 'application/vnd.github+json', 'user-agent': 'gheart' },
      });
      if (!ghRes.ok) {
        const text = await ghRes.text().catch(() => '');
        throw new Error(`manifest conversion failed (${ghRes.status}): ${text.slice(0, 200)}`);
      }
      const app = (await ghRes.json()) as {
        id: number;
        slug: string;
        client_id: string;
        client_secret: string;
        webhook_secret: string | null;
        pem: string;
        html_url: string;
      };
      store.setAppCredentials({
        appId: app.id,
        slug: app.slug,
        clientId: app.client_id,
        clientSecret: app.client_secret,
        pem: app.pem,
        webhookSecret: app.webhook_secret,
      });
      console.log(`gheart: GitHub App "${app.slug}" (id ${app.id}) configured via manifest flow`);

      res.send(
        page(
          'gheart configured',
          `<h1>💚 App created: ${app.slug}</h1>
           <p>Credentials are saved — gheart is now in multi-user GitHub App mode. Next:</p>
           <ul>
             <li><strong>Install it on your repos</strong> so they show up in the picker.</li>
             <li>Optionally pin the credentials with fnox/mise for backup:
               <code>fnox set GITHUB_APP_CLIENT_SECRET</code></li>
           </ul>
           <a class="btn" href="/api/auth/install">Install on your repos →</a>
           <details>
             <summary>App credentials (also in the gheart data file)</summary>
             <pre>GITHUB_APP_ID=${app.id}
GITHUB_APP_SLUG=${app.slug}
GITHUB_APP_CLIENT_ID=${app.client_id}
GITHUB_APP_CLIENT_SECRET=${app.client_secret}</pre>
             <p>Manage the app at <a href="${app.html_url}" style="color:#58a6ff">${app.html_url}</a></p>
           </details>`,
        ),
      );
    })().catch((err) => {
      console.error('gheart: setup callback failed:', err);
      res
        .status(502)
        .send(
          page(
            'Setup failed',
            `<h1>💔 Setup failed</h1><p>${err instanceof Error ? err.message : 'unknown error'}</p>
             <a class="btn" href="/api/setup">Try again</a>`,
          ),
        );
    });
  });

  return r;
}
