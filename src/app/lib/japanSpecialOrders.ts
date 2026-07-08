import { createClient } from '@supabase/supabase-js';
import type { JapanSpecialOrderVehicle } from '../hooks/useJapanSpecialOrders';

type JapanSpecialOrdersStateRow = {
  id: string;
  payload: JapanSpecialOrderVehicle[] | null;
};

const JAPAN_SPECIAL_ORDERS_STATE_ID = 'main';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function assertSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.');
  }

  return supabase;
}

export async function loadJapanSpecialOrdersState() {
  const client = assertSupabase();
  const { data, error } = await client
    .from('japan_special_orders_state')
    .select('id,payload')
    .eq('id', JAPAN_SPECIAL_ORDERS_STATE_ID)
    .maybeSingle();

  if (error) throw error;
  return (data as JapanSpecialOrdersStateRow | null)?.payload ?? null;
}

export async function saveJapanSpecialOrdersState(vehicles: JapanSpecialOrderVehicle[]) {
  const client = assertSupabase();
  const { error } = await client.from('japan_special_orders_state').upsert(
    {
      id: JAPAN_SPECIAL_ORDERS_STATE_ID,
      payload: vehicles,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) throw error;
}
