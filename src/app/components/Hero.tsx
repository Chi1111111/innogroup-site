import { ArrowRight, MapPin, MessageSquareText, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import { partnerIaucImage, partnerNichiboImage, partnerPekemaImage, partnerUssImage } from '../../data/pic';
import { useLanguage } from './SiteTranslator';
import { ImportJourney } from './ImportJourney';

const supplierBadges = [
  { name: 'PEKEMA', image: partnerPekemaImage },
  { name: 'USS Japan', image: partnerUssImage },
  { name: 'Nichibo', image: partnerNichiboImage },
  { name: 'i-AUC', image: partnerIaucImage },
];

const startingPoints = [
  {
    to: '/weekly-report',
    icon: Sparkles,
    number: '01',
    title: { en: 'Show me good options', zh: '先看看本周好车' },
    note: { en: 'View this week’s selected vehicles', zh: '查看本周人工精选车辆' },
  },
  {
    to: '/vehicles/find-my-car',
    icon: MessageSquareText,
    number: '02',
    title: { en: 'Help me find a car', zh: '请 Inno 帮我找车' },
    note: { en: 'Tell us your model and budget', zh: '告诉我们车型和预算' },
  },
];

export function Hero() {
  const { text } = useLanguage();

  return (
    <ImportJourney
      introduction={<>
        <div className="import-eyebrow"><span>01</span><MapPin size={14} aria-hidden="true" />{text({ en: 'Auckland-based vehicle sourcing', zh: '奥克兰本地车辆采购服务' })}</div>
        <h1 id="import-title" className="import-title">
          <span>{text({ en: 'The right car.', zh: '找到对的车，' })}</span>
          <span className="import-title-accent">{text({ en: 'A clearer way to import.', zh: '进口更简单。' })}</span>
        </h1>
        <p className="import-intro">{text({
          en: 'Find a car through our Japan auction and dealer network, review our weekly shortlist, or tell us the exact vehicle you want. Inno coordinates the process through to New Zealand delivery.',
          zh: '通过我们的日本拍卖与车商渠道寻找车辆、查看每周精选，或直接告诉我们想要的车型。Inno 从找车到新西兰交付全程协助。',
        })}</p>
        <div className="import-primary-actions">
          <a href="#quote" className="button-primary">{text({ en: 'Tell Us What You Need', zh: '告诉我们你的需求' })}<ArrowRight size={17} /></a>
          <Link to="/weekly-report" className="import-action">{text({ en: 'View Weekly Finds', zh: '查看每周精选' })}<ArrowRight size={16} /></Link>
        </div>
        <aside className="import-starting-points" aria-label={text({ en: 'Start with what you know', zh: '从你现在的需求开始' })}>
          <p>{text({ en: 'Start with what you know', zh: '从你现在的需求开始' })}</p>
          {startingPoints.map((item) => {
            const Icon = item.icon;
            return <Link key={item.to} to={item.to}>
              <Icon size={17} aria-hidden="true" />
              <span><strong>{text(item.title)}</strong><small>{text(item.note)}</small></span>
              <span className="import-start-number">{item.number}</span><ArrowRight size={15} aria-hidden="true" />
            </Link>;
          })}
        </aside>
      </>}
      network={<div className="import-network">
        <div className="import-network-copy">
          <p>{text({ en: 'Connected sourcing network', zh: '合作车源网络' })}</p>
          <div className="import-suppliers">{supplierBadges.map((supplier) => <span key={supplier.name} title={supplier.name}><img src={supplier.image} alt={supplier.name} loading="lazy" decoding="async" /></span>)}</div>
        </div>
        <p className="import-network-note">{text({
          en: 'Japan auctions and dealer stock · selected China supply · shipping, compliance and local handover support',
          zh: '日本拍卖与车商库存 · 精选中国车源 · 海运、合规及本地交付支持',
        })}</p>
      </div>}
    />
  );
}
