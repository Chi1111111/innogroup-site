import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { uploadImageToCloudinary } from '../../config/cloudinaryConfig';
import type { PartnerPlaceholder } from '../../data/services';
import { usePartnersCatalog } from '../hooks/usePartnersCatalog';

const ADMIN_SESSION_KEY = 'inno:admin:session:v1';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'innogroup2026';

interface PartnerDraft extends PartnerPlaceholder {
  logoWordmarkLine1: string;
  logoWordmarkLine2: string;
}

interface AdminNotice {
  type: 'success' | 'error' | 'info';
  text: string;
}

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
  const { partners, setPartners, resetPartners } = usePartnersCatalog();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'authenticated';
  });
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [notice, setNotice] = useState<AdminNotice | null>(null);
  const [partnerDrafts, setPartnerDrafts] = useState<PartnerDraft[]>([]);
  const [expandedPartnerId, setExpandedPartnerId] = useState<string | null>(null);
  const [uploadingPartnerLogoMap, setUploadingPartnerLogoMap] = useState<Record<string, boolean>>(
    {}
  );

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

  const updatePartnerDraftField = (id: string, key: keyof PartnerDraft, value: string) => {
    setPartnerDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, [key]: value } : draft))
    );
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

  const handleResetPartners = () => {
    if (!window.confirm('Reset suppliers/partners to default data?')) return;
    resetPartners();
    setNotice({ type: 'success', text: 'Supplier/partner list reset to defaults.' });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Admin Login</h1>
          <p className="mt-2 text-sm text-slate-600">Supplier & Partner Content Editor</p>
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
              <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                Supplier & Partner Admin
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Update supplier and partner details used across the frontend.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/admin/contracts"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Contract Admin
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>

        {notice ? (
          <div className={`rounded-xl border px-4 py-3 text-sm ${getNoticeClass(notice.type)}`}>
            {notice.text}
          </div>
        ) : null}

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
      </div>
    </div>
  );
}
