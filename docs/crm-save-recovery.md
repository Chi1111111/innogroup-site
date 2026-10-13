# CRM save and vehicle request recovery

CRM reads now return `{ state, version }`. Saves require `expectedVersion` and use
`save_crm_state` to check the version while locking the CRM row. Website enquiry
updates and the CRM document commit in the same database transaction. Stale saves
return HTTP 409; the client blocks queued writes and offers to export the local
draft before reading the current cloud state. Existing CRM payloads are unchanged.

The migration grants execution only to `service_role`, uses SECURITY INVOKER, and
preserves the existing custom admin-session check on the Edge Function.

## Release order

1. Verify the target project and existing website_leads migration. The inspected
   production project on 13 October 2026 did not have this table, and its admin-api
   was older than this working tree. Do not overwrite production with the whole
   local tree or assume all earlier migrations have run.
2. Apply the prerequisite website-lead schema and the new CRM migration to the
   intended environment, then deploy the matching admin-api and frontend together.
   Older frontends are deliberately rejected with a refresh message on save.
3. Verify login, CRM loading, a save, and a conflict using synthetic records in a
   staging environment. Do not use real customer records for destructive tests.

## Verification

- `npm run check`: TypeScript, lint, unit tests, production build.
- `node scripts/verify-admin-workspace.mjs`: local mocked browser workflow,
  failed saves, retry, version conflicts, draft export, and reload.
- `node scripts/verify-vehicle-recovery.mjs`: failed vehicle navigation clears
  the previous vehicle; returning retries the live catalog without a reload.
- `node scripts/verify-crm-database.mjs`: real PostgreSQL semantics in a temporary
  PGlite instance; rollback at either write, stale versions, RPC permissions.
  Install the test engine with
  `npm install --prefix tmp/crm-db-test --no-package-lock --ignore-scripts @electric-sql/pglite`.

No production database changes are performed by these tests.
