type ContractStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'cancelled';
export type ContractType = 'vehicle-purchase' | 'deposit';

export interface VehicleContract {
  id: string;
  contractType: ContractType;
  status: ContractStatus;
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  signedAt?: string;
  signedIpNote?: string;
  signedUserAgent?: string;
  client: {
    name: string;
    address: string;
    email: string;
    phone: string;
    driversLicenceNo: string;
  };
  purchasedVehicle: {
    make: string;
    year: string;
    model: string;
    vinOrRegistration: string;
    odometer: string;
    fuelType: string;
    colour: string;
    engineCapacity: string;
    wofDetails: string;
    firstRegisteredNz: string;
    specialPurpose: string;
  };
  tradeIn: {
    enabled: boolean;
    registrationNo: string;
    make: string;
    year: string;
    engineCapacity: string;
    model: string;
    chassisFrameOrVin: string;
    firstRegisteredNz: string;
    vicWofDetails: string;
    colour: string;
    motivePower: string;
    odometer: string;
    purchasePrice: string;
    encumbranceBalance: string;
    netAllowance: string;
    payEncumbranceTo: string;
  };
  payment: {
    salePriceIncGst: string;
    accessoriesDescription: string;
    accessoriesValueIncGst: string;
    subtotalIncGst: string;
    lessNetTradeInAllowance: string;
    netPrice: string;
    depositOnSigning: string;
    additionalPayments: string;
    dueOnDelivery: string;
    totalPayments: string;
    balanceOutstanding: string;
    financeBy: string;
    financeTermMonths: string;
  };
  acknowledgements: {
    businessUseClauseApplies: boolean;
    termsAccepted: boolean;
    cinProvided: boolean;
    signDocumentsAccepted: boolean;
    odometerAcknowledged: boolean;
    privacyAccepted: boolean;
    depositForfeitureAccepted: boolean;
  };
  signatures: {
    purchaserName?: string;
    purchaser?: string;
    salespersonName?: string;
    salesperson?: string;
    innoGroupName?: string;
    innoGroup?: string;
  };
  depositAgreement?: {
    date: string;
    clientName: string;
    anticipationOf: string;
    applicantName: string;
    depositAmount: string;
    nextStepContactName: string;
    returnEmail: string;
    contactPersonName: string;
    contactAvailability: string;
    acknowledgementName: string;
    preOrderVehicle: string;
  };
}

const CONTRACT_STORAGE_KEY = 'inno:vehicle-contracts:v1';

function createContractId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `contract-${crypto.randomUUID()}`;
  }

  return `contract-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

export function createEmptyContract(contractType: ContractType = 'vehicle-purchase'): VehicleContract {
  const now = new Date().toISOString();

  return {
    id: createContractId(),
    contractType,
    status: 'draft',
    createdAt: now,
    client: {
      name: '',
      address: '',
      email: '',
      phone: '',
      driversLicenceNo: '',
    },
    purchasedVehicle: {
      make: '',
      year: '',
      model: '',
      vinOrRegistration: '',
      odometer: '',
      fuelType: '',
      colour: '',
      engineCapacity: '',
      wofDetails: '',
      firstRegisteredNz: '',
      specialPurpose: '',
    },
    tradeIn: {
      enabled: false,
      registrationNo: '',
      make: '',
      year: '',
      engineCapacity: '',
      model: '',
      chassisFrameOrVin: '',
      firstRegisteredNz: '',
      vicWofDetails: '',
      colour: '',
      motivePower: '',
      odometer: '',
      purchasePrice: '',
      encumbranceBalance: '',
      netAllowance: '',
      payEncumbranceTo: '',
    },
    payment: {
      salePriceIncGst: '',
      accessoriesDescription: '',
      accessoriesValueIncGst: '',
      subtotalIncGst: '',
      lessNetTradeInAllowance: '',
      netPrice: '',
      depositOnSigning: '',
      additionalPayments: '',
      dueOnDelivery: '',
      totalPayments: '',
      balanceOutstanding: '',
      financeBy: 'Customer',
      financeTermMonths: '',
    },
    acknowledgements: {
      businessUseClauseApplies: false,
      termsAccepted: false,
      cinProvided: false,
      signDocumentsAccepted: false,
      odometerAcknowledged: false,
      privacyAccepted: false,
      depositForfeitureAccepted: false,
    },
    signatures: {},
    depositAgreement: {
      date: '',
      clientName: '',
      anticipationOf: '',
      applicantName: '',
      depositAmount: '',
      nextStepContactName: '',
      returnEmail: '',
      contactPersonName: '',
      contactAvailability: '',
      acknowledgementName: '',
      preOrderVehicle: '',
    },
  };
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadContracts(): VehicleContract[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(CONTRACT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveContracts(contracts: VehicleContract[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(CONTRACT_STORAGE_KEY, JSON.stringify(contracts));
}

export function upsertContract(contract: VehicleContract) {
  const contracts = loadContracts();
  const index = contracts.findIndex((item) => item.id === contract.id);

  if (index >= 0) {
    contracts[index] = contract;
  } else {
    contracts.unshift(contract);
  }

  saveContracts(contracts);
  return contracts;
}

export function getContractById(id: string) {
  return loadContracts().find((contract) => contract.id === id) ?? null;
}

export function formatDateTime(value?: string) {
  if (!value) return '-';

  try {
    return new Intl.DateTimeFormat('en-NZ', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function money(value: string) {
  return value?.trim() ? `$${value.trim()} NZD` : '$________ NZD';
}
