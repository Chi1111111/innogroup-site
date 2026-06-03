import { useEffect, useState } from 'react';
import emailjs from '@emailjs/browser';
import {
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  Check,
  ChevronDown,
  Mail,
  X,
} from 'lucide-react';
import { EMAILJS_CONFIG } from '../../config/emailConfig';
import { getWoxVehicle, type WoxVehicle } from '../../data/woxVehicles';

type WoxSlug = WoxVehicle['slug'];
type WoxVersion = WoxVehicle['versions'][number];

function scrollToQuote(slug: WoxSlug) {
  document.getElementById(`${slug}-quote`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getVersionGallery(vehicle: WoxVehicle, selected: WoxVersion) {
  return [
    { title: selected.name, image: selected.image },
    ...vehicle.gallery.filter((photo) => photo.image !== selected.image),
  ];
}

function WoxHero({
  vehicle,
  selected,
  onSelect,
}: {
  vehicle: WoxVehicle;
  selected: WoxVersion;
  onSelect: (id: string) => void;
}) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const gallery = getVersionGallery(vehicle, selected);
  const activePhoto = gallery[slideIndex] ?? gallery[0];

  useEffect(() => {
    setSlideIndex(0);
  }, [vehicle.slug, selected.id]);

  const showPrevious = () => {
    setSlideIndex((current) => (current === 0 ? gallery.length - 1 : current - 1));
  };

  const showNext = () => {
    setSlideIndex((current) => (current === gallery.length - 1 ? 0 : current + 1));
  };

  return (
    <section className="px-4 pb-12 pt-10">
      <div className="section-shell">
        <div className="mb-6 grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div className="space-y-5">
            <div className="section-kicker">
              <BatteryCharging className="h-4 w-4" />
              Cars from China
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary/82">
              {vehicle.modelCode}
            </p>
            <h1>{vehicle.name}</h1>
            <p className="max-w-2xl text-lg leading-8 text-foreground/72">{vehicle.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {vehicle.quickSpecs.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-black/6 bg-white/80 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                <p className="mt-1 text-base font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-slideUp overflow-hidden rounded-[24px] bg-white shadow-[0_28px_90px_rgba(17,17,17,0.1)]">
          <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)]">
            <div className="relative flex items-center bg-[#f3f0e9] p-3 sm:p-5">
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="flex aspect-[16/9] w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-[18px] bg-gradient-to-br from-white to-[#ebe7df]"
                aria-label={`Open larger ${vehicle.name} ${activePhoto.title} image`}
              >
                <img
                  key={activePhoto.image}
                  src={activePhoto.image}
                  alt={`${vehicle.name} ${activePhoto.title}`}
                  className="h-full w-full animate-scaleIn object-contain"
                />
              </button>
              <button
                type="button"
                onClick={showPrevious}
                aria-label={`Previous ${vehicle.name} image`}
                className="absolute left-5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-foreground shadow-lg hover:scale-105 hover:bg-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={showNext}
                aria-label={`Next ${vehicle.name} image`}
                className="absolute right-5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-foreground shadow-lg hover:scale-105 hover:bg-white"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/92 px-4 py-2 text-sm font-bold text-foreground shadow-lg">
                <span>{activePhoto.title}</span>
                <span className="text-muted-foreground">
                  {slideIndex + 1} / {gallery.length}
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-between border-t border-black/6 p-6 sm:p-8 md:border-l md:border-t-0">
              <div className="space-y-5">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-foreground/62">
                  Choose configuration
                </p>
                {vehicle.versions.map((version) => (
                  <button
                    key={version.id}
                    type="button"
                    onClick={() => onSelect(version.id)}
                    className={`w-full rounded-[20px] border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                      version.id === selected.id
                        ? 'border-primary bg-primary/8 ring-2 ring-primary/20'
                        : 'border-black/8 bg-white hover:border-primary/35'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{version.name}</h3>
                        <p className="mt-1 text-xs font-semibold text-foreground/68">{version.bestFor}</p>
                      </div>
                      <p className="text-right text-xl font-bold text-foreground">{version.price}</p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {version.stats.map(([label, value]) => (
                        <div key={label} className="rounded-2xl bg-white/70 p-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                            {label}
                          </p>
                          <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
                <div className="rounded-[20px] border border-black/6 bg-white/75 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Selected version details
                  </p>
                  <div className="mt-3 space-y-2">
                    {selected.notes.map((note) => (
                      <div key={note} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 flex-none text-primary" />
                        <span className="text-sm font-medium text-foreground/74">{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">{vehicle.quoteNote}</p>
              </div>

              <button type="button" onClick={() => scrollToQuote(vehicle.slug)} className="button-primary mt-8 w-full">
                Request this model
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {isLightboxOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/86 p-4">
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              aria-label={`Close ${vehicle.name} image preview`}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={activePhoto.image}
              alt={`Large ${vehicle.name} ${activePhoto.title}`}
              className="max-h-[88vh] max-w-[94vw] object-contain"
            />
          </div>
        )}
      </div>
    </section>
  );
}

function WoxDetails({ vehicle, selected }: { vehicle: WoxVehicle; selected: WoxVersion }) {
  const [openGroup, setOpenGroup] = useState(0);

  return (
    <>
      <section className="px-4 py-12">
        <div className="section-shell grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-4">
            <div className="section-kicker">Highlights</div>
            <h2>Built for electric sourcing enquiries</h2>
            <p>{vehicle.subtitle}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {vehicle.highlights.map((highlight) => (
              <article key={highlight.title} className="section-card p-5">
                <h3 className="text-lg">{highlight.title}</h3>
                <p className="mt-2 text-sm leading-7 text-foreground/68">{highlight.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="section-shell space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="section-kicker">Specifications</div>
              <h2 className="mt-4">{selected.name}</h2>
            </div>
            <p className="max-w-md text-sm font-semibold leading-7 text-foreground/62">
              These figures update when a different configuration is selected above.
            </p>
          </div>
          <div className="overflow-hidden rounded-[24px] border border-black/6 bg-white shadow-[0_24px_80px_rgba(17,17,17,0.08)]">
            <div className="grid divide-y divide-black/6 md:grid-cols-2 md:divide-x md:divide-y-0">
              {selected.detailSpecs.map((spec) => (
                <div key={spec.label} className="grid grid-cols-[0.42fr_0.58fr] gap-4 border-b border-black/6 px-5 py-4 last:border-b-0 md:last:border-b">
                  <p className="text-sm font-bold text-foreground">{spec.label}</p>
                  <p className="text-sm font-semibold text-muted-foreground">{spec.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="section-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Shared vehicle information
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {vehicle.specs.map((spec) => (
                <div key={spec.label} className="flex justify-between gap-4 border-b border-black/6 pb-3">
                  <span className="text-sm font-bold text-foreground">{spec.label}</span>
                  <span className="text-right text-sm font-semibold text-muted-foreground">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="section-shell grid animate-slideUp gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-4">
            <div className="section-kicker">Confirm before order</div>
            <h2>Import checks</h2>
            <p>These are the practical confirmation items we check before placing an import order.</p>
          </div>

          <div className="section-card overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenGroup(openGroup === 0 ? -1 : 0)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-bold text-foreground">China vehicle import confirmation</span>
              <ChevronDown className={`h-5 w-5 text-primary ${openGroup === 0 ? 'rotate-180' : ''}`} />
            </button>
            {openGroup === 0 && (
              <div className="grid gap-3 border-t border-black/6 p-5 sm:grid-cols-2">
                {vehicle.confirmationItems.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-none text-primary" />
                    <span className="text-sm font-medium text-foreground/78">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function WoxQuoteForm({ vehicle, selected }: { vehicle: WoxVehicle; selected: WoxVersion }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    intendedUse: 'Private buyer',
    configuration: selected.name,
    budget: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      configuration: selected.name,
    }));
  }, [selected.name]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        {
          inquiryType: `${vehicle.name} Import Quote`,
          sourceType: 'China direct import',
          brand: 'WOX',
          model: formData.configuration,
          year: 'New / supplier availability to confirm',
          budget: formData.budget || 'Not specified',
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          message: [
            `Selected model: ${formData.configuration}`,
            `Intended use: ${formData.intendedUse}`,
            `Message: ${formData.message || 'No additional details provided'}`,
          ].join('\n'),
          photoInfo: 'No photos uploaded',
          photoHtml: '<p>No photos uploaded</p>',
        },
        EMAILJS_CONFIG.publicKey
      );

      alert(`Thank you for your ${vehicle.name} enquiry. We'll be in touch within 24 hours.`);
      setFormData({
        name: '',
        phone: '',
        email: '',
        intendedUse: 'Private buyer',
        configuration: selected.name,
        budget: '',
        message: '',
      });
    } catch (error) {
      console.error(`${vehicle.name} enquiry error:`, error);
      alert('Sorry, there was an error sending your enquiry. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-2xl border border-black/10 bg-white px-4 py-3 font-medium text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20';

  return (
    <section id={`${vehicle.slug}-quote`} className="px-4 py-20">
      <div className="section-shell grid animate-slideUp gap-8 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="section-card-dark bg-[#161514] p-8 text-white">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-white">Request {vehicle.name} Import Quote</h2>
          <p className="mt-4 text-white/72">
            We will confirm availability, specification, landed pricing and compliance pathway
            before order.
          </p>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="text-sm text-white/76">{vehicle.quoteNote}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="section-card space-y-5 p-5 sm:p-8">
          <label className="space-y-2">
            <span>Selected configuration</span>
            <select name="configuration" value={formData.configuration} onChange={handleChange} className={inputClass}>
              {vehicle.versions.map((version) => (
                <option key={version.id}>{version.name}</option>
              ))}
              <option>Not sure</option>
            </select>
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2">
              <span>Name</span>
              <input name="name" value={formData.name} onChange={handleChange} required className={inputClass} />
            </label>
            <label className="space-y-2">
              <span>Phone</span>
              <input name="phone" type="tel" value={formData.phone} onChange={handleChange} required className={inputClass} />
            </label>
          </div>
          <label className="space-y-2">
            <span>Email</span>
            <input name="email" type="email" value={formData.email} onChange={handleChange} required className={inputClass} />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2">
              <span>Intended use</span>
              <select name="intendedUse" value={formData.intendedUse} onChange={handleChange} className={inputClass}>
                {['Private buyer', 'Dealer', 'Fleet', 'Business', 'Other'].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span>Budget range</span>
              <input
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g. NZ$50k - NZ$70k"
              />
            </label>
          </div>
          <label className="space-y-2">
            <span>Message</span>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={5}
              className={inputClass}
              placeholder="Tell us colour, intended use, timing or compliance questions."
            />
          </label>
          <button type="submit" disabled={isSubmitting} className="button-primary w-full">
            {isSubmitting ? 'Sending...' : 'Request this model'}
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>
      </div>
    </section>
  );
}

export function WoxVehiclePage({ slug }: { slug: WoxSlug }) {
  const vehicle = getWoxVehicle(slug);
  const [selectedId, setSelectedId] = useState(vehicle.versions[0].id);
  const selected = vehicle.versions.find((version) => version.id === selectedId) ?? vehicle.versions[0];

  useEffect(() => {
    setSelectedId(vehicle.versions[0].id);
  }, [vehicle]);

  return (
    <div className="pt-20">
      <WoxHero vehicle={vehicle} selected={selected} onSelect={setSelectedId} />
      <WoxDetails vehicle={vehicle} selected={selected} />
      <WoxQuoteForm vehicle={vehicle} selected={selected} />
    </div>
  );
}

export function WoxAirPage() {
  return <WoxVehiclePage slug="wox-air" />;
}

export function WoxNebulaPage() {
  return <WoxVehiclePage slug="wox-nebula" />;
}

export function WoxSheraPage() {
  return <WoxVehiclePage slug="wox-shera" />;
}

export function WoxZenyPage() {
  return <WoxVehiclePage slug="wox-zeny" />;
}
