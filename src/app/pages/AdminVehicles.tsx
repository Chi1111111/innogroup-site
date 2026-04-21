import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { uploadImageToCloudinary } from '../../config/cloudinaryConfig';
import type { Vehicle } from '../../data/vehicles';
import type { PartnerPlaceholder } from '../../data/services';
import { useVehiclesCatalog } from '../hooks/useVehiclesCatalog';
import { usePartnersCatalog } from '../hooks/usePartnersCatalog';

const ADMIN_SESSION_KEY = 'inno:admin:session:v1';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'innogroup2026';

type AdminTab = 'vehicles' | 'suppliers';

interface VehicleDraft extends Vehicle {
  id: string;
  imagesText: string;
}

interface PartnerDraft extends PartnerPlaceholder {
  logoWordmarkLine1: string;
  logoWordmarkLine2: string;
}

interface AdminNotice {
  type: 'success' | 'error' | 'info';
  text: string;
}

const EMPTY_VEHICLE_DRAFT: VehicleDraft = {
  id: '',
  name: '',
  image: '',
  imagesText: '',
  priceRange: '',
  year: '',
  mileage: '',
  availability: 'Pre Order',
};

const EMPTY_PARTNER_DRAFT: PartnerDraft = {
  id: '',
  name: '',
  address: '',
  website: '',
  email: '',
  phone: '',
  hours: '',
  logoSrc: '',
  logoAlt: '',
  logoPanel: 'light',
  logoFit: 'contain',
  logoWordmarkLine1: '',
  logoWordmarkLine2: '',
};

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function toVehicleDraft(vehicle: Vehicle): VehicleDraft {
  return {
    ...vehicle,
    id: createId('vehicle'),
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

function toPartnerDraft(partner: PartnerPlaceholder): PartnerDraft {
  return {
    ...partner,
    logoWordmarkLine1: partner.logoWordmark?.line1 ?? '',
    logoWordmarkLine2: partner.logoWordmark?.line2 ?? '',
  };
}

function toPartner(draft: PartnerDraft): PartnerPlaceholder | null {
  const id = draft.id.trim();
  const name = draft.name.trim();
  const address = draft.address.trim();

  if (!id || !name || !address) {
    return null;
  }

  const logoWordmarkLine1 = draft.logoWordmarkLine1.trim();
  const logoWordmarkLine2 = draft.logoWordmarkLine2.trim();

  return {
    id,
    name,
    address,
    website: draft.website?.trim() || undefined,
    email: draft.email?.trim() || undefined,
    phone: draft.phone?.trim() || undefined,
    hours: draft.hours?.trim() || undefined,
    logoSrc: draft.logoSrc?.trim() || undefined,
    logoAlt: draft.logoAlt?.trim() || undefined,
    logoPanel: draft.logoPanel === 'dark' ? 'dark' : 'light',
    logoFit: draft.logoFit === 'cover' ? 'cover' : 'contain',
    logoWordmark: logoWordmarkLine1
      ? {
          line1: logoWordmarkLine1,
          line2: logoWordmarkLine2 || undefined,
        }
      : undefined,
  };
}

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
  const { partners, setPartners, resetPartners } = usePartnersCatalog();

  const [activeTab, setActiveTab] = useState<AdminTab>('vehicles');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'authenticated';
  });
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [notice, setNotice] = useState<AdminNotice | null>(null);

  const [vehicleDrafts, setVehicleDrafts] = useState<VehicleDraft[]>([]);
  const [partnerDrafts, setPartnerDrafts] = useState<PartnerDraft[]>([]);

  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);
  const [expandedPartnerId, setExpandedPartnerId] = useState<string | null>(null);

  const [uploadingVehicleMainMap, setUploadingVehicleMainMap] = useState<Record<string, boolean>>(
    {}
  );
  const [uploadingVehicleGalleryMap, setUploadingVehicleGalleryMap] = useState<
    Record<string, boolean>
  >({});
  const [uploadingPartnerLogoMap, setUploadingPartnerLogoMap] = useState<Record<string, boolean>>(
    {}
  );
  const [syncingAllCars, setSyncingAllCars] = useState(false);

  useEffect(() => {
    let robotsMeta = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');

    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }

    const previous = robotsMeta.content;
    robotsMeta.content = 'noindex, nofollow';
    document.title = 'Inno Group Admin';

    return () => {
      robotsMeta.content = previous || 'index, follow';
    };
  }, []);

  useEffect(() => {
    const nextVehicleDrafts = vehicles.map((vehicle) => toVehicleDraft(vehicle));
    setVehicleDrafts(nextVehicleDrafts);
    setExpandedVehicleId((current) => current ?? nextVehicleDrafts[0]?.id ?? null);
  }, [vehicles]);

  useEffect(() => {
    const nextPartnerDrafts = partners.map((partner) => toPartnerDraft(partner));
    setPartnerDrafts(nextPartnerDrafts);
    setExpandedPartnerId((current) => current ?? nextPartnerDrafts[0]?.id ?? null);
  }, [partners]);

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.trim() !== ADMIN_PASSWORD) {
      setLoginError('Password not correct, please try again.');
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

  const updateVehicleDraftField = (id: string, key: keyof VehicleDraft, value: string) => {
    setVehicleDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, [key]: value } : draft))
    );
  };

  const updatePartnerDraftField = (id: string, key: keyof PartnerDraft, value: string) => {
    setPartnerDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, [key]: value } : draft))
    );
  };

  const addVehicleDraft = () => {
    const nextId = createId('vehicle');
    setVehicleDrafts((current) => [...current, { ...EMPTY_VEHICLE_DRAFT, id: nextId }]);
    setExpandedVehicleId(nextId);
    setNotice({ type: 'info', text: 'New vehicle row added. Fill details and click save.' });
  };

  const removeVehicleDraft = (id: string) => {
    setVehicleDrafts((current) => current.filter((draft) => draft.id !== id));
    setExpandedVehicleId((current) => (current === id ? null : current));
  };

  const addPartnerDraft = () => {
    const nextId = createId('partner');
    setPartnerDrafts((current) => [
      ...current,
      {
        ...EMPTY_PARTNER_DRAFT,
        id: nextId,
        name: `New Partner ${current.length + 1}`,
      },
    ]);
    setExpandedPartnerId(nextId);
    setNotice({ type: 'info', text: 'New supplier/partner row added.' });
  };

  const removePartnerDraft = (id: string) => {
    setPartnerDrafts((current) => current.filter((draft) => draft.id !== id));
    setExpandedPartnerId((current) => (current === id ? null : current));
  };

  const handleSaveVehicles = () => {
    const nextVehicles = vehicleDrafts
      .map((draft) => toVehicle(draft))
      .filter((vehicle): vehicle is Vehicle => vehicle !== null);

    if (nextVehicles.length !== vehicleDrafts.length) {
      setNotice({
        type: 'error',
        text: 'Vehicle save failed: each item must have Name and Main Image URL.',
      });
      return;
    }

    setVehicles(nextVehicles);
    setNotice({ type: 'success', text: 'Vehicle list saved and synced to frontend.' });
  };

  const handleSavePartners = () => {
    const normalizedIds = partnerDrafts.map((draft) => draft.id.trim()).filter(Boolean);
    const hasDuplicateId = new Set(normalizedIds).size !== normalizedIds.length;

    if (hasDuplicateId) {
      setNotice({
        type: 'error',
        text: 'Supplier save failed: each supplier ID must be unique.',
      });
      return;
    }

    const nextPartners = partnerDrafts
      .map((draft) => toPartner(draft))
      .filter((partner): partner is PartnerPlaceholder => partner !== null);

    if (nextPartners.length !== partnerDrafts.length) {
      setNotice({
        type: 'error',
        text: 'Supplier save failed: each item must have ID, Name, and Address.',
      });
      return;
    }

    setPartners(nextPartners);
    setNotice({ type: 'success', text: 'Supplier/partner list saved and synced to frontend.' });
  };

  const handleUploadVehicleMainImage = async (id: string, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setUploadingVehicleMainMap((current) => ({ ...current, [id]: true }));
    setNotice(null);

    try {
      const imageUrl = await uploadImageToCloudinary(file);
      updateVehicleDraftField(id, 'image', imageUrl);
      setNotice({ type: 'success', text: 'Vehicle main image uploaded.' });
    } catch {
      setNotice({ type: 'error', text: 'Vehicle main image upload failed.' });
    } finally {
      setUploadingVehicleMainMap((current) => ({ ...current, [id]: false }));
    }
  };

  const handleUploadVehicleGalleryImages = async (id: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingVehicleGalleryMap((current) => ({ ...current, [id]: true }));
    setNotice(null);

    try {
      const uploadedUrls = await Promise.all(
        Array.from(files).map((file) => uploadImageToCloudinary(file))
      );

      setVehicleDrafts((current) =>
        current.map((draft) => {
          if (draft.id !== id) return draft;
          const merged = [draft.imagesText.trim(), ...uploadedUrls].filter(Boolean).join('\n');
          return { ...draft, imagesText: merged };
        })
      );

      setNotice({ type: 'success', text: `Uploaded ${uploadedUrls.length} vehicle gallery image(s).` });
    } catch {
      setNotice({ type: 'error', text: 'Vehicle gallery upload failed.' });
    } finally {
      setUploadingVehicleGalleryMap((current) => ({ ...current, [id]: false }));
    }
  };

  const handleUploadPartnerLogo = async (id: string, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setUploadingPartnerLogoMap((current) => ({ ...current, [id]: true }));
    setNotice(null);

    try {
      const logoUrl = await uploadImageToCloudinary(file);
      setPartnerDrafts((current) =>
        current.map((draft) => (draft.id === id ? { ...draft, logoSrc: logoUrl } : draft))
      );
      setNotice({ type: 'success', text: 'Supplier logo uploaded.' });
    } catch {
      setNotice({ type: 'error', text: 'Supplier logo upload failed.' });
    } finally {
      setUploadingPartnerLogoMap((current) => ({ ...current, [id]: false }));
    }
  };

  const handleResetVehicles = () => {
    if (!window.confirm('Reset vehicle list to default data?')) return;
    resetVehicles();
    setNotice({ type: 'success', text: 'Vehicle list reset to defaults.' });
  };

  const handleResetPartners = () => {
    if (!window.confirm('Reset suppliers/partners to default data?')) return;
    resetPartners();
    setNotice({ type: 'success', text: 'Supplier/partner list reset to defaults.' });
  };

  const handleSyncAllCars = async () => {
    try {
      setSyncingAllCars(true);
      const response = await fetch('/api/trigger-jpauc-full-sync', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer innogroup2026',
        },
      });

      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
        detail?: string;
        githubStatus?: number;
      };

      if (!response.ok) {
        const reason = [result.error, result.detail && `(${result.detail})`, result.githubStatus && `[${result.githubStatus}]`]
          .filter(Boolean)
          .join(' ');
        throw new Error(reason || 'Failed to start full sync');
      }

      setNotice({
        type: 'success',
        text:
          result.message ??
          'Full vehicle sync started. Wait a few minutes, then refresh Cars Form Japan.',
      });
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to trigger full sync.',
      });
    } finally {
      setSyncingAllCars(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Admin Login</h1>
          <p className="mt-2 text-sm text-slate-600">Vehicle & Supplier Content Editor</p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Enter admin password"
                autoComplete="current-password"
              />
            </label>
            {loginError ? <p className="text-sm text-red-600">{loginError}</p> : null}
            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Sign In
            </button>
          </form>
          <Link to="/" className="mt-4 inline-flex text-sm text-slate-700 hover:text-slate-900">
            Back to website
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
              <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Content Admin</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Update vehicles and supplier/partner details, then save to sync the frontend.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Return to Login
            </button>
          </div>

          <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('vehicles')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'vehicles'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vehicles
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('suppliers')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'suppliers'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Suppliers & Partners
            </button>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={handleSyncAllCars}
              disabled={syncingAllCars}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncingAllCars ? 'Starting Full Sync...' : 'Sync All Cars (Full)'}
            </button>
          </div>
        </div>

        {notice ? (
          <div className={`rounded-xl border px-4 py-3 text-sm ${getNoticeClass(notice.type)}`}>
            {notice.text}
          </div>
        ) : null}

        {activeTab === 'vehicles' ? (
          <section className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addVehicleDraft}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                + Add Vehicle
              </button>
              <button
                type="button"
                onClick={handleSaveVehicles}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-primary/90"
              >
                Save Vehicles
              </button>
              <button
                type="button"
                onClick={handleResetVehicles}
                className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
              >
                Reset Vehicle Defaults
              </button>
            </div>

            <div className="space-y-4">
              {vehicleDrafts.map((draft, index) => (
                <div
                  key={draft.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        Vehicle #{index + 1} {draft.name ? `- ${draft.name}` : ''}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {draft.priceRange || 'No price'} · {draft.year || 'No year'} ·{' '}
                        {draft.mileage || 'No mileage'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedVehicleId((current) => (current === draft.id ? null : draft.id))
                        }
                        className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        {expandedVehicleId === draft.id ? 'Collapse' : 'Edit'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeVehicleDraft(draft.id)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {expandedVehicleId !== draft.id ? null : (
                    <>
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-slate-700">Vehicle Name *</span>
                          <input
                            value={draft.name}
                            onChange={(event) =>
                              updateVehicleDraftField(draft.id, 'name', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                            placeholder="Toyota Alphard Hybrid Z"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-slate-700">Price</span>
                          <input
                            value={draft.priceRange}
                            onChange={(event) =>
                              updateVehicleDraftField(draft.id, 'priceRange', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                            placeholder="$80,000 NZD"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-slate-700">Year</span>
                          <input
                            value={draft.year}
                            onChange={(event) =>
                              updateVehicleDraftField(draft.id, 'year', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                            placeholder="2023"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-slate-700">Mileage</span>
                          <input
                            value={draft.mileage}
                            onChange={(event) =>
                              updateVehicleDraftField(draft.id, 'mileage', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                            placeholder="9k km"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-slate-700">Availability</span>
                          <input
                            value={draft.availability}
                            onChange={(event) =>
                              updateVehicleDraftField(draft.id, 'availability', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                            placeholder="Pre Order"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-slate-700">Main Image URL *</span>
                          <input
                            value={draft.image}
                            onChange={(event) =>
                              updateVehicleDraftField(draft.id, 'image', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                            placeholder="https://..."
                          />
                        </label>
                      </div>

                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                        <p className="text-sm font-medium text-slate-700">Image Upload</p>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                            {uploadingVehicleMainMap[draft.id]
                              ? 'Uploading main image...'
                              : 'Upload Main Image'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={
                                uploadingVehicleMainMap[draft.id] ||
                                uploadingVehicleGalleryMap[draft.id]
                              }
                              onChange={(event) => {
                                void handleUploadVehicleMainImage(draft.id, event.target.files);
                                event.target.value = '';
                              }}
                            />
                          </label>
                          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                            {uploadingVehicleGalleryMap[draft.id]
                              ? 'Uploading gallery images...'
                              : 'Upload Gallery (multi-select)'}
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              disabled={
                                uploadingVehicleMainMap[draft.id] ||
                                uploadingVehicleGalleryMap[draft.id]
                              }
                              onChange={(event) => {
                                void handleUploadVehicleGalleryImages(draft.id, event.target.files);
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
                        <span className="text-sm font-medium text-slate-700">
                          Gallery URL list (one per line or comma separated)
                        </span>
                        <textarea
                          value={draft.imagesText}
                          onChange={(event) =>
                            updateVehicleDraftField(draft.id, 'imagesText', event.target.value)
                          }
                          className="min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                          placeholder="https://.../photo-1.jpg&#10;https://.../photo-2.jpg"
                        />
                      </label>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addPartnerDraft}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                + Add Supplier/Partner
              </button>
              <button
                type="button"
                onClick={handleSavePartners}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-primary/90"
              >
                Save Suppliers
              </button>
              <button
                type="button"
                onClick={handleResetPartners}
                className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
              >
                Reset Supplier Defaults
              </button>
            </div>

            <div className="space-y-4">
              {partnerDrafts.map((draft, index) => (
                <div
                  key={draft.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        Supplier #{index + 1} - {draft.name || 'Unnamed'}
                      </h2>
                      <p className="text-xs text-slate-500">{draft.address || 'No address'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPartnerId((current) => (current === draft.id ? null : draft.id))
                        }
                        className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        {expandedPartnerId === draft.id ? 'Collapse' : 'Edit'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removePartnerDraft(draft.id)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {expandedPartnerId !== draft.id ? null : (
                    <>
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-slate-700">ID *</span>
                          <input
                            value={draft.id}
                            onChange={(event) =>
                              updatePartnerDraftField(draft.id, 'id', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-slate-700">Name *</span>
                          <input
                            value={draft.name}
                            onChange={(event) =>
                              updatePartnerDraftField(draft.id, 'name', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                          />
                        </label>
                        <label className="space-y-1.5 md:col-span-2">
                          <span className="text-sm font-medium text-slate-700">Address *</span>
                          <input
                            value={draft.address}
                            onChange={(event) =>
                              updatePartnerDraftField(draft.id, 'address', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-slate-700">Website</span>
                          <input
                            value={draft.website ?? ''}
                            onChange={(event) =>
                              updatePartnerDraftField(draft.id, 'website', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                            placeholder="https://..."
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-slate-700">Email</span>
                          <input
                            value={draft.email ?? ''}
                            onChange={(event) =>
                              updatePartnerDraftField(draft.id, 'email', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-slate-700">Phone</span>
                          <input
                            value={draft.phone ?? ''}
                            onChange={(event) =>
                              updatePartnerDraftField(draft.id, 'phone', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-slate-700">Hours</span>
                          <input
                            value={draft.hours ?? ''}
                            onChange={(event) =>
                              updatePartnerDraftField(draft.id, 'hours', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-slate-700">Logo URL</span>
                          <input
                            value={draft.logoSrc ?? ''}
                            onChange={(event) =>
                              updatePartnerDraftField(draft.id, 'logoSrc', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                            placeholder="https://..."
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-slate-700">Logo ALT</span>
                          <input
                            value={draft.logoAlt ?? ''}
                            onChange={(event) =>
                              updatePartnerDraftField(draft.id, 'logoAlt', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-slate-700">Logo Panel</span>
                          <select
                            value={draft.logoPanel ?? 'light'}
                            onChange={(event) =>
                              updatePartnerDraftField(draft.id, 'logoPanel', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                          >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                          </select>
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-slate-700">Logo Fit</span>
                          <select
                            value={draft.logoFit ?? 'contain'}
                            onChange={(event) =>
                              updatePartnerDraftField(draft.id, 'logoFit', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                          >
                            <option value="contain">Contain</option>
                            <option value="cover">Cover</option>
                          </select>
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-slate-700">
                            Wordmark Line 1 (optional)
                          </span>
                          <input
                            value={draft.logoWordmarkLine1}
                            onChange={(event) =>
                              updatePartnerDraftField(
                                draft.id,
                                'logoWordmarkLine1',
                                event.target.value
                              )
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium text-slate-700">
                            Wordmark Line 2 (optional)
                          </span>
                          <input
                            value={draft.logoWordmarkLine2}
                            onChange={(event) =>
                              updatePartnerDraftField(
                                draft.id,
                                'logoWordmarkLine2',
                                event.target.value
                              )
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                          />
                        </label>
                      </div>

                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                          {uploadingPartnerLogoMap[draft.id]
                            ? 'Uploading supplier logo...'
                            : 'Upload Supplier Logo'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingPartnerLogoMap[draft.id]}
                            onChange={(event) => {
                              void handleUploadPartnerLogo(draft.id, event.target.files);
                              event.target.value = '';
                            }}
                          />
                        </label>
                      </div>

                      {draft.logoSrc ? (
                        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                          <img
                            src={draft.logoSrc}
                            alt={draft.logoAlt || draft.name}
                            className="h-24 w-full rounded-lg object-contain"
                          />
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
