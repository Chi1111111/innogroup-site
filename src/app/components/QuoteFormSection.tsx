import { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Clock, Award, Upload, X } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../../config/emailConfig';
import { uploadImageToCloudinary } from '../../config/cloudinaryConfig';
import { tradeMeMakes, tradeMeVehicleCatalog } from '../../data/tradeMeVehicleCatalog';

const carBrands = [...tradeMeMakes];
const carModels = tradeMeVehicleCatalog;

const fieldLabelClass = 'flex items-center gap-2 text-base font-bold text-foreground md:text-lg';
const fieldClass =
  'w-full rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 px-5 py-3.5 text-base font-medium shadow-sm transition-all hover:shadow-md focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/30 md:px-6 md:py-4 md:text-lg';
const helperCardClass =
  'group rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-all hover:border-primary/50 md:p-6';

function FieldDot() {
  return <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />;
}

export function QuoteFormSection() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        inquiryType: formData.inquiryType === 'buy' ? 'Buy a Car' : 'Sell My Car',
        sourceType: formData.sourceType === 'japan' ? 'Import from Japan' : 'Buy Local Stock (NZ)',
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

      alert("Thank you for your inquiry! We'll be in touch within 24 hours.");

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
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Sorry, there was an error sending your inquiry. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
      ...(name === 'brand' ? { model: '' } : {}),
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files);
      setUploadedImages((prev) => [...prev, ...newImages].slice(0, 8));
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const selectedModels = formData.brand ? carModels[formData.brand] ?? [] : [];

  return (
    <section id="quote" className="relative overflow-hidden px-4 py-20 sm:py-24 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-primary/10" />
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-primary opacity-10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-primary opacity-10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-12 space-y-5 text-center md:mb-16 md:space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/20 px-5 py-2.5 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-primary md:h-5 md:w-5" />
            <span className="text-sm font-semibold text-primary">Start Your Vehicle Brief</span>
          </div>

          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl md:mb-6 md:text-5xl">
            Tell Us What You Want
            <span className="mt-2 block bg-gradient-to-r from-primary via-yellow-300 to-primary bg-clip-text text-transparent">
              to Drive
            </span>
          </h2>

          <p className="mx-auto max-w-3xl text-base leading-8 text-gray-300 sm:text-lg md:text-xl">
            Share the make, model, budget, and features you want, and we will come back with
            tailored options from Japan or selected local stock.
          </p>
        </div>

        <div className="mx-auto mb-10 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3 md:mb-16 md:gap-6">
          <div className={helperCardClass}>
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-primary/20 p-3">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-white">Tailored Search</p>
                <p className="text-sm text-gray-400">Spec-led recommendations</p>
              </div>
            </div>
          </div>

          <div className={helperCardClass}>
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-primary/20 p-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-white">Quick Response</p>
                <p className="text-sm text-gray-400">Within 24 Hours</p>
              </div>
            </div>
          </div>

          <div className={helperCardClass}>
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-primary/20 p-3">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-white">After Delivery</p>
                <p className="text-sm text-gray-400">Support continues after purchase</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="relative">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary via-yellow-300 to-primary opacity-20 blur-2xl" />

            <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="h-2 bg-gradient-to-r from-primary via-yellow-300 to-primary" />

              <div className="p-6 sm:p-8 md:p-14">
                <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                  <div className="space-y-3">
                    <label className={fieldLabelClass}>
                      <FieldDot />
                      I Want To
                    </label>
                    <select
                      name="inquiryType"
                      value={formData.inquiryType}
                      onChange={handleChange}
                      required
                      className={fieldClass}
                    >
                      <option value="buy">Buy a Car</option>
                      <option value="sell">Sell My Car</option>
                    </select>
                  </div>

                  {formData.inquiryType === 'buy' && (
                    <div className="animate-fadeIn space-y-3">
                      <label className={fieldLabelClass}>
                        <FieldDot />
                        Vehicle Source
                      </label>
                      <select
                        name="sourceType"
                        value={formData.sourceType}
                        onChange={handleChange}
                        required
                        className={fieldClass}
                      >
                        <option value="japan">Import from Japan</option>
                        <option value="local">Buy Local Stock (NZ)</option>
                      </select>
                    </div>
                  )}

                  {formData.inquiryType === 'sell' && (
                    <div className="animate-fadeIn rounded-2xl border-2 border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 md:p-6">
                      <p className="font-medium leading-relaxed text-foreground">
                        We buy quality vehicles for local stock and export channels. Tell us about
                        your car and we will get back to you with a valuation.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <label className={fieldLabelClass}>
                        <FieldDot />
                        Vehicle Brand {formData.inquiryType === 'sell' && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        name="brand"
                        value={formData.brand}
                        onChange={handleChange}
                        required={formData.inquiryType === 'sell'}
                        className={fieldClass}
                      >
                        <option value="">Select Brand</option>
                        {carBrands.map((brand) => (
                          <option key={brand} value={brand}>
                            {brand}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.brand && (
                      <div className="animate-fadeIn space-y-3">
                        <label className={fieldLabelClass}>
                          <FieldDot />
                          Vehicle Model {formData.inquiryType === 'sell' && <span className="text-red-500">*</span>}
                        </label>
                        {selectedModels.length > 0 ? (
                          <select
                            name="model"
                            value={formData.model}
                            onChange={handleChange}
                            required={formData.inquiryType === 'sell' && formData.brand !== ''}
                            className={fieldClass}
                          >
                            <option value="">Select Model</option>
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
                            placeholder="Enter model"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <label className={fieldLabelClass}>
                        <FieldDot />
                        Year {formData.inquiryType === 'sell' && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        required={formData.inquiryType === 'sell'}
                        className={fieldClass}
                        placeholder="e.g. 2022"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className={fieldLabelClass}>
                        <FieldDot />
                        {formData.inquiryType === 'buy' ? 'Budget Range' : 'Expected Price'}
                      </label>
                      <input
                        type="text"
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        className={fieldClass}
                        placeholder={formData.inquiryType === 'buy' ? '$40,000 - $50,000' : '$35,000'}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className={fieldLabelClass}>
                      <FieldDot />
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={fieldClass}
                      placeholder="Enter your name"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <label className={fieldLabelClass}>
                        <FieldDot />
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className={fieldClass}
                        placeholder="+64 21 XXX XXXX"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className={fieldLabelClass}>
                        <FieldDot />
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className={fieldClass}
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className={fieldLabelClass}>
                      <FieldDot />
                      Additional Details
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      className={fieldClass}
                      placeholder={
                        formData.inquiryType === 'buy'
                          ? 'Tell us your preferred colour, transmission, features, and timeline...'
                          : 'Tell us about mileage, condition, service history, and modifications...'
                      }
                    />
                  </div>

                  {formData.inquiryType === 'sell' && (
                    <div className="animate-fadeIn space-y-4">
                      <label className={fieldLabelClass}>
                        <FieldDot />
                        Vehicle Photos (Optional, Max 8)
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Upload clear photos from different angles for a more accurate valuation.
                      </p>

                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="imageUpload"
                      />
                      <label
                        htmlFor="imageUpload"
                        className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent px-5 py-6 transition-all hover:border-primary hover:bg-primary/10 md:px-6 md:py-8"
                      >
                        <Upload className="h-7 w-7 text-primary transition-transform group-hover:scale-110 md:h-8 md:w-8" />
                        <div className="text-center">
                          <p className="font-semibold text-foreground">Click to upload images</p>
                          <p className="text-sm text-muted-foreground">PNG or JPG up to 10MB each</p>
                        </div>
                      </label>

                      {uploadedImages.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                          {uploadedImages.map((image, index) => (
                            <div key={index} className="group relative">
                              <img
                                src={URL.createObjectURL(image)}
                                alt={`Vehicle ${index + 1}`}
                                className="h-32 w-full rounded-xl border-2 border-gray-200 object-cover transition-all group-hover:border-primary"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-all hover:scale-110 hover:bg-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
                                Photo {index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {uploadedImages.length > 0 && (
                        <p className="text-center text-sm text-muted-foreground">
                          {uploadedImages.length} of 8 images uploaded
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-yellow-400 to-primary py-4 text-lg font-bold text-white shadow-2xl transition-all hover:scale-[1.01] hover:shadow-primary/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 md:py-6 md:text-xl"
                  >
                    <div className="absolute inset-0 translate-x-[-200%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-[200%]" />
                    <span className="relative flex items-center justify-center gap-3">
                      {isSubmitting ? (
                        <>
                          <div className="h-6 w-6 animate-spin rounded-full border-3 border-white border-t-transparent" />
                          Sending...
                        </>
                      ) : (
                        <>
                          {formData.inquiryType === 'buy' ? 'Request My Options' : 'Get My Valuation'}
                          <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
                        </>
                      )}
                    </span>
                  </button>

                  <p className="text-center text-sm text-gray-500">
                    Your information is secure and confidential. We respect your privacy.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
