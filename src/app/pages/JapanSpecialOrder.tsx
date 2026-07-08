import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Car,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Gauge,
  Search,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { japanSpecialOrderHeroImages } from '../../data/japanSpecialOrders';
import { useLanguage } from '../components/SiteTranslator';
import {
  getJapanSpecialOrderImages,
  type JapanSpecialOrderVehicle,
  useJapanSpecialOrders,
} from '../hooks/useJapanSpecialOrders';

const strengths = [
  {
    icon: Search,
    title: { en: 'Japan channel updates', zh: '日本渠道更新' },
    text: {
      en: 'When our Japan contacts send over interesting classics, sports cars or rare stock, we review and publish selected cars here.',
      zh: '日本渠道发来经典老车、稀有 JDM、有特点的改装车或高端性能车时，我们会把值得看的车源更新在这里。',
    },
  },
  {
    icon: ClipboardCheck,
    title: { en: 'Quick reality check', zh: '先做基础筛选' },
    text: {
      en: 'Each listing is still subject to availability, condition, documents, shipping and compliance checks before any deposit.',
      zh: '每台车在订金前都需要再次确认是否可锁车、车况、文件、运输和合规路径。',
    },
  },
  {
    icon: CalendarCheck,
    title: { en: 'Updated when good cars appear', zh: '有好车就更新' },
    text: {
      en: 'This is not a fixed catalogue. The page changes as fresh options come through from Japan.',
      zh: '这里不是固定目录，而是日本那边有合适车源发来后持续更新。',
    },
  },
];

const processSteps = [
  {
    title: { en: 'Japan sends a find', zh: '日本发来车源' },
    text: {
      en: 'Our Japan-side contacts send through cars that look rare, clean, unusual or worth watching.',
      zh: '日本渠道发来稀有、干净、有特点或值得关注的车源。',
    },
  },
  {
    title: { en: 'We screen the basics', zh: '我们先看基础信息' },
    text: {
      en: 'Photos, year, mileage, asking price, location and obvious risks are checked before we post it.',
      zh: '发布前会先看照片、年份、公里数、价格、所在地和明显风险点。',
    },
  },
  {
    title: { en: 'You open the card', zh: '点击卡片看详情' },
    text: {
      en: 'Each card opens into a quick detail view with gallery, price, mileage, year and enquiry action.',
      zh: '每张卡片可以打开图库、价格、年份、公里数和咨询入口。',
    },
  },
  {
    title: { en: 'We confirm before moving', zh: '行动前再次确认' },
    text: {
      en: 'If you are serious, we confirm availability, condition, landed cost and next steps before deposit.',
      zh: '如果你有兴趣，我们会在订金前确认车源状态、车况、落地成本和下一步。',
    },
  },
];

function getImageIndex(images: string[], selectedImage: string) {
  const index = images.indexOf(selectedImage);
  return index >= 0 ? index : 0;
}

