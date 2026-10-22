import { BatteryCharging, Car, Globe2, MapPin } from 'lucide-react';

// Full sourcing descriptions are available from the animated import routes.
export const sourceMarkets = [
  {
    id: 'japan',
    title: { en: 'Japan', zh: '日本' },
    icon: Car,
    summary: { en: 'Auctions & dealer stock', zh: '拍卖与车商库存' },
    text: { en: 'Quality used vehicles, auction access, dealer stock and export support.', zh: '优质二手车、拍卖资源、车商库存及出口支持。' },
  },
  {
    id: 'china',
    title: { en: 'China', zh: '中国' },
    icon: BatteryCharging,
    summary: { en: 'Selected EV, MPV & commercial supply', zh: '精选 EV、MPV 与商用车型' },
    text: { en: 'A selective supplementary channel focused on EVs, MPVs and commercial opportunities.', zh: '精选补充渠道，重点关注 EV、MPV 及商用车型机会。' },
  },
  {
    id: 'macau',
    title: { en: 'Macau', zh: '澳门' },
    icon: MapPin,
    summary: { en: 'Selected stock & regional sourcing', zh: '精选车源与区域采购' },
    text: { en: 'Selected Macau supply and regional sourcing opportunities for trade and sourcing partners.', zh: '面向车商和采购合作方的澳门及区域市场车源机会。' },
  },
  {
    id: 'other',
    title: { en: 'Other Markets', zh: '其他市场' },
    icon: Globe2,
    summary: { en: 'Further right-hand-drive channels being explored', zh: '持续拓展其他适合右舵市场的渠道' },
    text: { en: 'We continue to explore supply channels from other right-hand-drive friendly overseas markets.', zh: '我们持续拓展其他适合右舵市场的海外车源渠道。' },
  },
];
