type LeadType = 'japan' | 'china' | 'local' | 'finance' | 'sell' | 'support';
type LeadForm = 'quote' | 'japan_market' | 'baw_m8' | 'wox';
type GoogleTag = (command: 'event', name: string, params: Record<string, string | number>) => void;

/** Call only after the submission service confirms success. Never pass contact details. */
export function trackLeadSubmitted(form: LeadForm, leadType: LeadType) {
  if (typeof window === 'undefined') return;
  const gtag = (window as Window & { gtag?: GoogleTag }).gtag;
  if (!gtag) return;

  // Tracking failure must not turn a delivered enquiry into a submission error.
  try {
    // Sales campaigns should not optimise towards sellers or existing-customer support.
    if (leadType !== 'sell' && leadType !== 'support') {
      gtag('event', 'conversion', {
        send_to: 'AW-18414597432/p-jECJu30_IcELjq4cxE',
        value: 1.0,
        currency: 'NZD',
      });
    }
    gtag('event', 'generate_lead', {
      send_to: 'G-T7DCQ8KBH3',
      form_name: form,
      lead_type: leadType,
    });
  } catch {
    // The enquiry has already been delivered; analytics is best effort.
  }
}
