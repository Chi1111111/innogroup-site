import { useEffect, useState } from 'react';
import {
  partnerPlaceholders,
  type PartnerPlaceholder,
} from '../../data/services';

const PARTNERS_STORAGE_KEY = 'inno:partners:v1';

function readPartners(): PartnerPlaceholder[] {
  if (typeof window === 'undefined') {
    return partnerPlaceholders;
  }

  try {
    const raw = window.localStorage.getItem(PARTNERS_STORAGE_KEY);
    if (!raw) return partnerPlaceholders;
    const parsed = JSON.parse(raw) as PartnerPlaceholder[];
    if (!Array.isArray(parsed) || parsed.length === 0) return partnerPlaceholders;
    return parsed;
  } catch {
    return partnerPlaceholders;
  }
}

export function usePartnersCatalog() {
  const [partners, setPartnersState] = useState<PartnerPlaceholder[]>(() => readPartners());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PARTNERS_STORAGE_KEY, JSON.stringify(partners));
  }, [partners]);

  const setPartners = (nextPartners: PartnerPlaceholder[]) => {
    setPartnersState(nextPartners);
  };

  const resetPartners = () => {
    setPartnersState(partnerPlaceholders);
  };

  return {
    partners,
    setPartners,
    resetPartners,
  };
}
