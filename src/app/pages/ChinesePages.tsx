import { useState } from 'react';
import {
  ArrowRight,
  Award,
  Calculator,
  Car,
  CheckCircle,
  Clock,
  DollarSign,
  FileCheck,
  Key,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Search,
  Settings,
  Shield,
  Ship,
  Sparkles,
  Star,
  TrendingUp,
  Upload,
  Users,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router';
import { BrandLogo } from '../components/BrandLogo';
import { VehicleCard } from '../components/VehicleCard';
import { useVehiclesCatalog } from '../hooks/useVehiclesCatalog';
import { heroGalleryImages } from '../../data/pic';

const vehicleCardLabels = {
  viewLarger: '查看大图',
  enquireNow: '立即咨询',
  openGallery: '打开车辆图片',
  closeGallery: '关闭图片',
  previousImage: '上一张图片',
  nextImage: '下一张图片',
  whatsappMessage: ({ name, year, mileage }: { name: string; year: string; mileage: string }) =>
    `你好，我想咨询 ${name}（${year}，${mileage}）。可以发我更多信息吗？`,
};

const homeStats = [
  ['车辆选择', '先看需求', '按车型、等级、颜色和配置找车，而不是只看现车。'],
  ['车源渠道', '日本直连', '覆盖日本拍卖、车行网络以及精选本地库存。'],
  ['用车支持', '交车之后', '配件、维修、车行介绍和日常用车问题都可以继续协助。'],
];

const trustCards = [
  [Shield, '新西兰注册车商', '奥克兰本地团队，买车、沟通和售后都更方便。'],
  [Award, '包含质保', '按新西兰要求提供三个月质保，让购买更安心。'],
  [Star, '重视客户体验', '从选车到交车后跟进，尽量把每一步讲清楚。'],
  [TrendingUp, '日本直采', '拍卖和车行渠道接入，减少不必要的中间层。'],
];

const importSteps = [
  [Search, '选车与出价', '查看日本拍卖或精选车源，我们协助判断车况并处理竞价。', '1-2 天'],
  [Ship, '运输到新西兰', '安排专业运输，跟进车辆从日本到新西兰港口的进度。', '3-4 周'],
  [FileCheck, '合规与清关', '处理 NZTA 合规、清关、安全检查和上牌前准备。', '2-3 周'],
  [Key, '注册与交付', '完成注册、车牌和交车，让车辆可以正常上路使用。', '约 1 周'],
];

const serviceCards = [
  [Wrench, 'Repairs', '维修与诊断介绍', '车辆需要检查、维修或诊断时，我们可以根据车型和问题介绍合适的合作维修资源。'],
  [Package, 'Parts', '配件与用车支持', '进口车后续可能需要配件、轮胎或保养资源，我们会协助你找到更合适的渠道。'],
  [Shield, 'Body & Paint', '钣金喷漆与外观修复', '如果车辆需要外观处理、划痕修复或喷漆，我们可以介绍合作商家协助处理。'],
  [Settings, 'Partners', '合作伙伴网络', '我们把常用合作伙伴整理在服务页，方便车主在购车后继续获得帮助。'],
];

function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  highlight,
  subtitle,
}: {
  icon: typeof Car;
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
}) {
  return (
    <section className="bg-gradient-to-br from-primary/5 via-white to-primary/10 px-4 py-20">
      <div className="mx-auto max-w-7xl space-y-6 text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3">
          <Icon className="h-5 w-5 text-primary" />
          <span className="font-semibold text-primary">{eyebrow}</span>
        </div>
        <h1 className="text-5xl font-bold text-foreground md:text-6xl">
          {title} <span className="text-primary">{highlight}</span>
        </h1>
        <p className="mx-auto max-w-3xl text-xl text-muted-foreground">{subtitle}</p>
      </div>
    </section>
  );
}

