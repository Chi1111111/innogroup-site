# Japan Market collection

Admin entry: `/admin/japan-market`, protected by the existing Admin login gate.

The GitHub workflow runs daily at 14:17 UTC (02:17 NZST / 03:17 NZDT) and also supports manual dispatch. Scheduled start times may be delayed by GitHub. No additional scheduled job or API quota was added.

`npm run japan-market:sync:carapis` now invokes a reporting wrapper. It stores the latest 90 runs in `public/data/japan-market/sync-history.json`: start/end time, result, pagination, request counts, accepted/rejected counts, rejection categories, inventory changes, and photo-detail outcomes. This file is public; only safe aggregate statistics and a GitHub run link belong here. Never write credentials, raw API responses, or private customer data into reports.

The collector and browser share `src/data/japanMarketQuality.mjs`. It rejects malformed brand/model strings, impossible years and mileage. It does not attempt to repair or guess corrupted names. If inventory is empty or more than 20% of input records fail validation, collection fails before inventory files are written. The workflow commits only the report on failure, leaving the previous published inventory in place. Photo-detail failures are reported as partial success and can retain previously collected photos.

Failed/cancelled runs are finalized where GitHub allows cleanup steps to execute. Reports are also uploaded as workflow artifacts. A force cancellation, runner outage, push failure, or deployment failure can prevent a report from appearing on the site; Admin therefore links to GitHub and warns when the deployed snapshot is older than 36 hours. Records are deployed snapshots, not live workflow state. No historical metrics are fabricated before the first instrumented run.

The collector checkpoints safe aggregate progress in the runner's temporary directory after every page and detail batch. Each CARAPIS response, including its body, has a 20-second attempt timeout, and the collector has a 20-minute internal deadline inside the workflow's 30-minute job limit. A listing timeout fails without replacing the last good inventory. If only photo enrichment reaches the deadline, remaining galleries are skipped and the fresh listing is published with existing photos where available.

Verification: `npm run check`. For an offline browser check, start Vite on `127.0.0.1:4179` with dummy `VITE_SUPABASE_URL=https://admin-test.invalid` and `VITE_SUPABASE_ANON_KEY=local-browser-test`, then run `node scripts/verify-japan-market-ui.mjs`. The browser test intercepts external requests, mocks Admin authentication and report data, and writes screenshots only under ignored `tmp/`. Integration tests use captured fixture records and do not call CARAPIS.

Deployment caution: local sample inventory may be older than the production daily snapshot. Publish code without replacing the latest remote inventory with an older local sample. The browser filter protects existing snapshots immediately after the code deployment; the next successful instrumented run produces clean inventory and a real report.
