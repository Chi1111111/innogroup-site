# Admin and Invoice backend: shared password + Supabase Edge Functions + Resend

The Admin area uses one shared password. There is no email login, magic link, or Supabase Auth prompt in the UI.

The password is stored only as the Supabase Edge Function secret `ADMIN_SHARED_PASSWORD`. A successful login returns an eight-hour signed session token. The signing key is stored as `ADMIN_SESSION_SECRET`; neither secret is included in the browser bundle.

## Frontend environment

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
VITE_INVOICE_CLOUD_ENABLED=true
```

The publishable key only identifies the Supabase project. Direct browser access to the Admin tables remains blocked by RLS.

## Edge Function secrets

Set these in Supabase Edge Function Secrets:

```env
ADMIN_SHARED_PASSWORD=YOUR_ADMIN_PASSWORD
ADMIN_SESSION_SECRET=A_LONG_RANDOM_SECRET
RESEND_API_KEY=re_...
INVOICE_FROM_EMAIL=INNO GROUP LTD <invoice@send.innogroup.co.nz>
INVOICE_REPLY_TO=innogroup.shawn@gmail.com
```

## Database

Apply `supabase/migrations/20260814015151_create_shared_admin_session.sql`. It creates the private login-attempt audit table used for rate limiting and updates invoice email audit records to support the shared Admin identity.

## Deploy

Deploy both functions with platform JWT verification disabled because they verify the custom signed Admin session themselves:

- `supabase/functions/admin-api/index.ts`
- `supabase/functions/send-invoice/index.ts`

The legacy `send-admin-magic-link` function is deployed as a disabled HTTP 410 endpoint.

The Admin API limits failed password attempts, signs expiring sessions, validates supported CRUD operations, and accesses protected tables only on the server. The invoice function validates the Admin session, invoice state, recipient and PDF, applies send-rate limits, uses a Resend idempotency key, and writes an audit event.
