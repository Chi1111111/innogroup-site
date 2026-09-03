import { ChevronLeft, ChevronRight, Expand, Images, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { type JapanMarketVehicle, vehicleFullName } from '../../data/japanMarket';
import { useLanguage } from './SiteTranslator';

function uniqueVehiclePhotos(vehicle: JapanMarketVehicle) {
  return Array.from(new Set(
    [vehicle.imageUrl, ...(vehicle.imageUrls ?? [])]
      .filter((url): url is string => typeof url === 'string' && url.length > 0),
  ));
}

export function JapanMarketPhotoGallery({ vehicle }: { vehicle: JapanMarketVehicle }) {
  const { text } = useLanguage();
  const sourcePhotos = useMemo(() => uniqueVehiclePhotos(vehicle), [vehicle]);
  const [failedPhotos, setFailedPhotos] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const photos = sourcePhotos.filter((photo) => !failedPhotos.includes(photo));
  const activePhoto = photos[activeIndex];

  useEffect(() => {
    setFailedPhotos([]);
    setActiveIndex(0);
    setLightboxOpen(false);
  }, [vehicle.id]);

  useEffect(() => {
    if (activeIndex >= photos.length) setActiveIndex(Math.max(0, photos.length - 1));
  }, [activeIndex, photos.length]);

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxOpen(false);
      if (photos.length > 1 && event.key === 'ArrowLeft') {
        setActiveIndex((index) => (index - 1 + photos.length) % photos.length);
      }
      if (photos.length > 1 && event.key === 'ArrowRight') {
        setActiveIndex((index) => (index + 1) % photos.length);
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxOpen, photos.length]);

  const markPhotoFailed = (url: string) => {
    setFailedPhotos((current) => current.includes(url) ? current : [...current, url]);
  };
  const previousPhoto = () => setActiveIndex((index) => (index - 1 + photos.length) % photos.length);
  const nextPhoto = () => setActiveIndex((index) => (index + 1) % photos.length);
  const vehicleName = vehicleFullName(vehicle);

  if (!activePhoto) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-3xl bg-[#17191c] text-center text-white/50">
        <div>
          <Images className="mx-auto h-10 w-10 text-primary/70" />
          <p className="mt-3 text-sm font-bold">{text({ en: 'Photos pending', zh: '车辆照片待补充' })}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="group relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-3xl bg-[#17191c]">
        <img
          src={activePhoto}
          alt={`${vehicleName} — ${text({ en: `photo ${activeIndex + 1} of ${photos.length}`, zh: `第 ${activeIndex + 1} 张，共 ${photos.length} 张` })}`}
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain"
          onError={() => markPhotoFailed(activePhoto)}
        />
        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 text-xs font-bold text-white backdrop-blur-sm">
          <Images className="h-4 w-4 text-primary" />
          {activeIndex + 1} / {photos.length}
        </div>
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label={text({ en: 'Open full-screen gallery', zh: '打开全屏图库' })}
          className="absolute right-4 top-4 rounded-full bg-black/70 p-2.5 text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Expand className="h-5 w-5" />
        </button>
        {photos.length > 1 ? (
          <>
            <button type="button" onClick={previousPhoto} aria-label={text({ en: 'Previous photo', zh: '上一张照片' })} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-3 text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" onClick={nextPhoto} aria-label={text({ en: 'Next photo', zh: '下一张照片' })} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-3 text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ChevronRight className="h-5 w-5" /></button>
          </>
        ) : null}
      </div>

      {photos.length > 1 ? (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2" aria-label={text({ en: 'Vehicle photo thumbnails', zh: '车辆照片缩略图' })}>
          {photos.map((photo, index) => (
            <button
              key={photo}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={text({ en: `Show photo ${index + 1}`, zh: `查看第 ${index + 1} 张照片` })}
              aria-current={index === activeIndex ? 'true' : undefined}
              className={`h-20 w-28 flex-none overflow-hidden rounded-xl border-2 bg-[#17191c] transition ${index === activeIndex ? 'border-primary' : 'border-transparent opacity-65 hover:opacity-100'}`}
            >
              <img src={photo} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={() => markPhotoFailed(photo)} />
            </button>
          ))}
        </div>
      ) : null}

      {lightboxOpen ? (
        <div role="dialog" aria-modal="true" aria-label={text({ en: `${vehicleName} photo gallery`, zh: `${vehicleName} 车辆图库` })} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-8">
          <button type="button" onClick={() => setLightboxOpen(false)} aria-label={text({ en: 'Close gallery', zh: '关闭图库' })} className="absolute right-5 top-5 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><X className="h-6 w-6" /></button>
          <img src={activePhoto} alt={`${vehicleName} — ${activeIndex + 1} / ${photos.length}`} referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain" onError={() => markPhotoFailed(activePhoto)} />
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white">{activeIndex + 1} / {photos.length}</div>
          {photos.length > 1 ? (
            <>
              <button type="button" onClick={previousPhoto} aria-label={text({ en: 'Previous photo', zh: '上一张照片' })} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:left-8"><ChevronLeft className="h-7 w-7" /></button>
              <button type="button" onClick={nextPhoto} aria-label={text({ en: 'Next photo', zh: '下一张照片' })} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:right-8"><ChevronRight className="h-7 w-7" /></button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
