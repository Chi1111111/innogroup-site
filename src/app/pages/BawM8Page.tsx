import { useEffect, useState } from 'react';
import emailjs from '@emailjs/browser';
import { ArrowLeft, ArrowRight, BatteryCharging, Check, ChevronDown, Mail, X } from 'lucide-react';
import { EMAILJS_CONFIG } from '../../config/emailConfig';
import { bawM8Colours, bawM8Images, bawM8Versions } from '../../data/bawM8';

type VersionId = (typeof bawM8Versions)[number]['id'];

function getShortVersionName(version: (typeof bawM8Versions)[number]) {
  return version.version.replace('M8 EV ', '');
}

const sharedSpecs = [
  ['Range', '505 km CLTC'],
  ['Battery', '81 kWh LFP'],
  ['Motor torque', '310 Nm'],
  ['Body', 'Full-size MPV'],
] as const;

const differenceRows = [
  ['Seating', '7 seats 2+2+3', '9-seat light passenger 2+2+2+3', '7 seats 2+2+3'],
  ['Best for', 'Family / private use', 'Shuttle / tourism', 'Comfort-focused private or business use'],
  ['Sliding doors', 'Manual', 'Manual', 'Electric'],
  ['Front seats', 'Manual adjustment', 'Manual adjustment', 'Electric, heated, ventilated'],
  ['Second row', 'Independent seats, manual', 'Independent light bus seats', 'Powered comfort seats'],
  ['Comfort features', 'Core leather seating', 'Commercial passenger layout', 'Second-row heat, ventilation, massage and leg rest'],
  ['Audio', '8 speakers', '8 speakers', '11 speakers + 600W amplifier'],
  ['Camera / parking', 'Rear camera, rear radar', 'Rear camera, rear radar', '360-degree view, front and rear radar'],
  ['Driver assistance', 'Cruise control, LDW', 'Cruise control, LDW', 'Adaptive cruise, AEB, FCW, BSD, LKA, RCTA listed'],
] as const;

const optionGroups = [
  {
    title: 'Import confirmation',
    items: [
      'Right-hand-drive export availability',
      'NZ compliance pathway',
      'Final landed cost',
      'Delivery timeline',
    ],
  },
  {
    title: 'User experience',
    items: [
      'Charging plug compatibility',
      'English system availability',
      'Apple CarPlay / Android Auto availability',
      'Seat layout and colour availability',
    ],
  },
  {
    title: 'After-sales',
    items: ['Warranty terms', 'Parts supply', 'Service options', 'Repair support pathway'],
  },
] as const;

const colourSwatches = [
  { name: 'White', className: 'bg-[#f8f7f3]' },
  { name: 'Grey', className: 'bg-[#7f8589]' },
  { name: 'Black', className: 'bg-[#111111]' },
  {
    name: 'Black / White',
    className: 'bg-[linear-gradient(135deg,#111111_0_50%,#f8f7f3_50%_100%)]',
  },
  { name: 'Cyan', className: 'bg-[#7d9691]' },
  {
    name: 'Silver / Cyan',
    className: 'bg-[linear-gradient(135deg,#cfd4d2_0_50%,#7d9691_50%_100%)]',
  },
  {
    name: 'Silver / Green',
    className: 'bg-[linear-gradient(135deg,#cfd4d2_0_50%,#53675e_50%_100%)]',
  },
] as const;

