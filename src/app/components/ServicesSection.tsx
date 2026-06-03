import { ArrowRight, CheckCircle } from 'lucide-react';
import { Link } from 'react-router';
import { services } from '../../data';
import { useLanguage } from './SiteTranslator';

export function ServicesSection() {
  const { text } = useLanguage();
  const practicalItems = [
    {
      en: 'Bodywork and repaint support when the car needs cosmetic attention',
      zh: '车辆需要外观处理时，可协助对接钣金和喷漆支持',
    },
    {
      en: 'Mechanical workshop referrals for diagnostics and repairs',
      zh: '车辆诊断和维修可推荐合适的机械维修资源',
    },
    {
      en: 'Partner access and parts help for ongoing ownership',
      zh: '为后续用车提供合作方对接和配件寻找支持',
    },
  ];
  const ownerNeeds = [
    { en: 'Dents, scratches, and paintwork', zh: '凹痕、划痕和喷漆处理' },
    { en: 'Repair referrals and diagnostics', zh: '维修推荐和故障诊断' },
    { en: 'Parts help for Japanese models', zh: '日本车型配件支持' },
    { en: 'Easy access to trusted partners', zh: '更方便对接可信合作伙伴' },
  ];

  return (
    <section id="services" className="bg-[#fbfaf6] px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-primary/12 bg-white p-8 shadow-xl md:p-10">
            <div className="mb-5 inline-flex items-center rounded-full bg-primary/10 px-5 py-2">
              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                {text({ en: 'Services & Ownership', zh: '服务与车主支持' })}
              </span>
            </div>

            <h2 className="max-w-3xl text-4xl md:text-5xl text-foreground">
              {text({ en: 'Practical Help After Purchase', zh: '购车后的实际帮助' })}
            </h2>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
              {text({
                en: 'After-sales services and ownership benefits in one place: repairs, paint, parts, and trusted partner support.',
                zh: '售后服务和车主权益集中在这里：维修、喷漆、配件，以及可信合作伙伴支持。',
              })}
            </p>

            <div className="mt-8 space-y-4">
              {practicalItems.map((item) => (
                <div key={item.en} className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-primary/10 p-1.5 text-primary">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <p className="text-base leading-7 text-foreground/80">{text(item)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] bg-gradient-to-br from-[#171717] via-[#201a0d] to-[#111111] p-8 text-white shadow-2xl md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {text({ en: 'What Owners Usually Need', zh: '车主常见需求' })}
            </p>
            <div className="mt-6 space-y-5">
              {ownerNeeds.map((item) => (
                <div
                  key={item.en}
                  className="rounded-2xl border border-white/10 bg-white/6 px-5 py-4 text-sm leading-7 text-white/78"
                >
                  {text(item)}
                </div>
              ))}
            </div>

            <div className="mt-8">
              <a
                href="#partners"
                className="inline-flex items-center gap-2 rounded-2xl border border-primary/35 bg-primary/12 px-6 py-3 font-semibold text-primary transition-all hover:scale-105 hover:bg-primary hover:text-white"
              >
                {text({ en: 'Explore Partner Spaces', zh: '查看合作伙伴' })}
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                className="group rounded-[30px] border border-primary/12 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        {service.eyebrow}
                      </span>
                    </div>
                    <h3 className="mt-5 text-3xl font-semibold text-foreground transition-colors group-hover:text-primary">
                      {service.title}
                    </h3>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-primary/18 to-primary/6 p-4 text-primary shadow-md">
                    <Icon className="h-8 w-8" />
                  </div>
                </div>

                <p className="mt-5 text-base leading-8 text-muted-foreground">{service.description}</p>

                <div className="mt-7 space-y-3">
                  {service.bullets.map((bullet) => (
                    <div key={bullet} className="flex items-start gap-3">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                      <p className="text-sm leading-7 text-foreground/80">{bullet}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:bg-primary/90"
          >
            {text({ en: 'Talk to Us About After-Sales Support', zh: '咨询售后支持' })}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
