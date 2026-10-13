// Isolated PostgreSQL engine; never connects to a production database.
// npm install --prefix tmp/crm-db-test --no-package-lock --ignore-scripts @electric-sql/pglite
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { PGlite } from '../tmp/crm-db-test/node_modules/@electric-sql/pglite/dist/index.js';

const db = new PGlite();
try {
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
  for (const path of ['supabase-crm-state.sql',
    'supabase/migrations/20260827084916_create_japan_market_website_leads.sql',
    'supabase/migrations/20261013005610_crm_atomic_save.sql']) {
    await db.exec(await fs.readFile(path, 'utf8'));
  }
  const id = '00000000-0000-4000-8000-000000000001';
  await db.query(`insert into website_leads(id,request_kind,name,preferred_contact,message) values ($1,'vehicle_enquiry','Synthetic test','email','Synthetic enquiry')`, [id]);
  const empty = { leads: [], orders: [], loanCars: [] };
  const save = async (state, version) => (await db.query('select save_crm_state($1::jsonb,$2::timestamptz) as result', [JSON.stringify(state), version])).rows[0].result.version;
  const v1 = await save(empty, null);
  const withLead = { ...empty, leads: [{ id: `web:${id}`, name: 'Synthetic test', notes: 'first', nextFollowUp: '' }] };
  // Force the second half of the transaction to fail.
  await db.exec(`create function fail_lead_update() returns trigger language plpgsql as $$ begin raise exception 'synthetic lead failure'; end $$;
    create trigger fail_lead before update on website_leads for each row execute function fail_lead_update();`);
  await assert.rejects(save(withLead, v1), /synthetic lead failure/);
  assert.deepEqual((await db.query("select payload from crm_state where id='main'")).rows[0].payload, empty);
  assert.equal((await db.query('select synced_to_crm_at from website_leads')).rows[0].synced_to_crm_at, null);
  await db.exec('drop trigger fail_lead on website_leads;');
  await db.exec(`create function fail_crm_update() returns trigger language plpgsql as $$ begin raise exception 'synthetic crm failure'; end $$;
    create trigger fail_crm before update on crm_state for each row execute function fail_crm_update();`);
  await assert.rejects(save(withLead, v1), /synthetic crm failure/);
  assert.equal((await db.query('select synced_to_crm_at from website_leads')).rows[0].synced_to_crm_at, null);
  await db.exec('drop trigger fail_crm on crm_state;');
  // Two callers with the same read version: only one may commit.
  const results = await Promise.allSettled([save(withLead, v1), save(empty, v1)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  const conflict = results.find(r => r.status === 'rejected');
  assert.equal(conflict.reason.code, '40001');
  assert.equal((await db.query('select notes from website_leads')).rows[0].notes, 'first');
  assert.notEqual((await db.query('select synced_to_crm_at from website_leads')).rows[0].synced_to_crm_at, null);
  const permissions = (await db.query(`select
    has_function_privilege('anon','public.save_crm_state(jsonb,timestamptz)','execute') as anon,
    has_function_privilege('authenticated','public.save_crm_state(jsonb,timestamptz)','execute') as authenticated,
    has_function_privilege('service_role','public.save_crm_state(jsonb,timestamptz)','execute') as service`)).rows[0];
  assert.deepEqual(permissions, { anon: false, authenticated: false, service: true });
  console.log('PASS atomic rollback on either failure, stale-version rejection, website enquiry sync, restricted RPC permissions.');
} finally { await db.close(); }
