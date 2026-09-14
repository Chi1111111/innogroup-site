# Japan Market — Japan Cars collection

Admin: `/admin/japan-market`, behind the existing Admin authentication gate. This replaces only the Japan Market collection page; CRM, contracts, invoices and vehicle administration retain their existing routes.

## Current integration status

The owner confirmed authorization to collect and reuse Japan Cars content on 14 September 2026. The available source access is currently anonymous/public only. Live verification collected 25 vehicles and 498 gallery image URLs. Larger runs encountered source redirects to previously viewed cars after repeated detail access; the source page also contains an exceeded-limit/CAPTCHA message. **A stable 5,000-vehicle daily run has not been demonstrated.** Failed full runs preserve the previous inventory. Do not claim the job is running in production merely because the workflow file exists locally.

The collector stops on source access redirects, HTTP 401/403/429, or access challenges. It does not solve CAPTCHAs, rotate identities, or reset sessions to evade source limits. A source-approved bulk-access session, whitelist, or official data feed is needed to finish integration. An ordinary login may still have limits.

## Run

```sh
npm ci
npm run japan-market:sync:japancars
```

The default target is 5,000 valid Japanese inventory records. Optional `--target=25` permits a bounded verification run. For a smoke test that cannot overwrite website data:

```sh
node scripts/sync-japancars-japan-market.mjs --target=25 --output=tmp/japancars-smoke
```

`npm run japan-market:update` now selects Japan Cars. The explicit `japan-market:sync:carapis` command remains available for legacy work. Do not run both collectors against the same output at the same time.

When provided by the operator, `JAPANCARS_COOKIE_FILE` reads a local file containing the authorized source Cookie header. Alternatively set `JAPANCARS_COOKIE` as a runner secret (the workflow references the GitHub repository secret of that name). Never place source cookies in `VITE_` variables, committed files, command arguments, logs, or browser code. Do not expect a short-lived login session to run indefinitely: expiration stops collection and appears in the report.

## Daily job

The existing `.github/workflows/japan-market-daily-sync.yml` is configured for Japan Cars at 00:00 Pacific/Auckland, using 11:00/12:00 UTC schedules and a daylight-saving gate. It supports manual dispatch, serializes runs, and keeps seven-day data artifacts. This configuration takes effect only after the workflow change reaches the repository's default branch. GitHub can delay scheduled starts; successful collection must still be committed and deployed before the site updates.

Defaults: `JAPANCARS_TARGET=5000`, one concurrent request, at least 350 ms between request starts, 30-second attempt timeout, up to three attempts for transient failures. The workflow allows 240 minutes with a 230-minute internal deadline. `JAPANCARS_CONCURRENCY` may be 1–3 if the source permits concurrent access; all workers retain the same source access limits. The command-line default deadline is 110 minutes; the daily workflow overrides it.

Admin 手动扫描 calls the authenticated japan-market-scan Edge Function. It dispatches the fixed main-branch workflow, checks for existing runs, and keeps credentials server-only in Vault. The RPC is executable only by service_role. Credential provisioning is pending explicit approval to transfer the existing GitHub login credential; until configured, the button returns a configuration error. Refresh only reads deployed reports.

## Data and price rules

- Follow real stock-list pagination with `country=Japan&perPage=10`. The source renders only the first ten items before lazy loading, so using 100 and reading just the HTML would silently skip vehicles.
- Deduplicate stock numbers; confirm the detail's stock number matches the requested vehicle; exclude overseas, unavailable, malformed and photo-less records. Stop on repeated pagination or nine consecutive detail failures.
- Store complete `window.allImages` gallery URLs, parsed as JSON without executing remote JavaScript. The website lazy-loads the source photos. **This is not a binary photo backup or a local image mirror.** Source image availability remains external.
- Display an explicit `fobPriceNzd`, never rename or reuse legacy `estimatedNzdPrice` values. Source `FOB`, `CAR PRICE` and vehicle-body amounts follow the owner's requested FOB display policy. Keep `sourcePriceType`, `sourcePriceAmount`, `sourcePriceCurrency`, conversion rate and check time for audit. Freight-inclusive `CIF/CFR/C&F` and unknown amounts remain enquiry-only; no freight amount is guessed or subtracted.
- Read the source's NZD exchange rate and match its rounding: convert by the source base rate, round to an integer, then the nearest ten. The captured Toyota Isis example produces NZ$3,870, matching the supplied screenshot. No hard-coded market exchange rate is used.
- Freight, insurance, NZ taxes, compliance, registration and Inno services are additional. There is no automatic landed-cost estimate in the Japan Market display.
- Cache successfully parsed details for up to six hours to resume interrupted work. Preserve actual quote/gallery check times; never mark cached prices as freshly checked. Daily runs refresh expired cache entries.

## Publish and reporting

Merge each non-empty validated batch by source ID. Preserve all existing inventory and full detail galleries; never delete vehicles merely because they were absent from a scan. Skip Japan Cars details checked within the previous seven days to prioritize new stock. Access limits stop requests but allow already validated records to publish as a partial run. Write all 128 detail shards, index, featured and manifest into a staging directory before swapping the snapshot; restore the previous directory if the swap fails. The prior local snapshot remains in ignored `tmp/japancars-cache/previous-*` for recovery. Remove old backups only after verifying the new snapshot and the exact backup directory.

The reporting wrapper retains the last 90 actual runs in `public/data/japan-market/sync-history.json`. It records target, counts, rejection reasons, page/detail requests, photos, FOB coverage, timings and source access failures, without secrets or raw source HTML. Historical CARAPIS records remain identified as CARAPIS. Counts not recorded in older runs appear as `—`.

Admin provides current snapshot totals, quote/photo completeness filters, vehicle search, 25-row pagination, CSV export including original price type, links to vehicle details, and expandable run history. It identifies snapshots older than 36 hours. It is a deployed snapshot view, not a live crawler monitor.

## Verification

`npm run check` runs TypeScript, lint, tests and the production build. `scripts/japancars.test.mjs` covers captured source markup, galleries, identity and location checks, missing values, FOB rounding, original-price retention, Cookie expiration, matching shards and preservation of the last good inventory on incomplete collection. The offline `--input=<fixture.json>` collector path does not make network requests.

The local-only `tmp/admin-preview.html` renders the actual Admin component for design review without touching production authentication; ignored temporary preview files are not deployed by Vite builds. Production `/admin/japan-market` remains protected by `AdminAuthGate`.
