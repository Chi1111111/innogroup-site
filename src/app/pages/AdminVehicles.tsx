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
  const [saveMessage, setSaveMessage] = useState('');
  const [uploadingMainMap, setUploadingMainMap] = useState<Record<string, boolean>>({});
  const [uploadingGalleryMap, setUploadingGalleryMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setDrafts(vehicles.map((vehicle) => toDraft(vehicle)));
  }, [vehicles]);

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.trim() !== ADMIN_PASSWORD) {
      setLoginError('Password not correct. Please try again.');
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
    setSaveMessage('');
  };

  const updateDraftField = (id: string, key: keyof VehicleDraft, value: string) => {
    setDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, [key]: value } : draft))
    );
  };

  const addVehicleDraft = () => {
    setDrafts((current) => [...current, { ...EMPTY_DRAFT, id: createId() }]);
  };

  const removeVehicleDraft = (id: string) => {
    setDrafts((current) => current.filter((draft) => draft.id !== id));
  };

  const handleSave = () => {
    const nextVehicles = drafts
      .map((draft) => toVehicle(draft))
      .filter((vehicle): vehicle is Vehicle => vehicle !== null);

    if (nextVehicles.length !== drafts.length) {
      setSaveMessage('Some items are missing name or main image. Please fill them before saving.');
      return;
    }

    setVehicles(nextVehicles);
    setSaveMessage('Vehicle catalog saved.');
  };

  const handleUploadMainImage = async (id: string, files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }

    setUploadingMainMap((current) => ({ ...current, [id]: true }));
    setSaveMessage('');

    try {
      const imageUrl = await uploadImageToCloudinary(file);
      updateDraftField(id, 'image', imageUrl);
      setSaveMessage('Main image uploaded.');
    } catch {
      setSaveMessage('Main image upload failed. Please try again.');
    } finally {
      setUploadingMainMap((current) => ({ ...current, [id]: false }));
    }
  };

  const handleUploadGalleryImages = async (id: string, files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    setUploadingGalleryMap((current) => ({ ...current, [id]: true }));
    setSaveMessage('');

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

      setSaveMessage(`Uploaded ${uploadedUrls.length} gallery image(s).`);
    } catch {
      setSaveMessage('Gallery image upload failed. Please try again.');
    } finally {
      setUploadingGalleryMap((current) => ({ ...current, [id]: false }));
    }
  };

  const handleResetDefaults = () => {
    const confirmed = window.confirm('Reset all vehicles back to defaults?');
    if (!confirmed) {
      return;
    }

    resetVehicles();
    setSaveMessage('Vehicle catalog reset to default list.');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111111] px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-8 text-white shadow-2xl">
          <h1 className="text-3xl font-bold">Admin Login</h1>
          <p className="mt-2 text-sm text-white/70">Vehicle editor access</p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-white/80">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-white outline-none transition-all focus:border-primary/70 focus:ring-2 focus:ring-primary/25"
                placeholder="Enter admin password"
                autoComplete="current-password"
              />
            </label>
            {loginError ? <p className="text-sm text-red-300">{loginError}</p> : null}
            <button
              type="submit"
              className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-black transition-colors hover:bg-primary/90"
            >
              Sign in
            </button>
          </form>
          <Link to="/" className="mt-4 inline-flex text-sm text-primary hover:text-primary/80">
            Back to site
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/12 bg-black/35 p-4 sm:p-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Vehicle Editor</h1>
            <p className="mt-1 text-sm text-white/70">
              Add, edit, or remove vehicles shown on both English and Chinese vehicle pages.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addVehicleDraft}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-primary/90"
            >
              Add Vehicle
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Reset Defaults
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-red-300/30 bg-red-300/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition-colors hover:bg-red-300/20"
            >
              Logout
            </button>
          </div>
        </div>

        {saveMessage ? (
          <div className="mb-6 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            {saveMessage}
          </div>
        ) : null}

        <div className="space-y-5">
          {drafts.map((draft, index) => (
            <div key={draft.id} className="rounded-2xl border border-white/10 bg-black/30 p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Vehicle #{index + 1}</h2>
                <button
                  type="button"
                  onClick={() => removeVehicleDraft(draft.id)}
                  className="rounded-lg border border-red-300/30 bg-red-300/10 px-3 py-1.5 text-sm text-red-200 transition-colors hover:bg-red-300/20"
                >
                  Delete
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm text-white/75">Name</span>
                  <input
                    value={draft.name}
                    onChange={(event) => updateDraftField(draft.id, 'name', event.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/8 px-3 py-2.5 text-sm text-white"
                    placeholder="Toyota Alphard Hybrid Z"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm text-white/75">Price</span>
                  <input
                    value={draft.priceRange}
                    onChange={(event) =>
                      updateDraftField(draft.id, 'priceRange', event.target.value)
                    }
                    className="w-full rounded-xl border border-white/15 bg-white/8 px-3 py-2.5 text-sm text-white"
                    placeholder="$80,000 NZD"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm text-white/75">Year</span>
                  <input
                    value={draft.year}
                    onChange={(event) => updateDraftField(draft.id, 'year', event.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/8 px-3 py-2.5 text-sm text-white"
                    placeholder="2023"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm text-white/75">Mileage</span>
                  <input
                    value={draft.mileage}
                    onChange={(event) =>
                      updateDraftField(draft.id, 'mileage', event.target.value)
                    }
                    className="w-full rounded-xl border border-white/15 bg-white/8 px-3 py-2.5 text-sm text-white"
                    placeholder="9k km"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm text-white/75">Availability</span>
                  <input
                    value={draft.availability}
                    onChange={(event) =>
                      updateDraftField(draft.id, 'availability', event.target.value)
                    }
                    className="w-full rounded-xl border border-white/15 bg-white/8 px-3 py-2.5 text-sm text-white"
                    placeholder="Pre Order"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm text-white/75">Main Image URL</span>
                  <input
                    value={draft.image}
                    onChange={(event) => updateDraftField(draft.id, 'image', event.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/8 px-3 py-2.5 text-sm text-white"
                    placeholder="https://..."
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20">
                  {uploadingMainMap[draft.id] ? 'Uploading main image...' : 'Upload Main Image'}
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
                <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20">
                  {uploadingGalleryMap[draft.id]
                    ? 'Uploading gallery images...'
                    : 'Upload Gallery Images'}
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

              {draft.image ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/25 p-2">
                  <img
                    src={draft.image}
                    alt={draft.name || 'Vehicle image preview'}
                    className="h-44 w-full rounded-lg object-cover"
                  />
                </div>
              ) : null}

              <label className="mt-4 block space-y-1.5">
                <span className="text-sm text-white/75">Gallery Image URLs (one per line or comma)</span>
                <textarea
                  value={draft.imagesText}
                  onChange={(event) => updateDraftField(draft.id, 'imagesText', event.target.value)}
                  className="min-h-28 w-full rounded-xl border border-white/15 bg-white/8 px-3 py-2.5 text-sm text-white"
                  placeholder="https://.../photo-1.jpg&#10;https://.../photo-2.jpg"
                />
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
