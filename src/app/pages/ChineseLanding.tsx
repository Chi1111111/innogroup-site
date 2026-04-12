import { Calculator, Car, CheckCircle, MessageCircle, Ship, Wrench } from 'lucide-react';
import { Link } from 'react-router';

const searchTopics = [
  '奥克兰二手车',
  '新西兰进口车',
  '日本进口车',
  '新西兰买车',
  '日本拍卖车源',
  '进口车落地价',
];

const services = [
  {
    icon: Car,
    title: '日本车源代找',
    copy: '根据预算、车型、年份、公里数、颜色和配置，帮你从日本拍卖、车行网络或本地精选车源里筛选合适选择。',
  },
  {
    icon: Calculator,
    title: '清晰落地价估算',
    copy: '提前解释车价、汇率、运输、合规、服务费等费用，让你在买车前更清楚大概预算。',
  },
  {
    icon: Ship,
    title: '进口流程协助',
    copy: '从选车、报价、运输到新西兰合规和交付，我们提供实际流程支持，减少信息差。',
  },
  {
    icon: Wrench,
    title: '售后与伙伴支持',
    copy: '交车后也可以继续协助维修、配件、车身喷漆、轮胎和合作商推荐。',
  },
];

const buyerSteps = [
  '告诉我们你想买什么车，例如混动 SUV、家用 MPV、性能车或预算内通勤车。',
  '我们根据你的需求筛选日本进口车或合适的本地车源，并说明优缺点。',
  '确认预算后，我们协助你了解落地价、时间线、合规和交付流程。',
  '车辆到达后，我们继续提供实际用车和售后伙伴支持。',
];

export function ChineseLanding() {
  return (
    <div className="bg-background pt-20">
      <section className="relative overflow-hidden bg-[#101010] px-4 py-20 text-white sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(199,162,74,0.22),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_42%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-5 py-2 text-sm font-semibold text-primary">
              中文买车服务 · Auckland NZ
            </div>

            <h1 className="max-w-4xl text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
              在新西兰买二手车、进口车，找 Inno Group 帮你从日本选车
            </h1>

            <p className="max-w-3xl text-lg leading-8 text-white/74 sm:text-xl">
              如果你正在搜索“二手车”“进口车”“日本进口车”“新西兰买车”或“奥克兰买车”，
              Inno Group Ltd 可以帮你用更清楚的方式了解车源、预算、落地价和后续支持。
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/contact" className="button-primary">
                获取买车建议
              </Link>
              <a
                href="https://wa.me/642885307225"
                target="_blank"
                rel="noopener noreferrer"
                className="button-secondary-dark"
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp 中文咨询
              </a>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-7">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              常见搜索需求
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {searchTopics.map((topic) => (
                <div
                  key={topic}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/78"
                >
                  {topic}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-18 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl space-y-4">
            <p className="section-kicker">What We Help With</p>
            <h2>我们可以帮你解决哪些买车问题？</h2>
            <p>
              我们不是只给你一个车价，而是帮你把“车况、预算、进口流程、落地成本、后续维修”
              这些买车前最容易不清楚的地方逐步讲明白。
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div key={service.title} className="section-card p-6">
                  <div className="mb-5 inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3>{service.title}</h3>
                  <p className="mt-3 text-sm leading-7">{service.copy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-18 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-4">
            <p className="section-kicker">Buying Process</p>
            <h2>适合哪些人？</h2>
            <p>
              如果你想在奥克兰或新西兰其他地区买车，但不确定是买本地二手车、
              日本进口车还是预订车源，我们可以先帮你做方向判断。
            </p>
          </div>

          <div className="space-y-4">
            {buyerSteps.map((step, index) => (
              <div key={step} className="flex gap-4 rounded-[24px] border border-black/5 bg-[#faf7f0] p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {index + 1}
                </div>
                <p className="text-foreground/76">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-18 sm:py-24">
        <div className="mx-auto max-w-4xl rounded-[30px] bg-[#111] p-6 text-center text-white shadow-[0_30px_90px_rgba(0,0,0,0.22)] sm:p-10">
          <CheckCircle className="mx-auto mb-5 h-10 w-10 text-primary" />
          <h2 className="text-white">想找一台适合自己的车？</h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/68">
            发给我们你的预算、用途、想要车型和时间线，我们可以先给你一个更清楚的买车方向。
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/contact" className="button-primary">
              填写询价表
            </Link>
            <a
              href="https://wa.me/642885307225"
              target="_blank"
              rel="noopener noreferrer"
              className="button-secondary-dark"
            >
              WhatsApp 联系我们
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
