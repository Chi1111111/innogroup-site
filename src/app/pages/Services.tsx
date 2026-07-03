import { Package, Settings, Shield, Wrench } from 'lucide-react';
import { Link } from 'react-router';
import { ServicesSection } from '../components/ServicesSection';
import { PartnerNetworkSection } from '../components/PartnerNetworkSection';
import { useLanguage } from '../components/SiteTranslator';

export function Services() {
  const { text } = useLanguage();

  return (
    <div className="pt-20">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f1115] via-[#1a1c21] to-[#251e10] px-4 py-24 text-white">
        <div className="absolute inset-0">
          <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute bottom-[-80px] right-[-40px] h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-6 py-3">
              <Settings className="w-5 h-5 text-primary" />
              <span className="text-primary font-semibold">{text({ en: 'Services & Ownership', zh: '服务与车主支持' })}</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              {text({ en: 'Simple Support', zh: '简单清晰的支持' })}
              <span className="block text-primary">{text({ en: 'For Inno Owners', zh: '面向 Inno 车主' })}</span>
            </h1>
            <p className="max-w-3xl text-xl text-white/74">
              {text({
                en: 'One page for after-sales services and ownership benefits: repairs, parts, partner referrals, and practical support after you buy.',
                zh: '售后服务和车主权益集中在这里：维修、配件、合作伙伴推荐，以及购车后的实际支持。',
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/7 p-5 backdrop-blur-sm">
              <Wrench className="mb-4 h-8 w-8 text-primary" />
              <h3 className="text-xl font-semibold text-white">{text({ en: 'Repair Help', zh: '维修协助' })}</h3>
              <p className="mt-2 text-sm leading-7 text-white/68">
                {text({ en: 'Bodywork, paint, workshop referrals, and practical repair support.', zh: '钣金、喷漆、维修厂推荐和实际维修支持。' })}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/7 p-5 backdrop-blur-sm">
              <Package className="mb-4 h-8 w-8 text-primary" />
              <h3 className="text-xl font-semibold text-white">{text({ en: 'Ownership Benefits', zh: '车主权益' })}</h3>
              <p className="mt-2 text-sm leading-7 text-white/68">
                {text({ en: 'Easier access to trusted partners, parts support, and ongoing help after purchase.', zh: '更方便地对接可信合作方、配件支持和购车后的持续帮助。' })}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/7 p-5 backdrop-blur-sm">
              <Shield className="mb-4 h-8 w-8 text-primary" />
              <h3 className="text-xl font-semibold text-white">{text({ en: 'Trusted Network', zh: '可信合作网络' })}</h3>
              <p className="mt-2 text-sm leading-7 text-white/68">
                {text({ en: 'A cleaner way to introduce four partner businesses on this page.', zh: '集中展示常用合作商家，让车主更容易找到后续支持。' })}
              </p>
            </div>
          </div>
        </div>
      </section>

      <ServicesSection />
      <PartnerNetworkSection />

      <section className="relative overflow-hidden px-4 py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-[#17120a]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(212,175,55,0.12),transparent_30%)]" />

        <div className="relative mx-auto max-w-4xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-6 py-3">
            <Settings className="w-5 h-5 text-primary" />
            <span className="text-primary font-semibold">{text({ en: 'Services & Ownership', zh: '服务与车主支持' })}</span>
          </div>
          <h2 className="text-4xl md:text-5xl text-white">
            {text({ en: 'Need Help After', zh: '买车之后需要帮助？' })}
            <span className="block mt-2 text-primary">{text({ en: 'You Buy the Car?', zh: '我们继续支持你。' })}</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-8 text-white/72">
            {text({ en: 'Contact us for repairs, body and paint, partner referrals, or parts support.', zh: '如果需要维修、钣金喷漆、合作方推荐或配件支持，可以联系我们。' })}
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-primary/25 transition-all hover:scale-105 hover:bg-primary/90"
            >
              {text({ en: 'Contact Us', zh: '联系我们' })}
            </Link>
            <a
              href="https://wa.me/64272858065"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/8 px-8 py-4 text-lg font-semibold text-white transition-all hover:scale-105 hover:border-primary/40 hover:bg-white/12"
            >
              {text({ en: 'WhatsApp Us', zh: 'WhatsApp 咨询' })}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
