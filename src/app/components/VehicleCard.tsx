import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Expand,
  Gauge,
  X,
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface VehicleCardProps {
  image: string;
  images?: string[];
  name: string;
  priceRange: string;
  year: string;
  mileage: string;
  availability: string;
}

export function VehicleCard({
  image,
  images,
  name,
  priceRange,
  year,
  mileage,
  availability,
}: VehicleCardProps) {
  const galleryImages = images?.length ? images : [image];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [name, image, images]);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLightboxOpen(false);
      }

      if (event.key === 'ArrowLeft' && galleryImages.length > 1) {
        setCurrentImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
      }

      if (event.key === 'ArrowRight' && galleryImages.length > 1) {
        setCurrentImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [galleryImages.length, isLightboxOpen]);

  const handleEnquire = () => {
    const message = encodeURIComponent(
      `Hi, I'm interested in the ${name} (${year}, ${mileage}). Could you provide more details?`
    );
    window.open(`https://wa.me/642885307225?text=${message}`, '_blank');
  };

  const showGalleryControls = galleryImages.length > 1;

  const showPreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const showNextImage = () => {
    setCurrentImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="relative block h-64 w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 text-left"
          aria-label={`Open ${name} image gallery`}
        >
          <ImageWithFallback
            key={`${name}-${currentImageIndex}`}
            src={galleryImages[currentImageIndex]}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />

          <div className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white">
              {availability}
            </span>
          </div>

          <div className="absolute right-4 top-4 rounded-full bg-white/92 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-sm text-primary">
              {showGalleryControls ? `${currentImageIndex + 1}/${galleryImages.length}` : availability}
            </span>
          </div>

          <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm">
            <Expand className="h-3.5 w-3.5" />
            <span>View larger</span>
          </div>

          {showGalleryControls ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showPreviousImage();
                }}
                aria-label={`Show previous ${name} image`}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-all hover:bg-black/60"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showNextImage();
                }}
                aria-label={`Show next ${name} image`}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-all hover:bg-black/60"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/35 px-3 py-2 backdrop-blur-sm">
                {galleryImages.map((galleryImage, index) => (
                  <button
                    key={`${galleryImage}-${index}`}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    aria-label={`Show ${name} image ${index + 1}`}
                    className={`h-2 w-2 rounded-full transition-all ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/35'
                    }`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </button>

        <div className="p-6">
          <h3 className="mb-3 transition-colors group-hover:text-primary">{name}</h3>
          <p className="mb-5 text-3xl text-primary">{priceRange}</p>
          <div className="mb-5 space-y-3 text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-1.5">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">{year}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-1.5">
                <Gauge className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">{mileage}</span>
            </div>
          </div>
          <button
            onClick={handleEnquire}
            className="group/btn flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 py-3 text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
          >
            Enquire Now
            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </button>
        </div>
      </div>

      {isLightboxOpen
        ? createPortal(
            <>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="fixed inset-0 z-[90] bg-black/82 backdrop-blur-md"
                aria-label={`Close ${name} image gallery`}
              />

              <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 sm:px-8">
                <div className="relative flex w-full max-w-6xl flex-col items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(false)}
                    className="absolute right-0 top-0 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                    aria-label={`Close ${name} image gallery`}
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <div className="mb-4 mt-14 flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
                    <span className="font-medium">{name}</span>
                    <span className="text-white/45">|</span>
                    <span>
                      {currentImageIndex + 1} / {galleryImages.length}
                    </span>
                  </div>

                  <div className="relative flex w-full items-center justify-center">
                    {showGalleryControls ? (
                      <button
                        type="button"
                        onClick={showPreviousImage}
                        aria-label={`Show previous ${name} image`}
                        className="absolute left-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                    ) : null}

                    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/20 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
                      <ImageWithFallback
                        key={`lightbox-${name}-${currentImageIndex}`}
                        src={galleryImages[currentImageIndex]}
                        alt={`${name} large view ${currentImageIndex + 1}`}
                        className="max-h-[78vh] w-auto max-w-full object-contain"
                      />
                    </div>

                    {showGalleryControls ? (
                      <button
                        type="button"
                        onClick={showNextImage}
                        aria-label={`Show next ${name} image`}
                        className="absolute right-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    ) : null}
                  </div>

                  {showGalleryControls ? (
                    <div className="mt-5 flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full bg-white/8 px-4 py-3 backdrop-blur-sm">
                      {galleryImages.map((galleryImage, index) => (
                        <button
                          key={`lightbox-dot-${galleryImage}-${index}`}
                          type="button"
                          onClick={() => setCurrentImageIndex(index)}
                          aria-label={`Show ${name} image ${index + 1}`}
                          className={`h-2.5 w-2.5 rounded-full transition-all ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white/35'
                          }`}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </>,
            document.body
          )
        : null}
    </>
  );
}
