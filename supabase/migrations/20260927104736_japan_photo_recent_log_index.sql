set lock_timeout = '3s';
set statement_timeout = '30s';
create index if not exists japan_photo_jobs_recent_results_idx on public.japan_photo_jobs (updated_at desc, id) where status in ('approved','failed');
create index if not exists japan_photo_vehicles_registered_idx on public.japan_photo_vehicles (registered_at desc, id);
