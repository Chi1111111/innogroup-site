import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { Vehicle } from '../../data/vehicles';
import { useVehiclesCatalog } from '../hooks/useVehiclesCatalog';
import { uploadImageToCloudinary } from '../../config/cloudinaryConfig';

const ADMIN_SESSION_KEY = 'inno:admin:session:v1';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'inno-admin-2026';

interface VehicleDraft extends Vehicle {
  id: string;
  imagesText: string;
}

interface AdminNotice {
  type: 'success' | 'error' | 'info';
  text: string;
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `vehicle-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function toDraft(vehicle: Vehicle): VehicleDraft {
  return {
    ...vehicle,
    id: createId(),
    imagesText: vehicle.images?.join('\n') ?? '',
  };
}

function toVehicle(draft: VehicleDraft): Vehicle | null {
  const name = draft.name.trim();
  const image = draft.image.trim();

  if (!name || !image) {
    return null;
  }

  const images = draft.imagesText
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    name,
    image,
    images: images.length > 0 ? images : undefined,
    priceRange: draft.priceRange.trim() || 'TBC',
    year: draft.year.trim() || 'TBC',
    mileage: draft.mileage.trim() || 'TBC',
    availability: draft.availability.trim() || 'Pre Order',
  };
}

const EMPTY_DRAFT: VehicleDraft = {
  id: '',
  name: '',
  image: '',
  imagesText: '',
  priceRange: '',
  year: '',
  mileage: '',
  availability: 'Pre Order',
};

function getNoticeClass(type: AdminNotice['type']) {
  if (type === 'success') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (type === 'error') {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  return 'border-blue-200 bg-blue-50 text-blue-700';
}

export function AdminVehicles() {
  const { vehicles, setVehicles, resetVehicles } = useVehiclesCatalog();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'authenticated';
  });
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [drafts, setDrafts] = useState<VehicleDraft[]>([]);
  const [notice, setNotice] = useState<AdminNotice | null>(null);
  const [uploadingMainMap, setUploadingMainMap] = useState<Record<string, boolean>>({});
  const [uploadingGalleryMap, setUploadingGalleryMap] = useState<Record<string, boolean>>({});
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  useEffect(() => {
    const nextDrafts = vehicles.map((vehicle) => toDraft(vehicle));
    setDrafts(nextDrafts);
    setExpandedCardId((current) => current ?? nextDrafts[0]?.id ?? null);
  }, [vehicles]);

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.trim() !== ADMIN_PASSWORD) {
      setLoginError('密码不正确，请重试。');
      return;
    }

    window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'authenticated');
    setIsAuthenticated(true);
    setPassword('');
    setLoginError('');
  };

  const handleLogout = () => {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthenticated(false);
    setLoginError('');
    setNotice(null);
  };

  const updateDraftField = (id: string, key: keyof VehicleDraft, value: string) => {
    setDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, [key]: value } : draft))
    );
  };

  const addVehicleDraft = () => {
    const nextId = createId();
    setDrafts((current) => [...current, { ...EMPTY_DRAFT, id: nextId }]);
    setExpandedCardId(nextId);
    setNotice({ type: 'info', text: '已新增一条空白车辆，请填写后保存。' });
  };

  const removeVehicleDraft = (id: string) => {
    setDrafts((current) => current.filter((draft) => draft.id !== id));
    setExpandedCardId((current) => (current === id ? null : current));
  };

  const handleSave = () => {
    const nextVehicles = drafts
      .map((draft) => toVehicle(draft))
      .filter((vehicle): vehicle is Vehicle => vehicle !== null);

    if (nextVehicles.length !== drafts.length) {
      setNotice({ type: 'error', text: '保存失败：请确认每条车辆都填写了“名称”和“主图 URL”。' });
      return;
    }

    setVehicles(nextVehicles);
    setNotice({ type: 'success', text: '保存成功，前台车辆页面已同步更新。' });
  };

  const handleUploadMainImage = async (id: string, files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }

    setUploadingMainMap((current) => ({ ...current, [id]: true }));
    setNotice(null);

    try {
      const imageUrl = await uploadImageToCloudinary(file);
      updateDraftField(id, 'image', imageUrl);
      setNotice({ type: 'success', text: '主图上传成功。' });
    } catch {
      setNotice({ type: 'error', text: '主图上传失败，请重试。' });
    } finally {
      setUploadingMainMap((current) => ({ ...current, [id]: false }));
    }
  };

  const handleUploadGalleryImages = async (id: string, files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    setUploadingGalleryMap((current) => ({ ...current, [id]: true }));
    setNotice(null);

    try {
      const uploadTasks = Array.from(files).map((file) => uploadImageToCloudinary(file));
      const uploadedUrls = await Promise.all(uploadTasks);

      setDrafts((current) =>
        current.map((draft) => {
          if (draft.id !== id) {
            return draft;
          }

          const merged = [draft.imagesText.trim(), ...uploadedUrls]
            .filter(Boolean)
            .join('\n');

          return {
            ...draft,
            imagesText: merged,
          };
        })
      );

      setNotice({ type: 'success', text: `相册上传成功，共 ${uploadedUrls.length} 张。` });
    } catch {
      setNotice({ type: 'error', text: '相册上传失败，请重试。' });
    } finally {
      setUploadingGalleryMap((current) => ({ ...current, [id]: false }));
    }
  };

  const handleResetDefaults = () => {
    const confirmed = window.confirm('确定恢复为默认车辆列表吗？');
    if (!confirmed) {
      return;
    }

    resetVehicles();
    setNotice({ type: 'success', text: '已恢复默认车辆列表。' });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Admin 登录</h1>
          <p className="mt-2 text-sm text-slate-600">车辆管理后台 / Vehicle Editor</p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">密码 Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="请输入后台密码"
                autoComplete="current-password"
              />
            </label>
            {loginError ? <p className="text-sm text-red-600">{loginError}</p> : null}
            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              登录 / Sign In
            </button>
          </form>
          <Link to="/" className="mt-4 inline-flex text-sm text-slate-700 hover:text-slate-900">
            返回网站首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">车辆管理后台</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                操作步骤：1) 上传图片并填写信息 2) 点击“保存全部修改” 3) 前台英文/中文车辆页自动同步。
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                返回登录页
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addVehicleDraft}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              + 新增车辆
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-primary/90"
            >
              保存全部修改
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
            >
              恢复默认数据
            </button>
          </div>
        </div>

        {notice ? (
          <div className={`rounded-xl border px-4 py-3 text-sm ${getNoticeClass(notice.type)}`}>
            {notice.text}
          </div>
        ) : null}

        <div className="space-y-4">
          {drafts.map((draft, index) => (
            <div key={draft.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    车辆 #{index + 1} {draft.name ? `- ${draft.name}` : ''}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {draft.priceRange || '未填写价格'} · {draft.year || '未填写年份'} ·{' '}
                    {draft.mileage || '未填写里程'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCardId((current) => (current === draft.id ? null : draft.id))
                    }
                    className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    {expandedCardId === draft.id ? '收起' : '展开编辑'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeVehicleDraft(draft.id)}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                  >
                    删除
                  </button>
                </div>
              </div>

              {expandedCardId !== draft.id ? null : (
                <>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">车辆名称 *</span>
                  <input
                    value={draft.name}
                    onChange={(event) => updateDraftField(draft.id, 'name', event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                    placeholder="Toyota Alphard Hybrid Z"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">价格 Price</span>
                  <input
                    value={draft.priceRange}
                    onChange={(event) =>
                      updateDraftField(draft.id, 'priceRange', event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                    placeholder="$80,000 NZD"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">年份 Year</span>
                  <input
                    value={draft.year}
                    onChange={(event) => updateDraftField(draft.id, 'year', event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                    placeholder="2023"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">公里数 Mileage</span>
                  <input
                    value={draft.mileage}
                    onChange={(event) =>
                      updateDraftField(draft.id, 'mileage', event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                    placeholder="9k km"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">状态 Availability</span>
                  <input
                    value={draft.availability}
                    onChange={(event) =>
                      updateDraftField(draft.id, 'availability', event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                    placeholder="Pre Order"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">主图 URL *</span>
                  <input
                    value={draft.image}
                    onChange={(event) => updateDraftField(draft.id, 'image', event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                    placeholder="https://..."
                  />
                </label>
              </div>

              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <p className="text-sm font-medium text-slate-700">图片上传</p>
                <p className="mt-1 text-xs text-slate-500">建议先上传主图，再上传相册图片。</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                    {uploadingMainMap[draft.id] ? '主图上传中...' : '上传主图'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingMainMap[draft.id] || uploadingGalleryMap[draft.id]}
                      onChange={(event) => {
                        void handleUploadMainImage(draft.id, event.target.files);
                        event.target.value = '';
                      }}
                    />
                  </label>
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                    {uploadingGalleryMap[draft.id] ? '相册上传中...' : '上传相册（可多选）'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={uploadingMainMap[draft.id] || uploadingGalleryMap[draft.id]}
                      onChange={(event) => {
                        void handleUploadGalleryImages(draft.id, event.target.files);
                        event.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>

              {draft.image ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                  <img
                    src={draft.image}
                    alt={draft.name || 'Vehicle image preview'}
                    className="h-28 w-full rounded-lg object-cover sm:h-32"
                  />
                </div>
              ) : null}

              <label className="mt-4 block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">相册 URL（每行一个或逗号分隔）</span>
                <textarea
                  value={draft.imagesText}
                  onChange={(event) => updateDraftField(draft.id, 'imagesText', event.target.value)}
                  className="min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                  placeholder="https://.../photo-1.jpg&#10;https://.../photo-2.jpg"
                />
              </label>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
