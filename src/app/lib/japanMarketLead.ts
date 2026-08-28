import { getSupabaseClient, IS_SUPABASE_CONFIGURED } from './supabaseClient';

export interface JapanMarketLeadPayload {
  requestKind: 'vehicle_enquiry' | 'sourcing_request';
  name: string;
  phone: string;
  email: string;
  preferredContact: 'phone' | 'email' | 'either';
  message: string;
  company?: string;
  vehicleId?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  estimatedPrice?: number;
  sourcePage: string;
}

export async function submitJapanMarketLead(payload: JapanMarketLeadPayload) {
  if (!IS_SUPABASE_CONFIGURED) {
    throw new Error('Online enquiries are temporarily unavailable. Please call or WhatsApp Inno Group.');
  }

  const { data, error } = await getSupabaseClient().functions.invoke('capture-lead', { body: payload });
  if (error) throw new Error(error.message || 'Unable to send enquiry.');
  return data as { received: boolean; id?: string };
}
