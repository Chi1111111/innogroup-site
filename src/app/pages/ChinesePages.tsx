import {
  Calculator,
  Car,
  CheckCircle,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  Ship,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router';

const zhNav = [
  { to: '/zh', label: '中文首页' },
  { to: '/zh/vehicles', label: '车辆服务' },
  { to: '/zh/services', label: '进口与售后' },
  { to: '/zh/finance', label: '车辆贷款' },
  { to: '/zh/about', label: '关于我们' },
  { to: '/zh/contact', label: '中文咨询' },
];

const keywordTopics = [
  '奥克兰二手车',
  '新西兰进口车',
  '日本进口车',
  '新西兰买车',
  '日本拍卖车源',
  '进口车落地价',
];

const vehicleTypes = ['混动 SUV', '家用 MPV', '低公里通勤车', '性能车', '豪华轿车', '商务用车'];

const supportItems = [
  {
    icon: Search,
    title: '需求分析',
    copy: '先了解你的预算、用途、品牌偏好、年份、公里数和配置，再判断适合买本地车还是日本进口车。',
  },
  {
    icon: Car,
    title: '车源筛选',
    copy: '通过日本拍卖、车行网络和本地精选车源，帮你筛选更适合新西兰使用场景的车辆。',
  },
  {
    icon: Calculator,
    title: '落地价说明',
    copy: '提前说明车价、汇率、运输、合规和服务费用，帮助你理解总预算，而不是只看车价。',
  },
  {
    icon: Wrench,
    title: '售后支持',
    copy: '交车后可继续协助维修、配件、轮胎、车身喷漆和合作商推荐。',
  },
];

function ChinesePageShell({
  children,
  eyebrow,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="bg-background pt-20">
      <section className="relative overflow-hidden bg-[#101010] px-4 py-16 text-white sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(199,162,74,0.22),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_42%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap gap-2">
            {zhNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/72 transition-colors hover:border-primary/40 hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="max-w-4xl space-y-5">
            <div className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-5 py-2 text-sm font-semibold text-primary">
              {eyebrow}
            </div>
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
              {title}
            </h1>
            <p className="text-lg leading-8 text-white/74 sm:text-xl">{subtitle}</p>
          </div>
        </div>
      </section>

      {children}
    </div>
  );
}

function ChineseCta() {
  return (
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
  );
}

export function ChineseHome() {
  return (
    <ChinesePageShell
      eyebrow="中文买车服务 · Auckland NZ"
      title="在新西兰买二手车、进口车，找 Inno Group 帮你从日本选车"
      subtitle="如果你正在搜索二手车、进口车、日本进口车、新西兰买车或奥克兰买车，Inno Group Ltd 可以帮你更清楚地了解车源、预算、落地价和后续支持。"
    >
      <section className="px-4 py-18 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="space-y-4">
            <p className="section-kicker">Search Topics</p>
            <h2>我们覆盖的常见中文搜索需求</h2>
            <p>
              这个中文页面组是为了让搜索“奥克兰二手车、进口车、日本进口车、新西兰买车”的用户，
              能更快找到 Inno Group，并了解我们实际能提供什么帮助。
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {keywordTopics.map((topic) => (
              <div key={topic} className="section-card p-5 font-semibold text-foreground">
                {topic}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-18 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl space-y-4">
            <p className="section-kicker">What We Help With</p>
            <h2>我们可以帮你解决哪些买车问题？</h2>
            <p>
              我们不是只给你一个车价，而是帮你把车况、预算、进口流程、落地成本、后续维修这些买车前最容易不清楚的地方逐步讲明白。
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {supportItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="section-card p-6">
                  <div className="mb-5 inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3>{item.title}</h3>
                  <p className="mt-3 text-sm leading-7">{item.copy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <ChineseCta />
    </ChinesePageShell>
  );
}

export function ChineseVehicles() {
  return (
    <ChinesePageShell
      eyebrow="车辆服务"
      title="日本进口车与新西兰二手车推荐"
      subtitle="不确定买什么车？我们可以根据你的预算、家庭人数、通勤距离、油耗要求和品牌偏好，帮你筛选适合新西兰使用的车辆。"
    >
      <section className="px-4 py-18 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl space-y-4">
            <p className="section-kicker">Vehicle Types</p>
            <h2>常见可协助寻找的车型</h2>
            <p>
              页面上的车辆只是示例。如果你想找特定品牌、预算或配置，我们可以帮你做更具体的推荐。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicleTypes.map((type) => (
              <div key={type} className="section-card p-6">
                <Car className="mb-4 h-7 w-7 text-primary" />
                <h3>{type}</h3>
                <p className="mt-3 text-sm leading-7">
                  可根据预算、年份、公里数、颜色、配置、保养记录和用途进一步筛选。
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-18 sm:py-24">
        <div className="mx-auto max-w-5xl space-y-5 text-center">
          <h2>买车前，我们建议先确认预算和用途</h2>
          <p className="mx-auto max-w-3xl">
            例如你是想买家庭 SUV、低油耗混动车、商务车、性能车，还是预算内的代步车。
            需求越清楚，越容易找到合适的车，而不是只看价格。
          </p>
          <Link to="/vehicles" className="button-primary">
            查看英文车辆示例
          </Link>
        </div>
      </section>

      <ChineseCta />
    </ChinesePageShell>
  );
}

export function ChineseServices() {
  return (
    <ChinesePageShell
      eyebrow="进口与售后"
      title="日本进口流程、落地价和售后支持"
      subtitle="从日本车源、拍卖报价、运输、合规到新西兰交付，我们会尽量把流程讲清楚，并在交车后继续提供合作伙伴支持。"
    >
      <section className="px-4 py-18 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          {[
            ['选车与报价', '根据需求筛选车源，并解释车价、车况、年份、公里数和配置。'],
            ['落地价估算', '说明运输、汇率、合规、服务费和其他可能费用，帮助你提前判断预算。'],
            ['售后伙伴', '可协助维修、配件、轮胎、车身喷漆、检查和合作商推荐。'],
          ].map(([title, copy]) => (
            <div key={title} className="section-card p-6">
              <Ship className="mb-4 h-7 w-7 text-primary" />
              <h3>{title}</h3>
              <p className="mt-3 text-sm leading-7">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white px-4 py-18 sm:py-24">
        <div className="mx-auto max-w-5xl space-y-5 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <h2>适合想要透明流程的买家</h2>
          <p>
            如果你担心进口流程复杂、费用不清楚、售后没人管，我们会尽量把每一步讲清楚，
            让你在做决定前知道自己在买什么。
          </p>
          <Link to="/services" className="button-primary">
            查看英文服务页面
          </Link>
        </div>
      </section>

      <ChineseCta />
    </ChinesePageShell>
  );
}

export function ChineseAbout() {
  return (
    <ChinesePageShell
      eyebrow="关于 Inno Group"
      title="奥克兰本地支持，日本车源直连"
      subtitle="Inno Group Ltd 位于奥克兰 Albany，专注帮助新西兰客户了解日本进口车、本地车源和买车后的实际支持。"
    >
      <section className="px-4 py-18 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <p className="section-kicker">Why Us</p>
            <h2>为什么中文客户会需要我们？</h2>
            <p>
              很多买家不是不想买车，而是不确定新西兰本地二手车、日本进口车、拍卖车源和落地费用之间的区别。
              我们的价值是帮你把这些信息讲清楚。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {['奥克兰本地沟通', '日本车源筛选', '费用说明更清楚', '交车后继续支持'].map((item) => (
              <div key={item} className="section-card p-6">
                <CheckCircle className="mb-4 h-7 w-7 text-primary" />
                <h3>{item}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ChineseCta />
    </ChinesePageShell>
  );
}

export function ChineseFinance() {
  return (
    <ChinesePageShell
      eyebrow="车辆贷款"
      title="新西兰买车贷款与预算规划"
      subtitle="如果你想在新西兰买二手车、进口车或日本预订车源，我们可以先帮你了解预算、首付、还款周期和大概每周还款压力。"
    >
      <section className="px-4 py-18 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          {[
            ['预算判断', '先根据你的预算、首付和每周可接受还款范围，判断适合买什么价位的车。'],
            ['贷款咨询', '如果你需要 finance，我们可以收集基本信息，并协助你了解下一步申请流程。'],
            ['买车建议', '贷款只是买车的一部分，我们也会一起考虑车况、油耗、维修和长期使用成本。'],
          ].map(([title, copy]) => (
            <div key={title} className="section-card p-6">
              <Calculator className="mb-4 h-7 w-7 text-primary" />
              <h3>{title}</h3>
              <p className="mt-3 text-sm leading-7">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white px-4 py-18 sm:py-24">
        <div className="mx-auto max-w-5xl space-y-5 text-center">
          <h2>先看预算，再决定车源</h2>
          <p className="mx-auto max-w-3xl">
            很多买家一开始只看车价，但实际还要考虑保险、保养、轮胎、维修、油耗和贷款还款。
            我们可以帮你把预算范围先理清楚，再去找更合适的车。
          </p>
          <Link to="/finance" className="button-primary">
            查看英文贷款页面
          </Link>
        </div>
      </section>

      <ChineseCta />
    </ChinesePageShell>
  );
}

export function ChineseContact() {
  return (
    <ChinesePageShell
      eyebrow="中文咨询"
      title="联系 Inno Group，获取买车或进口车建议"
      subtitle="你可以通过电话、邮件、WhatsApp 或表单联系我们。告诉我们预算、用途和想要车型，我们会帮你判断下一步。"
    >
      <section className="px-4 py-18 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          <a href="tel:+64288530725" className="section-card p-6">
            <Phone className="mb-4 h-7 w-7 text-primary" />
            <h3>电话</h3>
            <p className="mt-3">+64 28 8530 7225</p>
          </a>
          <a href="mailto:innogroup.shawn@gmail.com" className="section-card p-6">
            <Mail className="mb-4 h-7 w-7 text-primary" />
            <h3>邮箱</h3>
            <p className="mt-3 break-all">innogroup.shawn@gmail.com</p>
          </a>
          <div className="section-card p-6">
            <MapPin className="mb-4 h-7 w-7 text-primary" />
            <h3>地址</h3>
            <p className="mt-3">Unit 1A, 331 Rosedale Road, Albany, Auckland</p>
          </div>
        </div>
      </section>

      <ChineseCta />
    </ChinesePageShell>
  );
}