export function JapanSpecialOrder() {
  const { text } = useLanguage();
  const { vehicles } = useJapanSpecialOrders();
  const [selectedVehicle, setSelectedVehicle] = useState<JapanSpecialOrderVehicle | null>(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [largeImage, setLargeImage] = useState('');

  const selectedImages = useMemo(
    () => (selectedVehicle ? getJapanSpecialOrderImages(selectedVehicle) : []),
    [selectedVehicle]
  );

  const openVehicle = (vehicle: JapanSpecialOrderVehicle) => {
    const images = getJapanSpecialOrderImages(vehicle);
    setSelectedVehicle(vehicle);
    setSelectedImage(images[0] ?? vehicle.image);
  };

  const closeVehicle = () => {
    setSelectedVehicle(null);
    setSelectedImage('');
  };

  const showAdjacentImage = (direction: -1 | 1) => {
    if (selectedImages.length === 0) return;

    const currentIndex = getImageIndex(selectedImages, selectedImage);
    const nextIndex =
      (currentIndex + direction + selectedImages.length) % selectedImages.length;
    setSelectedImage(selectedImages[nextIndex]);
  };

  return (
    <div className="pt-20">
      <section className="relative overflow-hidden bg-[#0f1113] px-4 py-12 text-white sm:py-16">
        <div className="absolute inset-0">
          <img
            src={japanSpecialOrderHeroImages[0]}
            alt="Japanese fresh vehicle finds"
            className="h-full w-full object-cover opacity-18"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1113] via-[#0f1113]/92 to-[#0f1113]/74" />
        </div>

        <div className="section-shell relative grid gap-8 lg:grid-cols-[1fr_380px] lg:items-end">
          <div className="max-w-3xl space-y-5 animate-slideUp">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              <Star className="h-4 w-4" />
              {text({ en: 'Japan Fresh Finds', zh: '日本精选车源更新' })}
            </div>
            <div className="space-y-4">
              <h1 className="font-sans text-3xl font-semibold leading-tight tracking-normal text-white sm:text-4xl lg:text-5xl">
                {text({
                  en: 'Fresh vehicle opportunities from Japan',
                  zh: '日本渠道发来的精选车源',
                })}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
                {text({
                  en: 'A regularly updated board of cars our Japan contacts send through: classic JDM, clean sports cars, unusual builds and high-end performance stock worth a closer look.',
                  zh: '这里定期更新日本渠道发来的车源：经典 JDM、车况干净的性能车、有特点的改装车，以及值得重点看的高端车型。',
                })}
              </p>
            </div>
            <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                text({ en: 'Updated by supply', zh: '按车源更新' }),
                text({ en: 'Gallery first', zh: '先看图库' }),
                text({ en: 'Confirm before deposit', zh: '订金前确认' }),
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/74"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[22px] border border-white/10 bg-white/[0.07] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
                  {text({ en: 'Current board', zh: '当前看板' })}
                </p>
                <p className="mt-1 text-2xl font-semibold text-white">{vehicles.length}</p>
              </div>
              <div className="rounded-full border border-primary/30 bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary">
                {text({ en: 'Live updates', zh: '持续更新' })}
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-7 text-white/68">
              <p>
                {text({
                  en: 'Cars are posted when something interesting comes through, not as a fixed catalogue.',
                  zh: '这里不是固定目录，而是日本那边有意思的车源发来后再更新。',
                })}
              </p>
              <p>
                {text({
                  en: 'Price, mileage, year and availability still need final confirmation before any deposit.',
                  zh: '价格、公里数、年份和是否还能锁车，都需要在订金前最终确认。',
                })}
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section id="special-order-range" className="px-4 py-14 sm:py-18">
        <div className="section-shell">
          <div className="mb-8 flex flex-col gap-4 border-b border-black/8 pb-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="section-kicker">
                <Gauge className="h-4 w-4" />
                {text({ en: 'Latest Japan Finds', zh: '日本最新精选' })}
              </div>
              <h2 className="font-sans text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
                {text({ en: 'Recently posted vehicles', zh: '近期更新车源' })}
              </h2>
              <p className="max-w-3xl text-base leading-7 text-foreground/68">
                {text({
                  en: 'This is a rotating board for interesting vehicles sent from Japan. Click a card to view the photo gallery, basic details and enquiry action.',
                  zh: '这里是日本发来的有意思车源更新板。点击卡片可以看图库、基础信息和咨询入口。',
                })}
              </p>
            </div>
            <p className="text-sm font-semibold text-foreground/48">
              {text({ en: 'Click any card for gallery and details', zh: '点击卡片查看图库和详情' })}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {vehicles.map((vehicle) => (
              <button
                type="button"
                key={vehicle.slug}
                onClick={() => openVehicle(vehicle)}
                className="group overflow-hidden rounded-[24px] border border-black/6 bg-white text-left shadow-[0_24px_80px_rgba(17,17,17,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/35"
              >
                <div className="grid md:grid-cols-[0.95fr_1.05fr]">
                  <div className="flex min-h-64 items-center justify-center bg-black/[0.035] p-2">
                    <img
                      src={getJapanSpecialOrderImages(vehicle)[0] ?? vehicle.image}
                      alt={vehicle.title}
                      className="max-h-80 w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="space-y-4 p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                      {text({ en: 'Japan channel update', zh: '日本渠道更新' })}
                    </p>
                    <h3>{text({ en: vehicle.title, zh: vehicle.zhTitle })}</h3>
                    <p className="text-sm leading-7 text-foreground/68">
                      {text({ en: vehicle.summary, zh: vehicle.zhSummary })}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[vehicle.year, vehicle.mileage, vehicle.price].map((detail) => (
                        <span
                          key={detail}
                          className="rounded-full border border-primary/14 bg-primary/8 px-3 py-1.5 text-xs font-bold text-primary"
                        >
                          {detail}
                        </span>
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                      {text({ en: 'View details', zh: '查看详情' })}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {selectedVehicle ? (
        <div
          className="fixed inset-0 z-[80] overflow-y-auto bg-black/62 px-4 py-8 backdrop-blur-sm animate-fadeIn"
          onClick={closeVehicle}
        >
          <div className="mx-auto flex min-h-full max-w-5xl items-center">
            <div
              className="relative w-full animate-scaleIn overflow-hidden rounded-[28px] bg-white shadow-[0_30px_100px_rgba(0,0,0,0.35)]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeVehicle}
                className="absolute right-4 top-4 z-10 rounded-full bg-white/92 p-2.5 text-foreground shadow-lg transition-colors hover:bg-primary hover:text-white"
                aria-label="Close details"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
                <div className="bg-black/[0.035] p-4">
                  <div className="relative rounded-[20px] bg-white">
                    {selectedImages.length > 1 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => showAdjacentImage(-1)}
                          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/92 p-3 text-foreground shadow-lg transition-colors hover:bg-primary hover:text-white"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => showAdjacentImage(1)}
                          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/92 p-3 text-foreground shadow-lg transition-colors hover:bg-primary hover:text-white"
                          aria-label="Next image"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setLargeImage(selectedImage || selectedVehicle.image)}
                      className="flex min-h-[320px] w-full items-center justify-center rounded-[20px] bg-white"
                      aria-label={`Open larger ${selectedVehicle.title} image`}
                    >
                      <img
                        src={selectedImage || selectedVehicle.image}
                        alt={selectedVehicle.title}
                        className="max-h-[560px] w-full object-contain"
                      />
                    </button>
                  </div>

                  {selectedImages.length > 1 ? (
                    <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
                      {selectedImages.map((image) => (
                        <button
                          key={image}
                          type="button"
                          onClick={() => setSelectedImage(image)}
                          className={`aspect-square overflow-hidden rounded-xl border bg-white p-1 transition-all ${
                            image === selectedImage
                              ? 'border-primary ring-2 ring-primary/20'
                              : 'border-black/8 hover:border-primary/45'
                          }`}
                        >
                          <img
                            src={image}
                            alt={selectedVehicle.title}
                            className="h-full w-full object-contain"
                          />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-6 p-6 sm:p-8">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                      {selectedVehicle.status}
                    </p>
                    <h2 className="mt-3">
                      {text({ en: selectedVehicle.title, zh: selectedVehicle.zhTitle })}
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-foreground/68">
                      {text({ en: selectedVehicle.summary, zh: selectedVehicle.zhSummary })}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: text({ en: 'Price', zh: '价格' }), value: selectedVehicle.price },
                      { label: text({ en: 'Year', zh: '年份' }), value: selectedVehicle.year },
                      { label: text({ en: 'Mileage', zh: '公里数' }), value: selectedVehicle.mileage },
                      { label: text({ en: 'Location', zh: '所在地' }), value: selectedVehicle.location },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-black/6 bg-black/[0.025] p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground/45">
                          {item.label}
                        </p>
                        <p className="mt-2 text-base font-bold text-foreground">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-primary/18 bg-primary/8 p-4">
                    <p className="text-sm leading-7 text-foreground/70">
                      {text({
                        en: 'Final price, mileage, records, condition and compliance are confirmed before deposit.',
                        zh: '最终价格、公里数、记录、车况和合规情况会在订金前确认。',
                      })}
                    </p>
                  </div>

                  <Link
                    to={`/contact?vehicle=${encodeURIComponent(selectedVehicle.title)}&source=japan-special-order`}
                    className="button-primary w-full justify-center"
                    onClick={closeVehicle}
                  >
                    {text({ en: 'Enquire About This Car', zh: '咨询这台车' })}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {largeImage ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/86 p-4 animate-fadeIn"
          onClick={() => setLargeImage('')}
        >
          <button
            type="button"
            onClick={() => setLargeImage('')}
            className="absolute right-4 top-4 rounded-full bg-white/92 p-2.5 text-foreground shadow-lg transition-colors hover:bg-primary hover:text-white"
            aria-label="Close large image"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={largeImage}
            alt="Large vehicle preview"
            className="max-h-[92vh] max-w-[94vw] rounded-2xl object-contain shadow-[0_30px_100px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}

      <section className="px-4 py-14 sm:py-18">
        <div className="section-shell grid gap-5 md:grid-cols-3">
          {strengths.map((item) => {
            const Icon = item.icon;

            return (
              <article key={text(item.title)} className="section-card p-6">
                <Icon className="mb-5 h-7 w-7 text-primary" />
                <h3>{text(item.title)}</h3>
                <p className="mt-3 text-sm leading-7 text-foreground/68">{text(item.text)}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-[#101113] px-4 py-16 text-white sm:py-20">
        <div className="section-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-5">
            <div className="section-kicker border-white/12 bg-white/8">
              <BadgeCheck className="h-4 w-4" />
              {text({ en: 'How Updates Work', zh: '更新机制' })}
            </div>
            <h2 className="text-white">
              {text({ en: 'How cars get posted here', zh: '这些车源是怎么更新上来的' })}
            </h2>
            <p className="text-lg leading-8 text-white/70">
              {text({
                en: 'The page updates when Japan sends us something worth showing. We keep the detail simple first, then confirm seriously before you commit.',
                zh: '日本发来值得看的车源后，我们先做基础筛选，再用简单清楚的方式更新到页面上。',
              })}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {processSteps.map((step, index) => (
              <article key={text(step.title)} className="rounded-[22px] border border-white/10 bg-white/[0.06] p-5">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {index + 1}
                </div>
                <h3 className="text-lg text-white">{text(step.title)}</h3>
                <p className="mt-3 text-sm leading-7 text-white/68">{text(step.text)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20">
        <div className="section-shell rounded-[26px] border border-black/6 bg-white p-7 shadow-[0_24px_80px_rgba(17,17,17,0.08)] sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-3xl space-y-4">
              <div className="section-kicker">
                <Sparkles className="h-4 w-4" />
                {text({ en: 'Want to watch for something?', zh: '想关注某台车？' })}
              </div>
              <h2>
                {text({ en: 'Tell us what you want us to keep an eye on', zh: '告诉我们你想重点留意什么' })}
              </h2>
              <p className="text-lg leading-8 text-foreground/70">
                {text({
                  en: 'If there is a specific model you are waiting for, send us the brief. When something suitable comes through from Japan, we can let you know.',
                  zh: '如果你在等某个具体车型，可以告诉我们预算、年份、颜色和车况要求；日本那边有合适车源时我们可以提醒你。',
                })}
              </p>
            </div>
            <Link to="/contact" className="button-primary justify-center">
              <Car className="h-5 w-5" />
              {text({ en: 'Send Watch Request', zh: '提交关注车型' })}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