function scrollToQuote() {
  document.getElementById('baw-m8-quote')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getCarouselPhotos(selectedId: VersionId, colourImage: string) {
  const common = [
    { title: 'Exterior colour', image: colourImage },
    { title: 'Front angle', image: bawM8Images.right45 },
    { title: 'Overhead', image: bawM8Images.overhead },
    { title: 'Interior', image: bawM8Images.interior },
    { title: 'Night interior', image: bawM8Images.nightInterior },
  ];

  const cabin =
    selectedId === 'premium-9'
      ? [
          { title: '9-seat layout', image: bawM8Images.layout9 },
          { title: 'Cabin view', image: bawM8Images.layoutCabin },
        ]
      : [
          { title: '7-seat layout', image: bawM8Images.layout7 },
          { title: 'Comfort cabin', image: bawM8Images.layout7Comfort },
        ];

  return [
    ...common,
    ...cabin,
    { title: 'Front grille', image: bawM8Images.grille },
    { title: 'Tail light', image: bawM8Images.tailLight },
    { title: 'Motor', image: bawM8Images.motor },
    { title: 'Thermal system', image: bawM8Images.thermal },
    { title: 'Frame', image: bawM8Images.frame },
    { title: 'REEV chassis', image: bawM8Images.reevChassis },
  ];
}

function BawM8HeroConfigurator({
  selectedId,
  onSelect,
}: {
  selectedId: VersionId;
  onSelect: (id: VersionId) => void;
}) {
  const [selectedColour, setSelectedColour] = useState(bawM8Colours[1]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const selected = bawM8Versions.find((version) => version.id === selectedId) ?? bawM8Versions[0];
  const carouselPhotos = getCarouselPhotos(selectedId, selectedColour.image);
  const activePhoto = carouselPhotos[slideIndex] ?? carouselPhotos[0];

  useEffect(() => {
    setSlideIndex(0);
  }, [selectedId, selectedColour.image]);

  const showPrevious = () => {
    setSlideIndex((current) => (current === 0 ? carouselPhotos.length - 1 : current - 1));
  };

  const showNext = () => {
    setSlideIndex((current) => (current === carouselPhotos.length - 1 ? 0 : current + 1));
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
              Model 01
            </p>
            <h1>BAW M8 EV / REEV MPV</h1>
            <p className="max-w-2xl text-lg leading-8 text-foreground/72">
              A practical new-energy 7/9-seater people mover available for direct import to New
              Zealand.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {sharedSpecs.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-black/6 bg-white/80 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                <p className="mt-1 text-base font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-slideUp overflow-hidden rounded-[24px] bg-white shadow-[0_28px_90px_rgba(17,17,17,0.1)]">
          <div className="grid gap-0 md:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
            <div className="relative flex items-center bg-[#f3f0e9] p-3 sm:p-5">
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="flex aspect-[16/9] w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-[18px] bg-gradient-to-br from-white to-[#ebe7df]"
                aria-label={`Open larger BAW M8 ${activePhoto.title} image`}
              >
                <img
                  key={activePhoto.image}
                  src={activePhoto.image}
                  alt={`BAW M8 ${activePhoto.title}`}
                  className="h-full w-full animate-scaleIn object-contain p-2"
                />
              </button>
              <button
                type="button"
                onClick={showPrevious}
                aria-label="Previous BAW M8 image"
                className="absolute left-5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-foreground shadow-lg hover:scale-105 hover:bg-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={showNext}
                aria-label="Next BAW M8 image"
                className="absolute right-5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-foreground shadow-lg hover:scale-105 hover:bg-white"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/92 px-4 py-2 text-sm font-bold text-foreground shadow-lg">
                <span>{activePhoto.title}</span>
                <span className="text-muted-foreground">
                  {slideIndex + 1} / {carouselPhotos.length}
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-between border-t border-black/6 p-6 sm:p-8 md:border-l md:border-t-0">
              <div className="space-y-7">
                <div className="space-y-3">
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-foreground/62">
                    Exterior colour
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {bawM8Colours.map((colour, index) => (
                      <button
                        key={colour.name}
                        type="button"
                        onClick={() => {
                          setSelectedColour(colour);
                        }}
                        aria-label={`Select ${colour.name} exterior colour`}
                        title={colour.name}
                        className={`h-10 w-10 rounded-full border p-1 shadow-sm transition-transform hover:scale-110 ${
                          selectedColour.name === colour.name
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-black/12 hover:border-primary/40'
                        }`}
                      >
                        <span
                          className={`block h-full w-full rounded-full border border-black/10 ${colourSwatches[index].className}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-foreground/62">
                    Choose configuration
                  </p>
                  <div className="space-y-3">
                    {bawM8Versions.map((version) => {
                      const isSelected = version.id === selectedId;
                      return (
                        <button
                          key={version.id}
                          type="button"
                          onClick={() => onSelect(version.id)}
                          className={`w-full rounded-[20px] border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                            isSelected
                              ? 'border-primary bg-primary/8 ring-2 ring-primary/20'
                              : 'border-black/8 bg-white hover:border-primary/35'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="mt-1 text-lg font-bold text-foreground">
                                {getShortVersionName(version)}
                              </h3>
                              <p className="mt-1 text-xs font-semibold text-foreground/68">
                                {version.seating}
                              </p>
                            </div>
                            <p className="text-right text-xl font-bold text-foreground">
                              {version.indicativePrice}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Pricing is subject to final specification, exchange rate, shipping, GST,
                    compliance and registration.
                  </p>
                </div>
              </div>

              <button type="button" onClick={scrollToQuote} className="button-primary mt-8 w-full">
                Request this configuration
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
              aria-label="Close BAW M8 image preview"
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={activePhoto.image}
              alt={`Large BAW M8 ${activePhoto.title}`}
              className="max-h-[88vh] max-w-[94vw] object-contain"
            />
          </div>
        )}
      </div>
    </section>
  );
}

function BawM8PriceAndDifferences({ selectedId }: { selectedId: VersionId }) {
  const selectedIndex = bawM8Versions.findIndex((version) => version.id === selectedId);

  return (
    <section className="px-4 py-12">
      <div className="section-shell space-y-8">
        <div className="animate-slideUp space-y-4">
          <div className="section-kicker">Differences</div>
          <p className="max-w-4xl text-sm text-muted-foreground">
            The table below focuses on what changes between versions.
          </p>
          <div className="overflow-hidden rounded-[24px] border border-black/6 bg-white shadow-[0_24px_80px_rgba(17,17,17,0.08)]">
            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full text-left">
                <thead>
                  <tr className="bg-[#161514] text-white">
                    <th className="w-[210px] px-5 py-4 text-sm font-semibold uppercase tracking-[0.12em]">
                      Configuration
                    </th>
                    {bawM8Versions.map((version) => (
                      <th key={version.id} className="px-5 py-4 text-sm font-semibold">
                        {getShortVersionName(version)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/6">
                  {differenceRows.map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell, index) => (
                        <td
                          key={`${row[0]}-${index}`}
                          className={`px-5 py-4 text-sm ${
                            index === 0
                              ? 'font-bold text-foreground'
                              : index - 1 === selectedIndex
                                ? 'bg-primary/8 font-semibold text-foreground'
                                : 'text-muted-foreground'
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

function BawM8Options() {
  const [openGroup, setOpenGroup] = useState(0);

  return (
    <section className="px-4 py-12">
      <div className="section-shell grid animate-slideUp gap-8 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-4">
          <div className="section-kicker">Options</div>
          <h2>Confirm before order</h2>
          <p>
            These are the practical option and confirmation items we check before placing an import
            order.
          </p>
        </div>

        <div className="space-y-3">
          {optionGroups.map((group, index) => {
            const isOpen = openGroup === index;
            return (
              <div key={group.title} className="section-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenGroup(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-bold text-foreground">{group.title}</span>
                  <ChevronDown className={`h-5 w-5 text-primary ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="grid gap-3 border-t border-black/6 p-5 sm:grid-cols-2">
                    {group.items.map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 flex-none text-primary" />
                        <span className="text-sm font-medium text-foreground/78">{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BawM8QuoteForm({ selectedId }: { selectedId: VersionId }) {
  const selected = bawM8Versions.find((version) => version.id === selectedId) ?? bawM8Versions[0];
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    intendedUse: 'Family',
    configuration: selected.version,
    powertrain: 'EV',
    budget: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData((current) => ({ ...current, configuration: selected.version }));
  }, [selected.version]);

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
          inquiryType: 'BAW M8 Import Quote',
          sourceType: 'China direct import',
          brand: 'BAW',
          model: formData.configuration,
          year: 'New / supplier availability to confirm',
          budget: formData.budget || 'Not specified',
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          message: [
            `Selected model: ${selected.version}`,
            `Intended use: ${formData.intendedUse}`,
            `Preferred configuration: ${formData.configuration}`,
            `Powertrain preference: ${formData.powertrain}`,
            `Message: ${formData.message || 'No additional details provided'}`,
          ].join('\n'),
          photoInfo: 'No photos uploaded',
          photoHtml: '<p>No photos uploaded</p>',
        },
        EMAILJS_CONFIG.publicKey
      );

      alert("Thank you for your BAW M8 enquiry. We'll be in touch within 24 hours.");
      setFormData({
        name: '',
        phone: '',
        email: '',
        intendedUse: 'Family',
        configuration: selected.version,
        powertrain: 'EV',
        budget: '',
        message: '',
      });
    } catch (error) {
      console.error('Error sending BAW M8 enquiry:', error);
      alert('Sorry, there was an error sending your enquiry. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-2xl border border-black/10 bg-white px-4 py-3 font-medium text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20';

  return (
    <section id="baw-m8-quote" className="px-4 py-20">
      <div className="section-shell grid animate-slideUp gap-8 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="section-card-dark bg-[#161514] p-8 text-white">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-white">Request BAW M8 Import Quote</h2>
          <p className="mt-4 text-white/72">
            We will confirm availability, specification, landed pricing and compliance pathway
            before order.
          </p>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="text-sm text-white/76">
              Source-file note: supplied specification is M8 EV 505km Left-hand Drive - General
              Version. RHD, REEV, warranty, charging and parts support must be confirmed.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="section-card space-y-5 p-5 sm:p-8">
          <label className="space-y-2">
            <span>Selected configuration</span>
            <select name="configuration" value={formData.configuration} onChange={handleChange} className={inputClass}>
              {bawM8Versions.map((version) => (
                <option key={version.id}>{version.version}</option>
              ))}
              <option>REEV option - please confirm availability</option>
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
                {['Family', 'Shuttle', 'Tourism', 'Business', 'Other'].map((option) => (
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
                placeholder="e.g. NZ$60k - NZ$70k"
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
              placeholder="Tell us colour, seat layout, business use or compliance questions."
            />
          </label>
          <button type="submit" disabled={isSubmitting} className="button-primary w-full">
            {isSubmitting ? 'Sending...' : 'Request selected configuration'}
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>
      </div>
    </section>
  );
}

export function BawM8Page() {
  const [selectedId, setSelectedId] = useState<VersionId>('premium-7');

  return (
    <div className="pt-20">
      <BawM8HeroConfigurator selectedId={selectedId} onSelect={setSelectedId} />
      <BawM8PriceAndDifferences selectedId={selectedId} />
      <BawM8Options />
      <BawM8QuoteForm selectedId={selectedId} />
    </div>
  );
}
