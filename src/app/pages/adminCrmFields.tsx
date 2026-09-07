import { type ClipboardEvent, useState } from 'react';
import { UsersRound } from 'lucide-react';
import { uploadImageToCloudinary } from '../../config/cloudinaryConfig';
import type { CrmOrder } from '../lib/crm';
import { getErrorMessage } from '../lib/contracts';

export function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-slate-500 focus:ring-4 focus:ring-slate-200/80"
      />
    </label>
  );
}

export function ComboField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative block">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          {label}
        </span>
        <input
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
          placeholder={placeholder}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-slate-500 focus:ring-4 focus:ring-slate-200/80"
        />
      </label>
      {isOpen ? (
        <div className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className="block w-full px-3 py-2 text-left text-slate-400 hover:bg-slate-50"
          >
            空白
          </button>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left hover:bg-slate-50 ${
                option === value ? 'font-semibold text-slate-950' : 'text-slate-700'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function StatButton({
  label,
  value,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: typeof UsersRound;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
        active ? 'border-slate-950 ring-2 ring-slate-950/10' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold text-slate-950">{value}</p>
    </button>
  );
}

async function automaticallyOrderVehicleImages(urls: string[]) {
  const scored = await Promise.all(
    urls.map(
      (url, index) =>
        new Promise<{ url: string; index: number; score: number }>((resolve) => {
          const image = new Image();
          const finish = (score: number) => resolve({ url, index, score });
          image.onload = () => {
            const ratio = image.naturalWidth / Math.max(image.naturalHeight, 1);
            const landscapePriority = ratio >= 1.2 ? 2_000_000_000 : ratio >= 0.9 ? 1_000_000_000 : 0;
            finish(landscapePriority + image.naturalWidth * image.naturalHeight);
          };
          image.onerror = () => finish(-index);
          image.src = url;
        })
    )
  );

  return scored
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((item) => item.url);
}

export function OrderVehiclePhotos({
  order,
  onChange,
}: {
  order: CrmOrder;
  onChange: (images: string[]) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const images = order.vehicleImages ?? [];

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= images.length) return;
    const nextImages = [...images];
    const [movedImage] = nextImages.splice(fromIndex, 1);
    nextImages.splice(toIndex, 0, movedImage);
    onChange(nextImages);
  };

  const addImages = async (files: FileList | File[] | null) => {
    const selected = Array.from(files ?? []).filter((file) => file.type.startsWith('image/'));
    if (!selected.length) return;
    setIsUploading(true);
    setError('');
    try {
      const uploaded = await Promise.all(selected.map((file) => uploadImageToCloudinary(file)));
      const ordered = await automaticallyOrderVehicleImages(
        Array.from(new Set([...images, ...uploaded]))
      );
      onChange(ordered);
    } catch (uploadError) {
      setError(getErrorMessage(uploadError));
    } finally {
      setIsUploading(false);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const pastedImages = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));
    if (!pastedImages.length) return;
    event.preventDefault();
    void addImages(pastedImages);
  };

  return (
    <div
      className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 outline-none transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100"
      onPaste={handlePaste}
      tabIndex={0}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">车辆照片</p>
          <p className="mt-1 text-xs text-slate-500">Ctrl + V 粘贴或选择图片，数量不限；可拖动照片调整顺序，第一张为客户页主图。</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black">
          {isUploading ? '上传中…' : '选择图片'}
          <input
            type="file"
            accept="image/*,.webp,.avif,.heic,.heif"
            multiple
            disabled={isUploading}
            className="hidden"
            onChange={(event) => {
              void addImages(event.target.files);
              event.target.value = '';
            }}
          />
        </label>
      </div>
      {error ? <p className="mt-2 text-xs font-medium text-red-600">上传失败：{error}</p> : null}
      {images.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {images.map((image, index) => (
            <div
              key={image}
              draggable
              onDragStart={() => setDraggedImageIndex(index)}
              onDragEnd={() => setDraggedImageIndex(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggedImageIndex !== null) moveImage(draggedImageIndex, index);
                setDraggedImageIndex(null);
              }}
              className={`relative overflow-hidden rounded-xl border bg-slate-100 transition ${draggedImageIndex === index ? 'border-blue-500 opacity-50' : index === 0 ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'}`}
            >
              <img src={image} alt={`${order.vehicleModel || '车辆'} ${index + 1}`} className="aspect-[4/3] w-full object-cover" />
              {index === 0 ? <span className="absolute left-1.5 top-1.5 rounded-full bg-blue-700 px-2 py-1 text-[10px] font-bold text-white shadow">主图</span> : null}
              <button
                type="button"
                onClick={() => onChange(images.filter((item) => item !== image))}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-red-600 text-sm font-bold text-white shadow"
                aria-label={`删除第 ${index + 1} 张车辆照片`}
              >
                ×
              </button>
              <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveImage(index, index - 1)}
                  className="flex h-7 flex-1 items-center justify-center rounded-md bg-black/70 text-xs font-bold text-white backdrop-blur disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label={`将第 ${index + 1} 张照片前移`}
                >
                  ← 前移
                </button>
                <button
                  type="button"
                  disabled={index === images.length - 1}
                  onClick={() => moveImage(index, index + 1)}
                  className="flex h-7 flex-1 items-center justify-center rounded-md bg-black/70 text-xs font-bold text-white backdrop-blur disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label={`将第 ${index + 1} 张照片后移`}
                >
                  后移 →
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/60 px-4 py-7 text-center">
          <p className="text-sm font-bold text-blue-700">Ctrl + V 直接粘贴车辆截图</p>
          <p className="mt-1 text-xs text-slate-500">先点击这个区域，再粘贴；支持 JPG、PNG、WEBP</p>
        </div>
      )}
    </div>
  );
}
