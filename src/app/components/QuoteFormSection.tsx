import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Upload, X } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { Link } from 'react-router';
import { EMAILJS_CONFIG } from '../../config/emailConfig';
import { uploadImageToCloudinary } from '../../config/cloudinaryConfig';
import { tradeMeMakes, tradeMeVehicleCatalog } from '../../data/tradeMeVehicleCatalog';
import { useLanguage } from './SiteTranslator';

const carBrands = [...tradeMeMakes];
const carModels = tradeMeVehicleCatalog;

const fieldLabelClass = 'text-xs font-bold uppercase tracking-[0.16em] text-[#151C26]/62';
const fieldClass =
  'w-full rounded-lg border border-[#151C26]/12 bg-[#F7F4EE] px-4 py-3.5 text-base font-medium text-[#151C26] transition-all placeholder:text-[#151C26]/35 focus:border-[#C6A54A] focus:outline-none focus:ring-1 focus:ring-[#C6A54A]';
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const CONTACT_FORM_RECIPIENT = 'innogroup.shawn@gmail.com';

interface QuoteFormSectionProps {
  focusedImport?: boolean;
}

export function QuoteFormSection({ focusedImport = false }: QuoteFormSectionProps = {}) {
  const { text } = useLanguage();
  const [briefStep, setBriefStep] = useState(focusedImport ? 2 : 1);
  const [formData, setFormData] = useState({
    inquiryType: 'buy',
    sourceType: 'japan',
    brand: '',
    model: '',
    year: '',
    budget: '',
    name: '',
    phone: '',
    email: '',
    message: '',
  });

  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactError, setContactError] = useState('');
  const imagePreviews = useMemo(() => uploadedImages.map((image) => URL.createObjectURL(image)), [uploadedImages]);

  useEffect(() => () => imagePreviews.forEach((preview) => URL.revokeObjectURL(preview)), [imagePreviews]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const source = params.get('source');
    const message = params.get('message') ?? '';
    const enquiryType = params.get('type') ?? '';
    if (!source && !message && !enquiryType && !params.get('vehicle')) return;

    const vehicle = params.get('vehicle') ?? '';
    const year = params.get('year') ?? '';
    const price = params.get('price') ?? '';
    const contextualMessage = enquiryType === 'finance'
      ? 'Hi Inno Group, I would like help understanding vehicle finance.'
      : enquiryType === 'support'
        ? 'Hi Inno Group, I need help with vehicle ownership support.'
        : '';
    const isChinaSource = source === 'china' || source === 'wox' || enquiryType === 'china';
    const isJapanSource = source === 'jpauc' || source === 'japan-special-order' || source === 'weekly-report' || source === 'inno-auto-weekly' || source === 'find-similar-weekly-vehicle';
    const fallbackMessage =
      source === 'japan-special-order' || isJapanSource
        ? `Hi Inno Group, I'm interested in a Japan special order search:\n${vehicle || 'Rare / classic / supercar from Japan'}`
        : vehicle
          ? `Hi Inno Group, I'm interested in this vehicle:\n${vehicle}`
          : contextualMessage;

    setFormData((current) => ({
      ...current,
      inquiryType: 'buy',
      sourceType: isChinaSource ? 'china' : isJapanSource ? 'japan' : current.sourceType,
      model: current.model || vehicle,
      year: current.year || year,
      budget: current.budget || price,
      message: current.message || message || fallbackMessage,
    }));
    setBriefStep(enquiryType === 'finance' ? 3 : 2);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone.trim() && !formData.email.trim()) {
      setContactError(text({ en: 'Add a phone number or email address so we can reply.', zh: '请填写电话号码或邮箱，方便我们回复。' }));
      setBriefStep(3);
      return;
    }

    setContactError('');
    setIsSubmitting(true);

    try {
      let photoInfo = '';
      let photoHtml = '';

      if (uploadedImages.length > 0) {
        photoInfo = `Customer uploaded ${uploadedImages.length} photo(s):\n\n`;
        photoHtml = `<div style="margin: 20px 0;">
          <h3 style="color: #d4af37; margin-bottom: 15px;">Customer Uploaded Photos (${uploadedImages.length})</h3>`;

        const uploadPromises = uploadedImages.map(async (file, index) => {
          try {
            const url = await uploadImageToCloudinary(file);
            return { success: true, url, fileName: file.name, index };
          } catch (error) {
            console.error(`Failed to upload image ${index + 1}:`, error);
            return { success: false, fileName: file.name, index };
          }
        });

        const uploadResults = await Promise.all(uploadPromises);

        uploadResults.forEach((result) => {
          if (result.success) {
            photoInfo += `Photo ${result.index + 1}: ${result.url}\n`;
            photoHtml += `
              <div style="margin-bottom: 20px;">
                <p style="margin-bottom: 5px;"><strong>Photo ${result.index + 1}:</strong></p>
                <a href="${result.url}" target="_blank">
                  <img src="${result.url}" alt="Vehicle Photo ${result.index + 1}"
                       style="max-width: 600px; width: 100%; height: auto; border-radius: 8px; border: 2px solid #d4af37; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
                </a>
                <p style="font-size: 12px; color: #666; margin-top: 5px;">Click image to view full size: ${result.url}</p>
              </div>`;
          } else {
            photoInfo += `Photo ${result.index + 1}: Upload failed (${result.fileName})\n`;
            photoHtml += `<p style="color: red;">Photo ${result.index + 1}: Upload failed</p>`;
          }
        });

        photoHtml += `</div>`;
        photoInfo += `\nContact: ${formData.phone}\nEmail: ${formData.email}`;
      } else {
        photoInfo = 'No photos uploaded';
        photoHtml = '<p>No photos uploaded</p>';
      }

      const templateParams = {
        to_email: CONTACT_FORM_RECIPIENT,
        to_name: 'Inno Group',
        reply_to: formData.email,
        from_name: formData.name,
        from_email: formData.email,
        subject: `[Website ${formData.inquiryType === 'buy' ? 'Buy' : 'Sell'} Enquiry] ${formData.name}`,
        inquiryType: formData.inquiryType === 'buy' ? 'Buy a Car' : 'Sell My Car',
        sourceType: formData.sourceType === 'japan'
          ? 'Import from Japan'
          : formData.sourceType === 'china'
            ? 'Cars from China'
            : 'Buy Local Stock (NZ)',
        brand: formData.brand || 'Not specified',
        model: formData.model || 'Not specified',
        year: formData.year || 'Not specified',
        budget: formData.budget || 'Not specified',
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        message: formData.message || 'No additional details provided',
        photoInfo,
        photoHtml,
      };

      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams,
        EMAILJS_CONFIG.publicKey
      );

      alert(text({
        en: "Thank you. Your enquiry has been sent to Inno Group. We'll usually reply within one business day.",
        zh: '谢谢，您的咨询已发送给 Inno Group。我们通常会在一个工作日内回复。',
      }));

      setFormData({
        inquiryType: 'buy',
        sourceType: 'japan',
        brand: '',
        model: '',
        year: '',
        budget: '',
        name: '',
        phone: '',
        email: '',
        message: '',
      });
      setUploadedImages([]);
      setBriefStep(focusedImport ? 2 : 1);
    } catch (error) {
      console.error('Error sending email:', error);
      alert(text({
        en: 'We could not send the enquiry. Please try again, or contact us by phone or WhatsApp.',
        zh: '咨询暂时无法发送，请重试，或通过电话、WhatsApp 联系我们。',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if ((name === 'name' || name === 'phone' || name === 'email') && contactError) setContactError('');
    setFormData({
      ...formData,
      [name]: value,
      ...(name === 'brand' ? { model: '' } : {}),
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).filter((file) => ALLOWED_IMAGE_TYPES.has(file.type) && file.size <= MAX_IMAGE_BYTES);
      if (newImages.length !== files.length) {
        alert(text({ en: 'Please use JPG, PNG or WebP images up to 5 MB each.', zh: '请上传 JPG、PNG 或 WebP 图片，每张不超过 5 MB。' }));
      }
      setUploadedImages((prev) => [...prev, ...newImages].slice(0, 8));
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const selectedModels = formData.brand ? carModels[formData.brand] ?? [] : [];

  const chooseBriefType = (type: 'buy-local' | 'import-japan' | 'import-china' | 'sell') => {
    setFormData((current) => ({
      ...current,
      inquiryType: type === 'sell' ? 'sell' : 'buy',
      sourceType: type === 'import-japan' ? 'japan' : type === 'import-china' ? 'china' : 'local',
    }));
    setBriefStep(2);
  };

  const selectedBriefType =
    formData.inquiryType === 'sell'
      ? 'sell'
      : formData.sourceType === 'japan'
        ? 'import-japan'
        : formData.sourceType === 'china'
          ? 'import-china'
        : 'buy-local';

  const briefOptions = [
    { id: 'buy-local', label: text({ en: 'Buy a Car', zh: '购买现车' }), description: text({ en: 'Browse available vehicles and local options', zh: '查看现有车辆与新西兰本地选择' }) },
    { id: 'import-japan', label: text({ en: 'Import from Japan', zh: '从日本进口' }), description: text({ en: 'Ask us to find the exact car you want', zh: '请我们寻找你指定的车型' }) },
    { id: 'import-china', label: text({ en: 'Cars from China', zh: '中国车源' }), description: text({ en: 'Explore selected new models', zh: '了解精选新车型' }) },
    { id: 'sell', label: text({ en: 'Sell My Car', zh: '出售我的车辆' }), description: text({ en: 'Request an initial valuation', zh: '提交车辆信息，获取初步估价' }) },
  ] as const;

  const displayedStep = focusedImport ? briefStep - 1 : briefStep;
  const totalSteps = focusedImport ? 2 : 3;

  return (
    <section className="relative overflow-hidden bg-[#151C26] px-4 py-16 text-[#F3F0E9] sm:py-20 lg:py-24">
      <div className="relative mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.4fr_0.6fr] lg:items-start xl:gap-16">
        <div className="relative max-w-xl pt-2">
          <div className="absolute -left-7 top-3 hidden h-32 w-px bg-[#C6A54A]/60 lg:block" />
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#C6A54A]">
            {text({ en: 'Personalised Vehicle Sourcing', zh: '个性化车辆采购' })}
          </p>
          <h2 className="mt-7 max-w-xl text-4xl leading-[1.05] text-[#F3F0E9] sm:text-5xl xl:text-[3.7rem]">
            {text({ en: 'Tell Us What You Want.', zh: '告诉我们你想要什么车。' })}
            <span className="block">
              {text({ en: 'We’ll Find ', zh: '我们帮你找到' })}<span className="text-[#C6A54A]">{text({ en: 'the Right One.', zh: '合适的选择。' })}</span>
            </span>
          </h2>
          <p className="mt-7 max-w-lg text-base leading-8 text-[#F3F0E9]/70 sm:text-lg">
            {text({
              en: 'Share the model, specification and budget you have in mind. We’ll search our Japan network and selected New Zealand stock, then return with options chosen for you.',
              zh: '告诉我们车型、配置和预算。我们会从日本采购网络与精选新西兰车源中寻找，并回复适合你的选择。',
            })}
          </p>

          <div className="mt-14 flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#F3F0E9]/58">
            <span>{text({ en: 'Japan Network', zh: '日本车源网络' })}</span>
            <span className="h-px w-7 bg-[#C6A54A]/55" />
            <span>{text({ en: 'Selected NZ Stock', zh: '精选新西兰现车' })}</span>
            <span className="h-px w-7 bg-[#C6A54A]/55" />
            <span>{text({ en: 'Personal Response', zh: '专人回复' })}</span>
          </div>
        </div>

        <div className="w-full lg:min-w-[650px]">
          <div className="rounded-xl border border-[#F7F4EE]/10 bg-[#F7F4EE] p-6 text-[#151C26] sm:p-8 lg:p-10">
            <form onSubmit={handleSubmit}>
              <div key={briefStep} className="animate-fadeIn">
                <div className="mb-8 flex items-center justify-between border-b border-[#151C26]/10 pb-5">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#151C26]/48">
                    {String(displayedStep).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
                  </p>
                  {briefStep > (focusedImport ? 2 : 1) && (
                    <button
                      type="button"
                      onClick={() => setBriefStep(briefStep - 1)}
                      className="text-xs font-bold uppercase tracking-[0.16em] text-[#151C26]/45 hover:text-[#151C26]"
                    >
                      {text({ en: 'Back', zh: '返回' })}
                    </button>
                  )}
                </div>

                {briefStep === 1 && (
                  <div>
                    <div className="space-y-3">
                      <h3 className="font-display text-[2.35rem] font-bold leading-tight text-[#151C26] sm:text-[2.65rem]">
                        {text({ en: 'How can we help?', zh: '你希望我们怎样协助？' })}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <p className="text-base font-medium text-[#151C26]/62">
                          {text({ en: 'Choose an option to get started.', zh: '选择最符合你需求的入口。' })}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#151C26]/38">
                          {text({ en: 'Takes less than 2 minutes', zh: '约 2 分钟完成' })}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 space-y-3">
                      {briefOptions.map((option) => {
                        const isSelected = selectedBriefType === option.id;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => chooseBriefType(option.id)}
                            className={`group flex min-h-[86px] w-full items-center justify-between gap-5 rounded-xl border px-5 py-4 text-left transition-all duration-200 hover:-translate-y-px hover:bg-[#ebe5d9] ${
                              isSelected
                                ? 'border-[#C6A54A] bg-[#eee6d8]'
                                : 'border-[#151C26]/10 bg-[#f1eee7]'
                            }`}
                          >
                            <span>
                              <span className="block text-xl font-semibold text-[#151C26]">{option.label}</span>
                              <span className="mt-1 block text-sm font-medium text-[#151C26]/55">
                                {option.description}
                              </span>
                            </span>
                            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-[#151C26]/12 text-[#151C26]/55 transition-all duration-200 group-hover:border-[#151C26] group-hover:bg-[#151C26] group-hover:text-[#F7F4EE]">
                              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {briefStep === 2 && (
                  <div>
                    <h3 className="font-display text-3xl font-bold text-[#151C26] sm:text-4xl">
                      {text({ en: 'Tell us about the car.', zh: '告诉我们车辆需求。' })}
                    </h3>

                    {formData.inquiryType === 'sell' && (
                      <p className="mt-4 max-w-2xl text-sm leading-6 text-[#151C26]/60">
                        {text({
                          en: 'We buy quality vehicles for local stock and export channels. Share the key details and optional photos for a more accurate valuation.',
                          zh: '我们为本地库存与出口渠道收购优质车辆。提供主要信息和可选照片，有助于获得更准确的初步估价。',
                        })}
                      </p>
                    )}

                    <div className="mt-8 grid gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className={fieldLabelClass}>{text({ en: 'Make', zh: '品牌' })}</label>
                        <select
                          name="brand"
                          value={formData.brand}
                          onChange={handleChange}
                          required={formData.inquiryType === 'sell'}
                          className={fieldClass}
                        >
                          <option value="">{text({ en: 'Select make', zh: '选择品牌' })}</option>
                          {carBrands.map((brand) => (
                            <option key={brand} value={brand}>
                              {brand}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className={fieldLabelClass}>{text({ en: 'Model', zh: '车型' })}</label>
                        {formData.brand && selectedModels.length > 0 ? (
                          <select
                            name="model"
                            value={formData.model}
                            onChange={handleChange}
                            required={formData.inquiryType === 'sell' && formData.brand !== ''}
                            className={fieldClass}
                          >
                            <option value="">{text({ en: 'Select model', zh: '选择车型' })}</option>
                            {selectedModels.map((model) => (
                              <option key={model} value={model}>
                                {model}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            name="model"
                            value={formData.model}
                            onChange={handleChange}
                            required={formData.inquiryType === 'sell' && formData.brand !== ''}
                            className={fieldClass}
                            placeholder={formData.brand ? text({ en: 'Enter model', zh: '输入车型' }) : text({ en: 'Model or trim', zh: '车型或版本' })}
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className={fieldLabelClass}>{text({ en: 'Preferred Year', zh: '期望年份' })}</label>
                        <input
                          type="text"
                          name="year"
                          value={formData.year}
                          onChange={handleChange}
                          required={formData.inquiryType === 'sell'}
                          className={fieldClass}
                          placeholder={text({ en: 'e.g. 2018–2023', zh: '例如：2018–2023' })}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className={fieldLabelClass}>
                          {formData.inquiryType === 'buy' ? text({ en: 'Approximate Budget', zh: '大概预算' }) : text({ en: 'Expected Price', zh: '期望售价' })}
                        </label>
                        <input
                          type="text"
                          name="budget"
                          value={formData.budget}
                          onChange={handleChange}
                          className={fieldClass}
                          placeholder={formData.inquiryType === 'buy' ? '$40,000–$50,000' : '$35,000'}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className={fieldLabelClass}>{text({ en: 'Additional Preferences', zh: '其他要求' })}</label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          rows={4}
                          className={fieldClass}
                          placeholder={
                            formData.inquiryType === 'buy'
                              ? text({ en: 'Colour, transmission, features, mileage, timing…', zh: '颜色、变速箱、配置、公里数、时间要求等…' })
                              : text({ en: 'Mileage, condition, service history, modifications…', zh: '公里数、车况、保养记录、改装情况等…' })
                          }
                        />
                      </div>
                    </div>

                    {formData.inquiryType === 'sell' && (
                      <div className="mt-6 space-y-3">
                        <label className={fieldLabelClass}>{text({ en: 'Vehicle Photos (Optional, Max 8)', zh: '车辆照片（可选，最多 8 张）' })}</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          id="imageUpload"
                        />
                        <label
                          htmlFor="imageUpload"
                          className="flex cursor-pointer items-center justify-center gap-3 rounded-lg border border-dashed border-[#151C26]/18 px-4 py-5 text-sm font-semibold text-[#151C26]/65 transition-colors hover:border-[#C6A54A] hover:text-[#151C26]"
                        >
                          <Upload className="h-5 w-5" />
                          {text({ en: 'Upload clear photos', zh: '上传清晰照片' })}
                        </label>

                        {uploadedImages.length > 0 && (
                          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            {uploadedImages.map((image, index) => (
                              <div key={index} className="group relative">
                                <img
                                  src={imagePreviews[index]}
                                  alt={`Vehicle ${index + 1}`}
                                  loading="lazy"
                                  decoding="async"
                                  className="h-24 w-full rounded-lg border border-[#151C26]/10 object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  aria-label={text({ en: `Remove photo ${index + 1}`, zh: `删除第 ${index + 1} 张图片` })}
                                  className="absolute -right-2 -top-2 rounded-full bg-[#151C26] p-1.5 text-[#F7F4EE] transition-transform hover:scale-105"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setBriefStep(3)}
                      className="group mt-8 flex w-full items-center justify-between rounded-lg border border-[#151C26] px-5 py-4 text-base font-bold text-[#151C26] transition-colors hover:border-[#C6A54A]"
                    >
                      {text({ en: 'Continue', zh: '继续' })}
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                )}

                {briefStep === 3 && (
                  <div>
                    <h3 className="font-display text-3xl font-bold text-[#151C26] sm:text-4xl">
                      {text({ en: 'Where should we send your options?', zh: '我们应该怎样联系你？' })}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-[#151C26]/58">
                      {text({ en: 'Add either a phone number or an email address. You do not need to provide both.', zh: '电话号码或邮箱填写其中一项即可，无需同时提供。' })}
                    </p>

                    <div className="mt-8 grid gap-5 md:grid-cols-3">
                      <div className="space-y-2">
                        <label className={fieldLabelClass}>{text({ en: 'Full Name', zh: '姓名' })}</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className={fieldClass}
                          placeholder={text({ en: 'Your name', zh: '你的姓名' })}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className={fieldLabelClass}>{text({ en: 'Phone', zh: '电话' })}</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className={fieldClass}
                          placeholder="+64 21..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className={fieldLabelClass}>{text({ en: 'Email', zh: '邮箱' })}</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={fieldClass}
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    {contactError ? (
                      <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {contactError}
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group mt-9 flex w-full items-center justify-between rounded-lg bg-[#151C26] px-5 py-4 text-base font-bold text-[#F7F4EE] transition-colors hover:bg-[#1d2735] disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      <span>
                        {isSubmitting
                          ? text({ en: 'Sending…', zh: '正在发送…' })
                          : formData.inquiryType === 'sell'
                            ? text({ en: 'Request My Valuation', zh: '提交估价需求' })
                            : text({ en: 'Request My Options', zh: '提交车辆需求' })}
                      </span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </button>

                    <p className="mt-5 text-center text-xs font-medium text-[#151C26]/45">
                      {text({ en: 'We use these details only to respond to your enquiry. See our ', zh: '我们仅使用这些信息回复你的咨询。查看' })}
                      <Link to="/privacy" className="underline underline-offset-2 hover:text-[#151C26]">
                        {text({ en: 'privacy statement', zh: '隐私声明' })}
                      </Link>
                      {text({ en: '.', zh: '。' })}
                    </p>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
