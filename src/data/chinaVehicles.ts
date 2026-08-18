import {
  type ChinaVehicleCard,
  type LocalizedText,
  woxExpansionVehicles,
} from './woxExpansionVehicles';

const t = (en: string, zh: string): LocalizedText => ({ en, zh });

const bawM8: ChinaVehicleCard = {
  slug: 'baw-m8',
  name: 'BAW M8 EV / REEV MPV',
  subtitle: t('Practical new-energy 7/9-seater people mover', '实用型新能源7/9座大型MPV'),
  image: '/images/baw-m8/baw-m8-color-grey.jpg',
  href: '/vehicles/china/baw-m8',
  priceFrom: 'NZ$62,999',
  status: t('Available', '现可咨询'),
  category: 'Passenger',
  tags: [t('7 / 9 seats', '7 / 9座'), t('EV / REEV enquiry', '纯电 / 增程咨询'), t('Family / shuttle', '家庭 / 接送')],
  summary: t('A full-size MPV for large families, airport shuttle, hotel transfer, tourism and business transport enquiries.', '面向大家庭、机场接送、酒店接驳、旅游及商务客运需求的全尺寸MPV。'),
};

const existingWoxVehicles: Record<string, ChinaVehicleCard> = {
  'wox-nebula': {
    slug: 'wox-nebula',
    name: 'WOX Nebula Electric SUV',
    subtitle: t('WVTA-certified premium electric C-SUV', '通过WVTA认证的高端纯电C-SUV'),
    image: '/images/wox-nebula/nebula-front-car.jpg',
    href: '/vehicles/china/wox-nebula',
    priceFrom: 'NZ$55,500',
    status: t('Available', '现可咨询'),
    category: 'Passenger',
    tags: [t('5-seat SUV', '5座SUV'), t('63.8 kWh LFP', '63.8 kWh磷酸铁锂'), t('420 km WLTP', '420 km WLTP')],
    summary: t('A 5-door electric SUV with a 63.8 kWh LFP battery, 150 kW front motor and connected cabin.', '五门纯电SUV，配备63.8 kWh磷酸铁锂电池、150 kW前置电机和互联座舱。'),
  },
  'wox-zeny': {
    slug: 'wox-zeny',
    name: 'WOX Zeny Solar Electric City Car',
    subtitle: t('Compact solar-assisted 4-seat electric city car', '紧凑型太阳能辅助四座城市电动车'),
    image: '/images/wox-zeny/zeny-front.jpg',
    href: '/vehicles/china/wox-zeny',
    priceFrom: '',
    status: t('Available', '现可咨询'),
    category: 'Passenger',
    tags: [t('Solar assisted', '太阳能辅助'), t('10.2 kWh LFP', '10.2 kWh磷酸铁锂'), t('151 km + solar assist', '151 km + 太阳能辅助')],
    summary: t('A compact solar-assisted city car with customizable panels and flexible cargo space.', '带可定制车身面板和灵活储物空间的太阳能辅助城市电动车。'),
  },
  'wox-shera': {
    slug: 'wox-shera',
    name: 'WOX Shera Taxi Edition',
    subtitle: t('Right-hand-drive 4-seat electric taxi sedan', '右舵四座纯电出租车轿车'),
    image: '/images/wox-shera/shera-front.jpg',
    href: '/vehicles/china/wox-shera',
    priceFrom: '',
    status: t('Available', '现可咨询'),
    category: 'Passenger',
    tags: [t('RHD taxi edition', '右舵出租版'), t('31.55 kWh LFP', '31.55 kWh磷酸铁锂'), t('300 km CLTC', '300 km CLTC')],
    summary: t('A compact electric taxi edition designed around practical right-hand-drive fleet operation.', '面向右舵车队运营的紧凑型纯电出租车。'),
  },
  'wox-air': {
    slug: 'wox-air',
    name: 'WOX AIR Electric Sedan',
    subtitle: t('5-seat electric fastback sedan', '五座纯电快背轿车'),
    image: '/images/wox-air/air-front-car.jpg',
    href: '/vehicles/china/wox-air',
    priceFrom: 'NZ$48,500',
    status: t('Coming Soon', '即将推出'),
    category: 'Passenger',
    tags: [t('5-seat sedan', '5座轿车'), t('51 / 64 kWh LFP', '51 / 64 kWh磷酸铁锂'), t('355-430 km WLTP', '355-430 km WLTP')],
    summary: t('A sleek electric sedan with LFP battery options, fast charging and refined everyday usability.', '流线型纯电轿车，提供不同容量磷酸铁锂电池、快充和舒适日常使用体验。'),
  },
};

const expanded = new Map(woxExpansionVehicles.map((vehicle) => [vehicle.slug, vehicle]));
const vehicle = (slug: string) => expanded.get(slug)!;

export const chinaVehicles: ChinaVehicleCard[] = [
  bawM8,
  existingWoxVehicles['wox-nebula'],
  vehicle('wox-pixel'),
  vehicle('wox-neo'),
  existingWoxVehicles['wox-zeny'],
  vehicle('wox-loop'),
  vehicle('wox-nova-one'),
  vehicle('wox-nova-pulse'),
  existingWoxVehicles['wox-shera'],
  vehicle('wox-rivo'),
  existingWoxVehicles['wox-air'],
  vehicle('wox-magic'),
  vehicle('wox-thamud'),
  vehicle('wox-carry'),
  vehicle('wox-move'),
  vehicle('wox-relay'),
  vehicle('wox-metro'),
  vehicle('wox-elara'),
  vehicle('wox-horizon'),
];