function QuoteBlock() {
  return (
    <section id="quote" className="relative overflow-hidden px-4 py-20 sm:py-24 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-primary/10" />
      </div>
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-12 space-y-4 text-center md:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/20 px-4 py-2.5 backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary">提交你的车辆需求</span>
          </div>
          <h2 className="text-[2rem] font-bold text-white sm:text-4xl md:text-5xl">
            告诉我们你想开什么车
            <span className="mt-2 block bg-gradient-to-r from-primary via-yellow-300 to-primary bg-clip-text text-transparent">
              我们帮你筛选方向
            </span>
          </h2>
          <p className="mx-auto max-w-3xl text-base leading-8 text-gray-300 sm:text-lg md:text-xl">
            发给我们品牌、车型、预算、年份、配置和使用场景，我们会根据日本车源或精选本地库存给你建议。
          </p>
        </div>

        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-5 shadow-2xl sm:p-8 md:p-12">
          <div className="grid gap-5 md:grid-cols-2">
            <input className="rounded-2xl border-2 border-gray-200 px-5 py-4" placeholder="姓名" />
            <input className="rounded-2xl border-2 border-gray-200 px-5 py-4" placeholder="电话 / WhatsApp" />
            <input className="rounded-2xl border-2 border-gray-200 px-5 py-4" placeholder="预算范围，例如 $30,000 - $45,000" />
            <input className="rounded-2xl border-2 border-gray-200 px-5 py-4" placeholder="想要的品牌或车型" />
          </div>
          <textarea
            className="mt-5 w-full rounded-2xl border-2 border-gray-200 px-5 py-4"
            rows={5}
            placeholder="可以写用途、颜色、排量、油耗、公里数、家庭人数、是否需要贷款等..."
          />
          <a
            href="https://wa.me/642885307225"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary via-yellow-400 to-primary py-4 text-lg font-bold text-white shadow-xl transition-all hover:scale-[1.01]"
          >
            用 WhatsApp 发送需求
            <ArrowRight className="h-5 w-5" />
          </a>
          <p className="mt-4 text-center text-sm text-gray-500">可以直接写中文，我们会按你的需求回复。</p>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-20 text-white">
      <div className="mx-auto max-w-4xl space-y-8 text-center">
        <h2 className="text-4xl font-bold text-white md:text-5xl">想开始找车了吗？</h2>
        <p className="text-xl text-gray-300">把预算、用途和想要的车型发给我们，我们会帮你判断下一步。</p>
        <Link to="/zh/contact" className="inline-block rounded-2xl bg-gradient-to-r from-primary via-yellow-400 to-primary px-10 py-4 text-lg font-bold text-white shadow-xl transition-all hover:scale-105">
          联系我们
        </Link>
      </div>
    </section>
  );
}

