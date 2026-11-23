# site/ — wecodefuture.net (GitHub Pages)

Studio home page (`index.html`: intro + apps/games list). Each product lives in its own folder (`/<app-id>/` with
`index.html`, `privacy/`, `support/`). Operator: Cumhur Çetinkaya, individual developer (şahıs) trading as We Code Future.
When changing `style.css`, bump the `?v=` query in every page.

Published to the GitHub repo `wecodingfuture/wecodingfuture.github.io` (branch `main`, root).
- `kiradefteri/privacy/` → AppConfig.privacyURL and App Store Connect "Privacy Policy URL"
- `kiradefteri/support/` → App Store Connect "Support URL"
- `data/rent-rules-tr.json` → AppConfig.remoteRulesURL. Monthly TÜFE update: edit, validate with the app's RuleSet tests, push.
  Must stay identical in schema to `apps/rent-increase-tracker/Resources/rent-rules-tr.json`; bump `updatedAt`.
- Custom domain `wecodefuture.net` is live (CNAME file, HTTPS enforced, domain verified on the account) since 2026-11-23.
  Email stays on the DirectAdmin host (`mail.wecodefuture.net`); never change MX / mail / SPF when editing web records.
