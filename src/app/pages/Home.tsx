import { useState } from 'react';
import { ArrowRight, BatteryCharging, Clock3, FileCheck2, ReceiptText, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';
import { Hero } from '../components/Hero';
import { PriceCalculator } from '../components/PriceCalculator';
import { QuoteFormSection } from '../components/QuoteFormSection';
import { useLanguage } from '../components/SiteTranslator';
import '../../styles/home-sections.css';

const buyerAssurances = [
  {
    title: { en: 'Availability reconfirmed', zh: '再次确认实际库存' },
    icon: Clock3,
    text: { en: 'The source listing is checked again before you make any commitment.', zh: '在你作出任何购买承诺前，我们会再次核实车源是否仍然有效。' },
  },
  {
    title: { en: 'Condition and documents', zh: '确认车况与文件' },
    icon: FileCheck2,
    text: { en: 'Available condition information and key documents are reviewed before purchase.', zh: '购买前会核对可用车况信息与关键车辆文件。' },
  },
  {
    title: { en: 'Itemised cost estimate', zh: '费用明细清楚可见' },
    icon: ReceiptText,
    text: { en: 'Vehicle, shipping, compliance and service allowances are explained before a final quote.', zh: '正式报价前，先说明车辆、运输、合规与服务费用预估。' },
  },
  {
    title: { en: 'Local support', zh: '新西兰本地支持' },
    icon: ShieldCheck,
    text: { en: 'Auckland-based support continues through compliance, handover and ownership questions.', zh: '奥克兰本地团队持续协助合规、交付和用车问题。' },
  },
];

export function Home() {
  const { text } = useLanguage();
  const [estimateRequest, setEstimateRequest] = useState<{ message: string } | null>(null);

  return (
    <>
      <Hero />

      <section className="home-sourcing" aria-label={text({ en: 'More ways to find your car', zh: '更多找车方式' })}>
        <div className="section-shell home-sourcing-strip">
          <article className="home-sourcing-option">
            <span className="home-sourcing-icon"><Search size={22} aria-hidden="true" /></span>
            <div className="home-sourcing-copy">
              <h2>{text({ en: 'Have a car in mind?', zh: '已经有心仪的车型？' })}</h2>
              <p>{text({
                en: 'Share your model and budget. We help with sourcing, condition checks, clear pricing, shipping and local delivery.',
                zh: '告诉我们车型和预算，我们协助寻找车源、核对车况、说明费用，并协调运输与本地交付。',
              })}</p>
              <Link to="/vehicles/find-my-car" className="button-secondary">
                {text({ en: 'Request a Vehicle Search', zh: '提交找车需求' })}<ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </article>
          <article className="home-sourcing-option">
            <span className="home-sourcing-icon"><BatteryCharging size={22} aria-hidden="true" /></span>
            <div className="home-sourcing-copy">
              <h2>{text({ en: 'Explore cars from China.', zh: '看看中国车型。' })}</h2>
              <p>{text({
                en: 'Selected EVs, MPVs, SUVs and commercial models from manufacturer and supplier channels, with warranty support where applicable.',
                zh: '通过精选主机厂与供应商渠道，了解 EV、MPV、SUV 及商用车型；符合条件的车型可提供质保支持。',
              })}</p>
              <Link to="/vehicles/china" className="button-primary">
                {text({ en: 'Explore China Vehicles', zh: '查看中国车型' })}<ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </article>
        </div>
      </section>

      <div id="calculator" className="scroll-mt-20"><PriceCalculator onEnquire={(message) => setEstimateRequest({ message })} /></div>

      <div id="quote" className="scroll-mt-20">
        <QuoteFormSection estimateRequest={estimateRequest} beforeForm={
          <div id="partners" className="home-assurances">
            <div className="home-assurances-heading">
              <h2><ShieldCheck size={17} aria-hidden="true" />{text({ en: 'Before you commit', zh: '确认购买之前' })}</h2>
              <p>{text({ en: 'An enquiry is not a purchase commitment. We explain the details before you decide.', zh: '咨询不等于承诺购买。先把细节说明清楚，再由你决定。' })}</p>
            </div>
            <div className="home-assurances-grid">
              {buyerAssurances.map((assurance) => {
                const Icon = assurance.icon;
                return <div key={assurance.title.en} className="home-assurance">
                  <Icon size={20} aria-hidden="true" />
                  <div><h3>{text(assurance.title)}</h3><p>{text(assurance.text)}</p></div>
                </div>;
              })}
            </div>
          </div>
        } />
      </div>
    </>
  );
}
