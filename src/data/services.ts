import { partnerJhMotorsImage, partnerVipWheelTyreImage } from './pic';

export interface PartnerPlaceholder {
  id: string;
  name: string;
  address: string;
  website?: string;
  email?: string;
  phone?: string;
  hours?: string;
  logoSrc?: string;
  logoAlt?: string;
  logoWordmark?: {
    line1: string;
    line2?: string;
  };
  logoPanel?: 'dark' | 'light';
  logoFit?: 'contain' | 'cover';
}

export const partnerPlaceholders: PartnerPlaceholder[] = [
  {
    id: 'partner-01',
    name: 'V.I.P Wheel & Tyre',
    address: '241 Glenfield Rd, Hillcrest (next to the Z petrol station)',
    website: 'https://www.vipwheel.co.nz/',
    email: 'viptyreshop@gmail.com',
    phone: '09 212 9889',
    hours: 'Mon - Fri: 8:30am - 5:00pm',
    logoSrc: partnerVipWheelTyreImage,
    logoAlt: 'V.I.P Wheel & Tyre',
    logoPanel: 'light',
    logoFit: 'cover',
  },
  {
    id: 'partner-02',
    name: 'JH Motors',
    address: '80 Diana Drive, Wairau Valley, Auckland 0627, New Zealand',
    website: 'https://jhmotors.co.nz/vehicle-inspections/',
    email: 'jhmotors80@gmail.com',
    phone: '(09) 440 9985',
    hours: 'Mon to Sat 9am - 5:30pm',
    logoSrc: partnerJhMotorsImage,
    logoAlt: 'JH Motors',
    logoPanel: 'light',
    logoFit: 'contain',
  },
  {
    id: 'partner-03',
    name: 'North Harbour Compliance',
    address: '2D Ashfield Road, Wairau Valley, Auckland 0627',
    phone: '09 444 0014',
    logoWordmark: {
      line1: 'North Harbour',
      line2: 'Compliance',
    },
    logoPanel: 'dark',
  },
  {
    id: 'partner-04',
    name: 'GYP Auto Detailing',
    address: 'Target Road, Wairau Valley, Auckland 0627',
    phone: '021 389 818',
    logoWordmark: {
      line1: 'GYP Auto',
      line2: 'Detailing',
    },
    logoPanel: 'dark',
  },
];
