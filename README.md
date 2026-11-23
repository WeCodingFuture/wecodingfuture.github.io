# site/ — wecodefuture.net (GitHub Pages)

Published to the GitHub repo `wecodingfuture/wecodingfuture.github.io` (branch `main`, root).
- `kiradefteri/privacy/` → AppConfig.privacyURL and App Store Connect "Privacy Policy URL"
- `kiradefteri/support/` → App Store Connect "Support URL"
- `data/rent-rules-tr.json` → AppConfig.remoteRulesURL. Monthly TÜFE update: edit, validate with the app's RuleSet tests, push.
  Must stay identical in schema to `apps/rent-increase-tracker/Resources/rent-rules-tr.json`; bump `updatedAt`.
- Custom domain `wecodefuture.net` is set in repo Settings → Pages only AFTER DNS records are live (otherwise the
  github.io address redirects to a domain that does not resolve yet).