export function ChineseHome() {
  const [currentImage, setCurrentImage] = useState(0);

  return (
    <>
      <section className="relative overflow-hidden bg-[#090909] px-4 pb-14 pt-20 text-white sm:pb-20 sm:pt-28 md:pb-24">
        <div className="absolute inset-0">
          {heroGalleryImages.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setCurrentImage(index)}
              className={`absolute inset-0 transition-opacity duration-1500 ${
                index === currentImage ? 'opacity-100' : 'opacity-0'
              }`}
              aria-label={`显示第 ${index + 1} 张首页图片`}
            >
              <img src={image} alt={`日本进口车展示 ${index + 1}`} className="h-full w-full scale-105 object-cover" />
            </button>
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/58 to-black/78" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/62 via-transparent to-black/86" />
        </div>

        <div className="section-shell relative z-10">
          <div className="grid gap-7 lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:gap-12">
            <div className="max-w-3xl">
              <BrandLogo variant="hero" className="mb-6 max-w-[220px] sm:max-w-fit" />
              <div className="mb-5 inline-flex flex-wrap items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/76">
                <span className="h-2 w-2 rounded-full bg-primary" />
                奥克兰本地
                <span className="text-white/35">|</span>
                日本直采车源
              </div>
              <h1 className="text-[2.55rem] leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.75rem]">
                从<span className="text-primary">日本</span>直达。
                <br />
                为新西兰买家更清楚地找车。
              </h1>
              <p className="mt-4 max-w-2xl text-[0.98rem] leading-7 text-white/72 sm:mt-6 md:text-xl md:leading-8">
                我们帮助你通过日本拍卖、车行网络和精选本地库存，按车型、等级、颜色和配置找车，并提前说明落地价格和交付后的实际支持。
              </p>
              <div className="mt-6 flex flex-wrap gap-2 sm:mt-8 sm:gap-3">
                {['日本拍卖与车行资源', '新西兰合规与交付协助', '可信合作伙伴售后支持'].map((item) => (
                  <span key={item} className="rounded-full border border-white/12 bg-white/7 px-3 py-1.5 text-[11px] leading-5 text-white/74 backdrop-blur-sm sm:px-4 sm:py-2 sm:text-sm">
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
                <a href="#quote" className="button-primary w-full sm:w-auto">
                  获取报价
                  <ArrowRight className="h-5 w-5" />
                </a>
                <a href="#calculator" className="button-secondary-dark w-full sm:w-auto">
                  了解落地价
                  <ArrowRight className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div className="section-card-dark p-5 sm:p-8 md:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">为什么客户从这里开始</p>
              <p className="mt-2 text-sm text-white/62">从找车到用车，更清楚的一条路径。</p>
              <div className="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
                {homeStats.map(([label, value, note]) => (
                  <div key={label} className="rounded-[22px] border border-white/8 bg-black/18 p-4 sm:rounded-[24px] sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/42">{label}</p>
                    <p className="mt-2 text-[1.7rem] font-semibold text-white sm:text-3xl">{value}</p>
                    <p className="mt-2 text-sm leading-6 text-white/62 sm:leading-7">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#111214] px-4 py-16 text-white">
        <div className="section-shell">
          <div className="section-card-dark overflow-hidden p-8 md:p-10">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-center">
              <div className="space-y-6">
                <div className="section-kicker border-white/12 bg-white/8 text-primary">信任基础</div>
                <h2 className="text-4xl text-white md:text-5xl">
                  很多新西兰车商都从日本找车。
                  <span className="block text-primary">我们帮你直接看源头。</span>
                </h2>
                <p className="max-w-2xl text-lg leading-8 text-white/68">
                  直连车源、实际用车支持，以及更清楚的沟通方式，让你看到更宽的车源范围。
                </p>
                <BrandLogo variant="plaque" eyebrow="Trusted Brand" className="max-w-fit" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {trustCards.map(([Icon, title, copy]) => {
                  const CardIcon = Icon as typeof Shield;
                  return (
                    <div key={title as string} className="rounded-[26px] border border-white/10 bg-white/[0.05] p-6">
                      <CardIcon className="mb-4 h-9 w-9 text-primary" />
                      <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
                      <p className="text-sm leading-7 text-white/62">{copy}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="calculator" className="bg-white px-4 py-20">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="mb-6 text-4xl font-bold text-foreground md:text-5xl">
            落地价<span className="text-primary">怎么组成</span>
          </h2>
          <p className="mx-auto mb-12 max-w-3xl text-xl text-muted-foreground">
            我们会把日本车价、服务费、汇率、GST、海运、合规、注册等费用拆开说明，让你不是只看一个模糊总价。
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              ['日本车价', '拍卖或车行价格，加上日本本地相关费用。'],
              ['运输与合规', '海运、新西兰清关、合规检查、注册和上牌。'],
              ['最终落地价', '把所有费用换算成 NZD 后，再判断是否符合预算。'],
            ].map(([title, copy]) => (
              <div key={title} className="section-card p-7">
                <Calculator className="mx-auto mb-4 h-8 w-8 text-primary" />
                <h3>{title}</h3>
                <p className="mt-3 text-sm leading-7">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 space-y-4 text-center">
            <div className="inline-block rounded-full bg-primary/10 px-4 py-2">
              <span className="text-sm text-primary">进口流程</span>
            </div>
            <h2 className="text-4xl text-foreground md:text-5xl">日本到奥克兰，大概怎么走</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">从日本拍卖到新西兰交车，通常约 6-10 周，每一步我们都会尽量说明清楚。</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {importSteps.map(([Icon, title, description, duration], index) => {
              const StepIcon = Icon as typeof Search;
              return (
                <div key={title as string} className="flex flex-col items-center space-y-6 text-center">
                  <div className="relative">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary/20 bg-white shadow-lg">
                      <StepIcon className="h-10 w-10 text-primary" />
                    </div>
                    <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">{index + 1}</div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">{duration}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <QuoteBlock />
    </>
  );
}

export function ChineseVehicles() {
  const { vehicles } = useVehiclesCatalog();

  return (
    <div className="pt-20">
      <PageHeader
        icon={Car}
        eyebrow="车辆示例"
        title="我们可以帮你寻找的"
        highlight="日本进口车"
        subtitle="这些车辆只是预订车源示例，用来展示我们可以从日本协助寻找的车型类型。如果你想看更多选择，请联系我们按预算和需求推荐。"
      />
      <section className="bg-white px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 space-y-4 text-center">
            <div className="inline-block rounded-full bg-primary/10 px-4 py-2">
              <span className="text-sm text-primary">示例车辆</span>
            </div>
            <h2 className="text-4xl text-foreground md:text-5xl">几款常见热门示例</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              页面上的车辆不是全部库存，而是日本预订车源示例。想找其他品牌、年份、预算或用途，可以直接联系我们。
            </p>
          </div>
          <div className="mb-10 rounded-3xl border border-primary/15 bg-gradient-to-r from-primary/8 via-primary/5 to-transparent px-6 py-5 text-center">
            <p className="text-base font-medium text-foreground md:text-lg">这里展示的车辆均为日本进口预订示例。</p>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">如果你想找不同车型，把品牌、预算、年份或使用场景发给我们，我们会建议更匹配的选择。</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.name}
                {...vehicle}
                availability={vehicle.availability === 'Pre Order' ? '可预订' : vehicle.availability}
                labels={vehicleCardLabels}
              />
            ))}
          </div>
        </div>
      </section>
      <FinalCta />
    </div>
  );
}

export function ChineseServices() {
  return (
    <div className="pt-20">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f1115] via-[#1a1c21] to-[#251e10] px-4 py-24 text-white">
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-6 py-3">
              <Settings className="h-5 w-5 text-primary" />
              <span className="font-semibold text-primary">服务与用车支持</span>
            </div>
            <h1 className="text-5xl font-bold text-white md:text-6xl">
              给 Inno 车主的
              <span className="block text-primary">简单售后支持</span>
            </h1>
            <p className="max-w-3xl text-xl text-white/74">这个页面集中介绍购车后的服务和车主权益：维修、配件、合作伙伴介绍，以及买车后遇到实际问题时的支持。</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              ['维修协助', '钣金、喷漆、维修介绍和实际修车支持。', Wrench],
              ['车主权益', '更方便接触可信合作伙伴、配件和后续帮助。', Package],
              ['可信网络', '把常用合作商家整理在一个页面，车主更容易找到。', Shield],
            ].map(([title, copy, Icon]) => {
              const CardIcon = Icon as typeof Wrench;
              return (
                <div key={title as string} className="rounded-3xl border border-white/10 bg-white/7 p-5 backdrop-blur-sm">
                  <CardIcon className="mb-4 h-8 w-8 text-primary" />
                  <h3 className="text-xl font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/68">{copy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#fbfaf6] px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[32px] border border-primary/12 bg-white p-8 shadow-xl md:p-10">
              <div className="mb-5 inline-flex items-center rounded-full bg-primary/10 px-5 py-2">
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">服务与车主支持</span>
              </div>
              <h2 className="max-w-3xl text-4xl text-foreground md:text-5xl">购车后的实际帮助</h2>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">售后服务和车主权益集中在这里：维修、喷漆、配件，以及可信合作伙伴支持。</p>
              <div className="mt-8 space-y-4">
                {['车身外观、划痕和喷漆支持', '机械维修和诊断资源介绍', '日本车型配件与长期用车帮助'].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-primary/10 p-1.5 text-primary">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <p className="text-base leading-7 text-foreground/80">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[32px] bg-gradient-to-br from-[#171717] via-[#201a0d] to-[#111111] p-8 text-white shadow-2xl md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">车主通常需要什么</p>
              <div className="mt-6 space-y-5">
                {['凹痕、划痕和喷漆', '维修介绍和故障诊断', '日本车型配件支持', '更方便接触可信合作伙伴'].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/6 px-5 py-4 text-sm leading-7 text-white/78">{item}</div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {serviceCards.map(([Icon, eyebrow, title, description]) => {
              const CardIcon = Icon as typeof Wrench;
              return (
                <div key={title as string} className="rounded-[30px] border border-primary/12 bg-white p-8 shadow-lg">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</span>
                      </div>
                      <h3 className="mt-5 text-3xl font-semibold text-foreground">{title}</h3>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-primary/18 to-primary/6 p-4 text-primary shadow-md">
                      <CardIcon className="h-8 w-8" />
                    </div>
                  </div>
                  <p className="mt-5 text-base leading-8 text-muted-foreground">{description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <FinalCta />
    </div>
  );
}

export function ChineseAbout() {
  return (
    <div className="pt-20">
      <PageHeader
        icon={Users}
        eyebrow="关于我们"
        title="你值得信任的"
        highlight="进口车伙伴"
        subtitle="INNO GROUP 位于新西兰奥克兰，专注帮助新西兰买家和车商了解并引入优质日本车辆。"
      />
      <section className="bg-gradient-to-b from-white via-gray-50 to-white px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <div className="mb-2 inline-block rounded-full bg-primary/10 px-4 py-2">
              <span className="text-sm text-primary">About Inno Group</span>
            </div>
            <h2 className="mb-4 text-4xl text-foreground md:text-5xl">
              连接新西兰客户与<span className="text-primary">日本优质车源</span>
            </h2>
            <p className="mx-auto max-w-3xl text-lg leading-8 text-muted-foreground">
              我们的价值不是简单卖一台车，而是帮助客户理解车源、车况、预算、落地费用和购车后的实际支持。
            </p>
          </div>
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="space-y-6">
              <h3 className="text-3xl text-foreground">你的日本车源桥梁</h3>
              <p className="text-lg leading-8">
                很多买家不确定应该买新西兰本地二手车，还是从日本进口。我们会根据预算、用途、年份、公里数、配置和后期维护，帮你判断更合适的方向。
              </p>
              <p className="text-lg leading-8">
                对中文客户来说，最重要的是信息透明。我们会尽量把拍卖、报价、运输、合规和交车后的事项讲清楚，帮助你更安心地做决定。
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  ['NZ', '奥克兰本地支持'],
                  ['JP', '日本车源渠道'],
                  ['3 mo', '三个月质保'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border-2 border-gray-100 bg-white p-5 text-center shadow-md">
                    <div className="mb-2 text-3xl font-bold text-primary">{value}</div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[32px] border border-primary/10 bg-white p-8 shadow-xl">
              <h3 className="mb-6 text-3xl text-foreground">为什么选择我们</h3>
              <div className="space-y-4">
                {['奥克兰本地沟通和支持', '日本拍卖与车行车源筛选', '落地价与流程尽量透明', '购车后继续协助维修和配件方向'].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-primary" />
                    <p className="text-base leading-7 text-foreground/80">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <FinalCta />
    </div>
  );
}

export function ChineseFinance() {
  const [vehiclePrice, setVehiclePrice] = useState(30000);
  const [deposit, setDeposit] = useState(5000);
  const [term, setTerm] = useState(48);
  const principal = vehiclePrice - deposit;
  const monthlyRate = 0.0799 / 12;
  const monthlyPayment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) /
    (Math.pow(1 + monthlyRate, term) - 1);
  const weeklyPayment = ((monthlyPayment * 12) / 52).toFixed(2);

  return (
    <div className="min-h-screen overflow-x-hidden bg-black pt-20 text-white">
      <section className="relative overflow-hidden px-4 py-16 sm:py-20 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-4xl font-light tracking-tight text-white sm:text-5xl md:mb-8 md:text-7xl lg:text-8xl">
            先了解预算。
            <br />
            <span className="text-primary">再更快上路。</span>
          </h1>
          <p className="mb-3 text-lg font-light text-gray-400 sm:text-xl md:mb-4 md:text-2xl">根据你的情况了解车辆贷款方向。</p>
          <p className="text-lg text-gray-500">无压力，无强制义务。</p>
        </div>
      </section>

      <section className="border-y border-white/10 px-4 py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4 md:gap-8">
          {[
            [Clock, '快速审批', '有机会当天获得反馈'],
            [DollarSign, '有竞争力利率', '匹配合适贷款渠道'],
            [Shield, '可信合作方', '合作贷款机构支持'],
            [CheckCircle, '无强制义务', '了解方案不等于必须购买'],
          ].map(([Icon, title, copy]) => {
            const CardIcon = Icon as typeof Clock;
            return (
              <div key={title as string} className="text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <CardIcon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-white">{title}</h3>
                <p className="text-sm text-gray-400">{copy}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-light text-white sm:mb-16 md:mb-20 md:text-5xl">
            流程<span className="text-primary">怎么走</span>
          </h2>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              ['1', '提交信息', '填写基本资料和预算'],
              ['2', '匹配方案', '我们协助对接合适渠道'],
              ['3', '获得反馈', '确认可行贷款方向'],
              ['4', '安排提车', '预算清楚后再选车'],
            ].map(([num, title, desc]) => (
              <div key={num} className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/5 text-3xl font-light text-primary">{num}</div>
                <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
                <p className="text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-transparent via-primary/5 to-transparent px-4 py-16 sm:py-20 md:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h2 className="mb-6 text-3xl font-light text-white sm:text-4xl md:text-5xl">
              估算你的<span className="text-primary">每周还款</span>
            </h2>
            <p className="text-gray-400">申请前先有一个大概概念</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-8 md:p-12">
            <div className="space-y-8">
              <div>
                <label className="mb-3 block text-lg text-white">车辆价格</label>
                <input type="range" min="10000" max="100000" step="1000" value={vehiclePrice} onChange={(e) => setVehiclePrice(Number(e.target.value))} className="slider h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10" />
                <div className="mt-2 text-right text-3xl font-light text-primary">${vehiclePrice.toLocaleString()}</div>
              </div>
              <div>
                <label className="mb-3 block text-lg text-white">首付</label>
                <input type="range" min="0" max={vehiclePrice / 2} step="500" value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} className="slider h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10" />
                <div className="mt-2 text-right text-3xl font-light text-primary">${deposit.toLocaleString()}</div>
              </div>
              <div>
                <label className="mb-3 block text-lg text-white">贷款周期（月）</label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[24, 36, 48, 60].map((option) => (
                    <button key={option} type="button" onClick={() => setTerm(option)} className={`rounded-xl py-3 font-semibold transition-all ${term === option ? 'bg-primary text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/20 to-yellow-500/20 p-5 text-center sm:p-8">
                <p className="mb-2 text-gray-300">预估每周还款</p>
                <div className="mb-2 text-5xl font-light text-white md:text-6xl">${weeklyPayment}</div>
                <p className="text-sm text-gray-400">按 7.99% p.a. 示例利率估算*</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function ChineseContact() {
  return (
    <div className="pt-20">
      <PageHeader
        icon={Mail}
        eyebrow="联系我们"
        title="让我们"
        highlight="开始沟通"
        subtitle="如果你想了解日本进口车、二手车购买、报价或贷款，我们可以用中文帮你把下一步讲清楚。"
      />
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
            {[
              [Phone, '电话', '+64 28 8530 7225', 'tel:+64288530725'],
              [Phone, '电话 2', '+64 27 285 8065', 'tel:+64272858065'],
              [MessageCircle, 'WhatsApp', '立即聊天', 'https://wa.me/642885307225'],
              [Mail, '邮箱', 'innogroup.shawn@gmail.com', 'mailto:innogroup.shawn@gmail.com'],
              [MapPin, '地址', 'Unit 1A, 331 Rosedale Road, Albany, Auckland', ''],
            ].map(([Icon, title, copy, href]) => {
              const CardIcon = Icon as typeof Phone;
              const content = (
                <div className="flex h-full flex-col items-center gap-4 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent p-6 text-center transition-all hover:border-primary/30">
                  <div className="rounded-xl bg-primary/10 p-3">
                    <CardIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="mb-3 text-base font-bold text-foreground">{title}</h3>
                    <p className="break-all text-muted-foreground">{copy}</p>
                  </div>
                </div>
              );

              return href ? (
                <a key={title as string} href={href as string} target={(href as string).startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                  {content}
                </a>
              ) : (
                <div key={title as string}>{content}</div>
              );
            })}
          </div>
          <div className="mt-8 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent p-6 text-center">
            <Clock className="mx-auto mb-3 h-6 w-6 text-primary" />
            <h3 className="mb-2 text-base font-bold text-foreground">营业时间</h3>
            <p className="text-muted-foreground">周一至周五：10AM - 5PM，其他时间可预约。</p>
          </div>
        </div>
      </section>
      <QuoteBlock />
    </div>
  );
}
