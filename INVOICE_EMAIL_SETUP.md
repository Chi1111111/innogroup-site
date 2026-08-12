# Invoice email: Supabase Edge Function + Resend

Invoice email no longer uses an EmailJS template. The browser creates the PDF, then calls the authenticated `send-invoice` Supabase Edge Function. The function loads the saved invoice from Postgres, checks the caller's `app_metadata.role`, sends through Resend, and writes an audit event.

## Frontend environment

```env
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx
VITE_INVOICE_CLOUD_ENABLED=true
```

Only use a publishable/anon key in Vite. Never add a Supabase secret key or Resend key to a `VITE_` variable.

## Supabase database

Apply `supabase-invoices.sql`. It creates:

- `public.invoices`
- `public.invoice_email_events`
- RLS policies restricted to authenticated users whose `app_metadata.role` is `admin`

Create the invoice administrator in Supabase Auth and set this server-controlled metadata:

```json
{ "role": "admin" }
```

Do not put the role in `user_metadata`; users can edit that field themselves.

## Edge Function secrets

Set these on the Supabase project, not in the frontend repository:

```env
RESEND_API_KEY=re_xxx
INVOICE_FROM_EMAIL=INNO GROUP LTD <invoices@your-verified-domain.example>
INVOICE_REPLY_TO=innogroup.shawn@gmail.com
```

Use a Resend key with `sending_access` only and restrict it to the verified sending domain when possible.

## Deploy

Deploy `supabase/functions/send-invoice/index.ts` with JWT verification enabled. The endpoint refuses anonymous users and authenticated users without the `admin` app role.

The function also validates the stored invoice status and recipient, checks the PDF signature and size, rate-limits each administrator, uses a Resend idempotency key, and records sent/failed attempts in `invoice_email_events`.
