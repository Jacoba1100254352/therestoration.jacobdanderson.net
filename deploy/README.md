# Direct production rollout

The v4 production boundary is one loopback-bound Node process. It serves the static application, contact API, health
endpoints, and exact release identity under the unprivileged `restoration` account. Production does not use Docker or
Compose, and Nginx is the only public listener.

## First v4.0.1 direct rollout

1. Install Node `24.18.1` at `/usr/bin/node`. Run `sudo deploy/systemd/install-service.sh`, then replace every
   placeholder in `/etc/therestoration/app.env`. Keep both environment files owned by `root:restoration` with mode
   `0640`. SMTP must use implicit TLS or STARTTLS; readiness fails closed when mail is incomplete.
2. In the existing TLS server block, remove competing broad static or proxy locations and include
   `deploy/nginx/therestoration.locations.conf`. Test the complete Nginx configuration before reloading it.
3. Check out the annotated release tag beneath `/srv/therestoration/releases` as the unprivileged `restoration`
   deployment user. Run:

   ```bash
   NPM_CONFIG_CACHE=/srv/therestoration/shared/npm-cache \
   deploy/systemd/prepare-release.sh /srv/therestoration/releases/<release>
   ```

   Preparation requires a clean checkout at the exact fetched `origin/main` and tag, rejects source-local environment
   files, performs clean development and production-only installs, audits/signature checks, lint/type/tests/build,
   accessibility and browser checks, and a direct runtime smoke test.
4. Run `sudo deploy/systemd/promote-release.sh <candidate>`. Promotion writes only the non-secret release identity to
   `/etc/therestoration/release.env`, selects the candidate atomically, restarts the service, reloads Nginx, and verifies
   SMTP configuration readiness, exact release identity, matching front-end HTML, strict response headers, cross-site
   denial, and reserved-route denial over both local IPv4 and IPv6 TLS paths. Health/readiness use the minimal
   `{ "ok": true }` payload; release identity is verified independently through `/release.json`.
5. If any gate fails, the previous prepared direct release and its release identity are restored automatically. To
   roll back intentionally, promote a prior prepared release directory.
6. From an external network, verify the exact public release:

   ```bash
   VERIFY_RESTORATION_EXPECT_RELEASE=v4.0.1 \
   VERIFY_RESTORATION_EXPECT_COMMIT=<full-40-character-commit> \
   npm run verify:public
   ```

This deployment does not modify DNS, certificates, routing, or firewall policy. Preserve both address families and
every existing A and AAAA record; A or AAAA records are not troubleshooting controls. If one family fails, repair the
host listener, certificate coverage, route, or firewall separately without changing DNS.

The `verify:public` check validates the served front-end metadata, navigation, sitemap, and 404 behavior as well as the
backend identity. A matching `/release.json` alone does not prove that the front-end build was promoted. Check service
`STATIC_ROOT` overrides and competing Nginx static locations when the backend is current but public pages are stale.
The [September 2026 recovery handoff](../docs/server-recovery-2026-09-10.md) records the observed mismatch and acceptance criteria.
