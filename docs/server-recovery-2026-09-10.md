# Server-agent handoff: align the live Restoration front end with v4.0.2

Complete the production rollout for `therestoration.jacobdanderson.net` using the current annotated `v4.0.2` tag from
`anderson-webops/therestoration.jacobdanderson.net`. The release was moved forward within the same audit milestone;
resolve its current peeled commit and confirm that it matches `origin/main` before preparing the candidate.

## Observed failure

On September 10, `/release.json` reported v4.0.2 at `781193496e02e08a982c0293fdc2ca3e5990fccc`, but public HTML still
contained the old clickable-div mobile menu and an empty mask-icon URL. `/sitemap.xml` contained seven localhost URLs
with an August 2 timestamp, including the internal README route. An unknown page returned HTTP 500 because the selected
static files lacked `404.html`. These are observations; the responsible service override, build step, or Nginx location
has not been identified. Authenticated server access was unavailable from the local audit task.

## Recovery

1. Inspect the actual deployment adapter, service unit/drop-ins, working directory, current release symlink, and selected
   `STATIC_ROOT`. Inspect only non-secret configuration values; do not print SMTP credentials or whole environment
   files. Compare the local application response with the public response and inspect this site's Nginx locations to
   determine whether a stale static root or a separate static-file location is serving old assets.
2. Preserve the previous release, configuration, and rollback path. Use a fresh release checkout so an older local
   v4.0.2 tag cannot silently select superseded source. Confirm the fetched annotated tag, `origin/main`, and candidate
   HEAD identify the same full commit. Require the CI and direct-release checks for that commit to pass.
3. Follow `deploy/README.md` and the current `deploy/systemd/prepare-release.sh` as the unprivileged deployment user.
   Use Node 24.18.1/npm 12.0.2 and the root lockfile. Preparation builds both workspaces and verifies the generated
   front end before pruning to production dependencies. Do not reuse an older `front-end/dist` directory.
4. Correct only the configuration responsible for the mismatch so the application serves the candidate's
   `front-end/dist`. Preserve the loopback listener, proxy trust boundary, TLS-protected SMTP, Nginx security headers,
   both address families, and unrelated sites. Do not change DNS or certificates to hide a failed address family.
5. Use the current guarded promotion procedure. Its health/readiness check now accepts the API's minimal
   `{ "ok": true }` response, verifies identity separately, and compares served home HTML with the candidate over both
   local IPv4 and IPv6 TLS routes. Resolve any failed gate instead of bypassing it. Roll back if acceptance fails.

## Public acceptance

From the verified source checkout and an external network, run:

```bash
VERIFY_RESTORATION_EXPECT_RELEASE=v4.0.2 \
VERIFY_RESTORATION_EXPECT_COMMIT="$(git rev-parse 'v4.0.2^{}')" \
npm run verify:public
```

This check includes an intentionally rejected cross-site contact request; it must be blocked before mail delivery.
Do not submit a real contact message during recovery. Confirm all of the following:

- `/healthz` and `/readyz` return HTTP 200 and the minimal payload; `/release.json` matches the exact candidate.
- The home page includes generated canonical metadata and the labeled navigation button.
- `/contact` has the title `Contact | The Restoration` and its own canonical URL.
- `/sitemap.xml` lists exactly six HTTPS production URLs, with no localhost or README entry.
- An unknown page returns HTTP 404 with a usable noindex page and a working home link.
- Browser navigation and the contact form load their current assets without failures.

Report the actual cause, corrected configuration paths, final commit, and acceptance results. A current release-identity
response by itself does not establish a complete rollout.
