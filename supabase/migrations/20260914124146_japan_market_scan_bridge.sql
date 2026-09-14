-- Only the authenticated server function can read this named Vault credential.
create or replace function public.japan_market_dispatch_credential()
returns text language sql security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'japan_market_github_dispatch' limit 1;
$$;
revoke all on function public.japan_market_dispatch_credential() from public, anon, authenticated;
grant execute on function public.japan_market_dispatch_credential() to service_role;
