import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { uploadImageToCloudinary } from '../../config/cloudinaryConfig';
import type { PartnerPlaceholder } from '../../data/services';
import {
  type JapanSpecialOrderVehicle,
  useJapanSpecialOrders,
} from '../hooks/useJapanSpecialOrders';
import { usePartnersCatalog } from '../hooks/usePartnersCatalog';

const ADMIN_SESSION_KEY = 'inno:admin:session:v1';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'innogroup2026';

interface PartnerDraft extends PartnerPlaceholder {
  logoWordmarkLine1: string;
  logoWordmarkLine2: string;
}

interface JapanSpecialOrderDraft extends JapanSpecialOrderVehicle {
  imagesText: string;
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

const EMPTY_JAPAN_SPECIAL_ORDER_DRAFT: JapanSpecialOrderDraft = {
  slug: '',
  title: '',
  zhTitle: '',
  image: '',
  images: [],
  imagesText: '',
  price: '',
  year: '',
  mileage: '',
  location: '',
  status: '',
  summary: '',
  zhSummary: '',
};

const VEHICLE_TERM_TRANSLATIONS: Array<[RegExp, string]> = [
  [/路虎/g, 'Land Rover'],
  [/捷豹/g, 'Jaguar'],
  [/丰田/g, 'Toyota'],
  [/本田/g, 'Honda'],
  [/日产/g, 'Nissan'],
  [/尼桑/g, 'Nissan'],
  [/马自达/g, 'Mazda'],
  [/三菱/g, 'Mitsubishi'],
  [/斯巴鲁/g, 'Subaru'],
  [/铃木/g, 'Suzuki'],
  [/雷克萨斯/g, 'Lexus'],
  [/奔驰/g, 'Mercedes-Benz'],
  [/宝马/g, 'BMW'],
  [/保时捷/g, 'Porsche'],
  [/法拉利/g, 'Ferrari'],
  [/兰博基尼/g, 'Lamborghini'],
  [/迈凯伦/g, 'McLaren'],
  [/宾利/g, 'Bentley'],
  [/劳斯莱斯/g, 'Rolls-Royce'],
  [/悍马/g, 'Hummer'],
];

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function splitImageText(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
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

  if (!id || !name || !address) return null;

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

function toJapanSpecialOrderDraft(vehicle: JapanSpecialOrderVehicle): JapanSpecialOrderDraft {
  const images = Array.from(new Set([vehicle.image, ...(vehicle.images ?? [])].filter(Boolean)));

  return {
    ...vehicle,
    image: images[0] ?? vehicle.image,
    images,
    imagesText: images.join('\n'),
  };
}

function toJapanSpecialOrderVehicle(draft: JapanSpecialOrderDraft): JapanSpecialOrderVehicle | null {
  const images = splitImageText(draft.imagesText);
  const primaryImage = images[0] || draft.image.trim();
  const vehicle = {
    slug: draft.slug.trim(),
    title: draft.title.trim(),
    zhTitle: draft.zhTitle.trim(),
    image: primaryImage,
    images,
    price: draft.price.trim(),
    year: draft.year.trim(),
    mileage: draft.mileage.trim(),
    location: draft.location.trim(),
    status: draft.status.trim(),
    summary: draft.summary.trim(),
    zhSummary: draft.zhSummary.trim(),
  };

  const isComplete = Object.entries(vehicle).every(([key, value]) => {
    if (key === 'images') return true;
    return Boolean(value);
  });

  return isComplete ? vehicle : null;
}

function normalizeSmartSourceText(value: string) {
  return value
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function findFirstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

function stripOcrQuestionMarks(value: string) {
  return value
    .replace(/[\uFFFD？?]{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCaseVehicleName(value: string) {
  return value
    .split(/\s+/)
    .map((part) =>
      /^[A-Z0-9-]+$/.test(part)
        ? part
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join(' ')
    .trim();
}

function translateVehicleTitleToEnglish(value: string) {
  let translated = stripOcrQuestionMarks(value);

  VEHICLE_TERM_TRANSLATIONS.forEach(([pattern, replacement]) => {
    translated = translated.replace(pattern, replacement);
  });

  translated = translated
    .replace(/[：:]/g, ' ')
    .replace(/[\u4e00-\u9fff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return titleCaseVehicleName(translated || stripOcrQuestionMarks(value) || 'Japan Fresh Find');
}

function buildSlugFromTitle(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || createId('japan-find');
}

function uniquifyJapanFindSlugs(drafts: JapanSpecialOrderDraft[]) {
  const slugCounts = new Map<string, number>();

  return drafts.map((draft) => {
    const baseSlug = buildSlugFromTitle(draft.slug || draft.title || draft.zhTitle);
    const nextCount = (slugCounts.get(baseSlug) ?? 0) + 1;
    slugCounts.set(baseSlug, nextCount);

    return {
      ...draft,
      slug: nextCount === 1 ? baseSlug : `${baseSlug}-${nextCount}`,
    };
  });
}

function parseJapanFindSource(source: string) {
  const normalizedText = normalizeSmartSourceText(source);
  const compactText = normalizedText.replace(/\n/g, ' ');
  const year = findFirstMatch(compactText, [
    /\b((?:19|20)\d{2})\b/,
    /(?:年式|年份|year)[:：]?\s*((?:19|20)\d{2})/i,
  ]);
  const mileage = findFirstMatch(compactText, [
    /(?:走行|公里|里程|mileage|odometer|km)[:：]?\s*([0-9,]+(?:\.\d+)?\s*(?:km|公里|万公里|kms)?)/i,
    /\b([0-9,]+(?:\.\d+)?\s*(?:km|公里|万公里|kms))\b/i,
  ]);
  const price = findFirstMatch(compactText, [
    /(?:price|asking|价格|售价|车价|本体|総額|支払総額)[:：]?\s*([¥￥$]?\s*[0-9,]+(?:\.\d+)?\s*(?:万|万円|円|jpy|nzd|usd)?)/i,
    /\b((?:jpy|nzd|usd)\s*[0-9,]+(?:\.\d+)?)\b/i,
    /([¥￥$]\s*[0-9,]+(?:\.\d+)?\s*(?:万|万円|円|jpy|nzd|usd)?)/i,
    /\b([0-9,]+(?:\.\d+)?\s*(?:万円|円|jpy|nzd|usd))\b/i,
  ]);
  const location = findFirstMatch(compactText, [
    /(?:location|所在地|地点|地域|出品地|保管場所)[:：]?\s*([A-Za-z\u4e00-\u9fff\u3040-\u30ff\s-]{2,30})/i,
  ]);
  const status = findFirstMatch(compactText, [
    /(?:status|状态|状况)[:：]?\s*([A-Za-z\u4e00-\u9fff\s/-]{2,40})/i,
  ]);
  const explicitTitle = findFirstMatch(compactText, [
    /(?:model|车型|车名|車名|name)[:：]?\s*([A-Za-z0-9\u4e00-\u9fff][A-Za-z0-9\u4e00-\u9fff\s.+/-]{2,80})/i,
  ]);
  const firstUsefulLine =
    normalizedText
      .split('\n')
      .map((line) => line.trim())
      .find((line) => /[A-Za-z0-9\u4e00-\u9fff]/.test(line) && line.length >= 3 && line.length <= 80) ??
    '';
  const rawTitle = stripOcrQuestionMarks(explicitTitle || firstUsefulLine) || 'Japan Fresh Find';
  const title = translateVehicleTitleToEnglish(rawTitle);
  const zhTitle = rawTitle.trim() || title;
  const safeMileage = mileage || 'To be confirmed';
  const safePrice = price || 'POA';
  const safeYear = year || 'To be confirmed';
  const safeLocation = location || 'Japan';
  const safeStatus = status || 'Japan channel update';

  return {
    slug: buildSlugFromTitle(title),
    title,
    zhTitle,
    price: safePrice,
    year: safeYear,
    mileage: safeMileage,
    location: safeLocation,
    status: safeStatus,
    summary: `${title} sourced from our Japan channel. Listed details indicate ${safeYear}, ${safeMileage} and ${safePrice}; availability, condition, documents and landed cost must be confirmed before deposit.`,
    zhSummary: `${zhTitle} 为日本渠道发来的车源。当前信息显示年份 ${safeYear}、公里数 ${safeMileage}、价格 ${safePrice}；是否仍可锁车、车况、文件和落地成本都需要在订金前再次确认。`,
  };
}

function getNoticeClass(type: AdminNotice['type']) {
  if (type === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (type === 'error') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-blue-200 bg-blue-50 text-blue-700';
}

export function AdminVehicles() {
  const { partners, setPartners, resetPartners } = usePartnersCatalog();
  const {
    vehicles: japanSpecialOrderVehicles,
    setVehicles: setJapanSpecialOrderVehicles,
  } = useJapanSpecialOrders();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'authenticated';
  });
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [notice, setNotice] = useState<AdminNotice | null>(null);
  const [partnerDrafts, setPartnerDrafts] = useState<PartnerDraft[]>([]);
  const [japanSpecialOrderDrafts, setJapanSpecialOrderDrafts] = useState<
    JapanSpecialOrderDraft[]
  >([]);
  const [expandedPartnerId, setExpandedPartnerId] = useState<string | null>(null);
  const [expandedJapanSpecialOrderSlug, setExpandedJapanSpecialOrderSlug] = useState<
    string | null
  >(null);
  const [uploadingPartnerLogoMap, setUploadingPartnerLogoMap] = useState<Record<string, boolean>>(
    {}
  );
  const [uploadingJapanSpecialOrderImageMap, setUploadingJapanSpecialOrderImageMap] = useState<
    Record<string, boolean>
  >({});
  const [smartSourceTextMap, setSmartSourceTextMap] = useState<Record<string, string>>({});
  const [smartOcrPreviewMap, setSmartOcrPreviewMap] = useState<Record<string, string>>({});
  const [smartOcrProcessingMap, setSmartOcrProcessingMap] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    const nextDrafts = japanSpecialOrderVehicles.map((vehicle) =>
      toJapanSpecialOrderDraft(vehicle)
    );
    setJapanSpecialOrderDrafts(nextDrafts);
    setExpandedJapanSpecialOrderSlug((current) => current ?? nextDrafts[0]?.slug ?? null);
  }, [japanSpecialOrderVehicles]);

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

  const updatePartnerDraftField = (id: string, key: keyof PartnerDraft, value: string) => {
    setPartnerDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, [key]: value } : draft))
    );
  };

  const updateJapanSpecialOrderDraftField = (
    slug: string,
    key: keyof JapanSpecialOrderDraft,
    value: string
  ) => {
    setJapanSpecialOrderDrafts((current) =>
      current.map((draft) => (draft.slug === slug ? { ...draft, [key]: value } : draft))
    );
  };

  const addJapanSpecialOrderDraft = () => {
    const nextSlug = createId('special-order');
    setJapanSpecialOrderDrafts((current) => [
      ...current,
      {
        ...EMPTY_JAPAN_SPECIAL_ORDER_DRAFT,
        slug: nextSlug,
        title: `New Japan Find ${current.length + 1}`,
        zhTitle: `日本精选车源 ${current.length + 1}`,
        price: 'POA',
        year: 'To be confirmed',
        mileage: 'To be confirmed',
        location: 'Japan',
        status: 'Japan channel update',
      },
    ]);
    setExpandedJapanSpecialOrderSlug(nextSlug);
    setNotice({ type: 'info', text: '已新增日本精选车源。' });
  };

  const removeJapanSpecialOrderDraft = (slug: string) => {
    setJapanSpecialOrderDrafts((current) => current.filter((draft) => draft.slug !== slug));
    setExpandedJapanSpecialOrderSlug((current) => (current === slug ? null : current));
  };

  const removeJapanSpecialOrderImage = (slug: string, imageToRemove: string) => {
    setJapanSpecialOrderDrafts((current) =>
      current.map((draft) => {
        if (draft.slug !== slug) return draft;
        const nextImages = splitImageText(draft.imagesText).filter(
          (image) => image !== imageToRemove
        );

        return {
          ...draft,
          image: nextImages[0] ?? '',
          images: nextImages,
          imagesText: nextImages.join('\n'),
        };
      })
    );
  };

  const moveJapanSpecialOrderImage = (slug: string, imageToMove: string, direction: -1 | 1) => {
    setJapanSpecialOrderDrafts((current) =>
      current.map((draft) => {
        if (draft.slug !== slug) return draft;

        const nextImages = splitImageText(draft.imagesText);
        const imageIndex = nextImages.indexOf(imageToMove);
        const targetIndex = imageIndex + direction;

        if (imageIndex < 0 || targetIndex < 0 || targetIndex >= nextImages.length) {
          return draft;
        }

        [nextImages[imageIndex], nextImages[targetIndex]] = [
          nextImages[targetIndex],
          nextImages[imageIndex],
        ];

        return {
          ...draft,
          image: nextImages[0] ?? '',
          images: nextImages,
          imagesText: nextImages.join('\n'),
        };
      })
    );
  };

  const handleSaveJapanSpecialOrders = () => {
    const normalizedDrafts = uniquifyJapanFindSlugs(japanSpecialOrderDrafts);
    const nextVehicles = normalizedDrafts
      .map((draft) => toJapanSpecialOrderVehicle(draft))
      .filter((vehicle): vehicle is JapanSpecialOrderVehicle => vehicle !== null);

    if (nextVehicles.length !== normalizedDrafts.length) {
      setNotice({
        type: 'error',
        text: '保存失败：每张卡片都需要标题、图片、价格、年份、公里数、所在地、状态和简介。',
      });
      return;
    }

    setJapanSpecialOrderVehicles(nextVehicles);
    setNotice({ type: 'success', text: '日本精选车源已保存，并同步到前台。' });
  };

  const handleUploadJapanSpecialOrderImage = async (slug: string, files: FileList | null) => {
    const uploadFiles = Array.from(files ?? []);
    if (uploadFiles.length === 0) return;

    setUploadingJapanSpecialOrderImageMap((current) => ({ ...current, [slug]: true }));
    setNotice(null);

    try {
      const imageUrls = await Promise.all(uploadFiles.map((file) => uploadImageToCloudinary(file)));
      setJapanSpecialOrderDrafts((current) =>
        current.map((draft) => {
          if (draft.slug !== slug) return draft;
          const nextImages = Array.from(
            new Set([...splitImageText(draft.imagesText), ...imageUrls])
          );

          return {
            ...draft,
            image: nextImages[0] ?? draft.image,
            images: nextImages,
            imagesText: nextImages.join('\n'),
          };
        })
      );
      setNotice({ type: 'success', text: `已上传 ${imageUrls.length} 张图片。` });
    } catch {
      setNotice({ type: 'error', text: '图片上传失败，请稍后重试。' });
    } finally {
      setUploadingJapanSpecialOrderImageMap((current) => ({ ...current, [slug]: false }));
    }
  };

  const applySmartJapanSpecialOrderText = (slug: string) => {
    const sourceText = smartSourceTextMap[slug]?.trim();
    if (!sourceText) {
      setNotice({ type: 'error', text: '请先上传截图识别，或粘贴车源文字。' });
      return;
    }

    const parsed = parseJapanFindSource(sourceText);
    setJapanSpecialOrderDrafts((current) =>
      current.map((draft) => {
        if (draft.slug !== slug) return draft;
        const shouldReplaceSlug = !draft.slug || draft.slug.startsWith('special-order-');

        return {
          ...draft,
          slug: shouldReplaceSlug ? parsed.slug : draft.slug,
          title: parsed.title,
          zhTitle: parsed.zhTitle,
          price: parsed.price,
          year: parsed.year,
          mileage: parsed.mileage,
          location: parsed.location,
          status: parsed.status,
          summary: parsed.summary,
          zhSummary: parsed.zhSummary,
        };
      })
    );
    setNotice({ type: 'success', text: '已根据截图/文字生成车源草稿，下面字段仍可继续修改。' });
  };

  const handleSmartJapanSpecialOrderOcr = async (slug: string, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setSmartOcrProcessingMap((current) => ({ ...current, [slug]: true }));
    setSmartOcrPreviewMap((current) => {
      const previous = current[slug];
      if (previous) URL.revokeObjectURL(previous);
      return { ...current, [slug]: URL.createObjectURL(file) };
    });
    setNotice({ type: 'info', text: '正在识别截图文字，首次加载会稍慢。' });

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng+jpn+chi_sim');
      const result = await worker.recognize(file);
      await worker.terminate();
      const nextText = normalizeSmartSourceText(result.data.text);

      if (!nextText) {
        setNotice({ type: 'error', text: '没有识别到文字，可以换一张更清晰的截图或直接粘贴文字。' });
        return;
      }

      setSmartSourceTextMap((current) => ({ ...current, [slug]: nextText }));
      setNotice({ type: 'success', text: '截图文字已识别，可检查后点击生成并填充。' });
    } catch {
      setNotice({ type: 'error', text: '截图识别失败，可以先把微信文字复制粘贴到文本框。' });
    } finally {
      setSmartOcrProcessingMap((current) => ({ ...current, [slug]: false }));
    }
  };

  const addPartnerDraft = () => {
    const nextId = createId('partner');
    setPartnerDrafts((current) => [
      ...current,
      {
        ...EMPTY_PARTNER_DRAFT,
        id: nextId,
        name: `新合作方 ${current.length + 1}`,
      },
    ]);
    setExpandedPartnerId(nextId);
    setNotice({ type: 'info', text: '已新增供应商/合作方。' });
  };

  const removePartnerDraft = (id: string) => {
    setPartnerDrafts((current) => current.filter((draft) => draft.id !== id));
    setExpandedPartnerId((current) => (current === id ? null : current));
  };

  const handleSavePartners = () => {
    const normalizedIds = partnerDrafts.map((draft) => draft.id.trim()).filter(Boolean);
    const hasDuplicateId = new Set(normalizedIds).size !== normalizedIds.length;

    if (hasDuplicateId) {
      setNotice({ type: 'error', text: '保存失败：每个供应商 ID 不能重复。' });
      return;
    }

    const nextPartners = partnerDrafts
      .map((draft) => toPartner(draft))
      .filter((partner): partner is PartnerPlaceholder => partner !== null);

    if (nextPartners.length !== partnerDrafts.length) {
      setNotice({ type: 'error', text: '保存失败：每个供应商都需要 ID、名称和地址。' });
      return;
    }

    setPartners(nextPartners);
    setNotice({ type: 'success', text: '供应商/合作方列表已保存，并同步到前台。' });
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
      setNotice({ type: 'success', text: '供应商 logo 已上传。' });
    } catch {
      setNotice({ type: 'error', text: '供应商 logo 上传失败。' });
    } finally {
      setUploadingPartnerLogoMap((current) => ({ ...current, [id]: false }));
    }
  };

  const handleResetPartners = () => {
    if (!window.confirm('确定要把供应商/合作方恢复为默认数据吗？')) return;
    resetPartners();
    setNotice({ type: 'success', text: '供应商/合作方已恢复默认。' });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">后台登录</h1>
          <p className="mt-2 text-sm text-slate-600">内容管理后台</p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">密码</span>
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
              登录
            </button>
          </form>
          <Link to="/" className="mt-4 inline-flex text-sm text-slate-700 hover:text-slate-900">
            返回网站
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
                内容管理后台
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                管理前台展示内容，包括日本精选车源更新和供应商/合作方信息。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/admin/crm"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-primary/90"
              >
                CRM 管理
              </Link>
              <Link
                to="/admin/contracts"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                合同管理
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                退出登录
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
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">日本精选车源更新</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  编辑日本精选车源页面 hero 后方显示的车源卡片。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/vehicles/japan-special-order"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  预览页面
                </Link>
                <button
                  type="button"
                  onClick={addJapanSpecialOrderDraft}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  + 添加卡片
                </button>
                <button
                  type="button"
                  onClick={handleSaveJapanSpecialOrders}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-primary/90"
                >
                  保存日本精选车源
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {japanSpecialOrderDrafts.map((draft, index) => (
              <div
                key={draft.slug}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-900">
                    日本精选车源 #{index + 1} - {draft.title || '未命名'}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedJapanSpecialOrderSlug((current) =>
                          current === draft.slug ? null : draft.slug
                        )
                      }
                      className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      {expandedJapanSpecialOrderSlug === draft.slug ? '收起' : '编辑'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeJapanSpecialOrderDraft(draft.slug)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                    >
                      删除
                    </button>
                  </div>
                </div>

                {expandedJapanSpecialOrderSlug !== draft.slug ? null : (
                  <>
                    <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">
                            截图 / 文字智能填充
                          </h4>
                          <p className="mt-1 text-xs leading-5 text-slate-600">
                            上传微信截图识别文字，或直接粘贴日本发来的车源信息；生成后下面字段都可以继续手动修改。
                          </p>
                        </div>
                        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50">
                          {smartOcrProcessingMap[draft.slug] ? '识别中...' : '上传截图识别'}
                          <input
                            type="file"
                            accept="image/*,.webp,.avif,.heic,.heif"
                            className="hidden"
                            disabled={smartOcrProcessingMap[draft.slug]}
                            onChange={(event) => {
                              void handleSmartJapanSpecialOrderOcr(draft.slug, event.target.files);
                              event.target.value = '';
                            }}
                          />
                        </label>
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-[160px_1fr]">
                        {smartOcrPreviewMap[draft.slug] ? (
                          <div className="overflow-hidden rounded-xl border border-blue-100 bg-white p-2">
                            <img
                              src={smartOcrPreviewMap[draft.slug]}
                              alt="OCR preview"
                              className="h-36 w-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-blue-200 bg-white/70 text-xs font-medium text-slate-400">
                            截图预览
                          </div>
                        )}
                        <div className="space-y-2">
                          <textarea
                            value={smartSourceTextMap[draft.slug] ?? ''}
                            onChange={(event) =>
                              setSmartSourceTextMap((current) => ({
                                ...current,
                                [draft.slug]: event.target.value,
                              }))
                            }
                            rows={6}
                            className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm text-slate-900"
                            placeholder={'例如：1999 Nissan Skyline GT-R V Spec\n68,000km\nJPY 12,800,000\nTokyo'}
                          />
                          <button
                            type="button"
                            onClick={() => applySmartJapanSpecialOrderText(draft.slug)}
                            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
                          >
                            生成并填充下面字段
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-slate-700">图片 URL *</span>
                        <input
                          value={draft.image}
                          onChange={(event) =>
                            updateJapanSpecialOrderDraftField(
                              draft.slug,
                              'image',
                              event.target.value
                            )
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                          placeholder="https://..."
                        />
                      </label>
                      <label className="space-y-1.5 md:col-span-2">
                        <span className="text-sm font-medium text-slate-700">
                          图库 URL（一行一张，第一张为主图）*
                        </span>
                        <textarea
                          value={draft.imagesText}
                          onChange={(event) =>
                            updateJapanSpecialOrderDraftField(
                              draft.slug,
                              'imagesText',
                              event.target.value
                            )
                          }
                          rows={4}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                          placeholder={'https://...\nhttps://...'}
                        />
                      </label>
                      <TextInput
                        label="英文标题 *"
                        value={draft.title}
                        onChange={(value) =>
                          updateJapanSpecialOrderDraftField(draft.slug, 'title', value)
                        }
                      />
                      <TextInput
                        label="中文标题 *"
                        value={draft.zhTitle}
                        onChange={(value) =>
                          updateJapanSpecialOrderDraftField(draft.slug, 'zhTitle', value)
                        }
                      />
                      <TextInput
                        label="价格 *"
                        value={draft.price}
                        onChange={(value) =>
                          updateJapanSpecialOrderDraftField(draft.slug, 'price', value)
                        }
                        placeholder="POA / JPY 12,800,000 / From $120,000"
                      />
                      <TextInput
                        label="年份 *"
                        value={draft.year}
                        onChange={(value) =>
                          updateJapanSpecialOrderDraftField(draft.slug, 'year', value)
                        }
                        placeholder="1969 / 1989 - 2002"
                      />
                      <TextInput
                        label="公里数 *"
                        value={draft.mileage}
                        onChange={(value) =>
                          updateJapanSpecialOrderDraftField(draft.slug, 'mileage', value)
                        }
                        placeholder="68,000 km / To be confirmed"
                      />
                      <TextInput
                        label="所在地 *"
                        value={draft.location}
                        onChange={(value) =>
                          updateJapanSpecialOrderDraftField(draft.slug, 'location', value)
                        }
                        placeholder="Japan"
                      />
                      <TextInput
                        label="状态 *"
                        value={draft.status}
                        onChange={(value) =>
                          updateJapanSpecialOrderDraftField(draft.slug, 'status', value)
                        }
                        placeholder="Japan channel update"
                        className="md:col-span-2"
                      />
                      <TextareaInput
                        label="英文简介 *"
                        value={draft.summary}
                        onChange={(value) =>
                          updateJapanSpecialOrderDraftField(draft.slug, 'summary', value)
                        }
                      />
                      <TextareaInput
                        label="中文简介 *"
                        value={draft.zhSummary}
                        onChange={(value) =>
                          updateJapanSpecialOrderDraftField(draft.slug, 'zhSummary', value)
                        }
                      />
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                        {uploadingJapanSpecialOrderImageMap[draft.slug]
                          ? '图片上传中...'
                          : '上传卡片图片'}
                        <input
                          type="file"
                          accept="image/*,.webp,.avif,.heic,.heif"
                          multiple
                          className="hidden"
                          disabled={uploadingJapanSpecialOrderImageMap[draft.slug]}
                          onChange={(event) => {
                            void handleUploadJapanSpecialOrderImage(draft.slug, event.target.files);
                            event.target.value = '';
                          }}
                        />
                      </label>
                    </div>

                    {draft.imagesText ? (
                      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-4">
                        {splitImageText(draft.imagesText).map((image, imageIndex, imageList) => (
                          <div
                            key={`${draft.slug}-${image}`}
                            className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2"
                          >
                            <button
                              type="button"
                              onClick={() => removeJapanSpecialOrderImage(draft.slug, image)}
                              className="absolute right-2 top-2 z-10 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
                              aria-label={`删除第 ${imageIndex + 1} 张图片`}
                            >
                              删除
                            </button>
                            <img
                              src={image}
                              alt={`${draft.title} ${imageIndex + 1}`}
                              className="h-32 w-full object-contain"
                            />
                            <p className="mt-1 text-center text-xs text-slate-500">
                              {imageIndex === 0 ? '主图' : `图 ${imageIndex + 1}`}
                            </p>
                            <div className="mt-2 grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => moveJapanSpecialOrderImage(draft.slug, image, -1)}
                                disabled={imageIndex === 0}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                前移
                              </button>
                              <button
                                type="button"
                                onClick={() => moveJapanSpecialOrderImage(draft.slug, image, 1)}
                                disabled={imageIndex === imageList.length - 1}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                后移
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-semibold text-slate-900">供应商/合作方卡片</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              编辑服务与车主支持页面使用的供应商和合作方信息。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addPartnerDraft}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              + 添加供应商/合作方
            </button>
            <button
              type="button"
              onClick={handleSavePartners}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-primary/90"
            >
              保存供应商
            </button>
            <button
              type="button"
              onClick={handleResetPartners}
              className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
            >
              恢复供应商默认
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
                      供应商 #{index + 1} - {draft.name || '未命名'}
                    </h2>
                    <p className="text-xs text-slate-500">{draft.address || '暂无地址'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPartnerId((current) => (current === draft.id ? null : draft.id))
                      }
                      className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      {expandedPartnerId === draft.id ? '收起' : '编辑'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removePartnerDraft(draft.id)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                    >
                      删除
                    </button>
                  </div>
                </div>

                {expandedPartnerId !== draft.id ? null : (
                  <>
                    <div className="grid gap-3 md:grid-cols-2">
                      <TextInput
                        label="ID *"
                        value={draft.id}
                        onChange={(value) => updatePartnerDraftField(draft.id, 'id', value)}
                      />
                      <TextInput
                        label="名称 *"
                        value={draft.name}
                        onChange={(value) => updatePartnerDraftField(draft.id, 'name', value)}
                      />
                      <TextInput
                        label="地址 *"
                        value={draft.address}
                        onChange={(value) => updatePartnerDraftField(draft.id, 'address', value)}
                        className="md:col-span-2"
                      />
                      <TextInput
                        label="网站"
                        value={draft.website ?? ''}
                        onChange={(value) => updatePartnerDraftField(draft.id, 'website', value)}
                        placeholder="https://..."
                      />
                      <TextInput
                        label="邮箱"
                        value={draft.email ?? ''}
                        onChange={(value) => updatePartnerDraftField(draft.id, 'email', value)}
                      />
                      <TextInput
                        label="电话"
                        value={draft.phone ?? ''}
                        onChange={(value) => updatePartnerDraftField(draft.id, 'phone', value)}
                      />
                      <TextInput
                        label="营业时间"
                        value={draft.hours ?? ''}
                        onChange={(value) => updatePartnerDraftField(draft.id, 'hours', value)}
                      />
                      <TextInput
                        label="Logo URL"
                        value={draft.logoSrc ?? ''}
                        onChange={(value) => updatePartnerDraftField(draft.id, 'logoSrc', value)}
                        placeholder="https://..."
                      />
                      <TextInput
                        label="Logo 说明"
                        value={draft.logoAlt ?? ''}
                        onChange={(value) => updatePartnerDraftField(draft.id, 'logoAlt', value)}
                      />
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-slate-700">Logo 背景</span>
                        <select
                          value={draft.logoPanel ?? 'light'}
                          onChange={(event) =>
                            updatePartnerDraftField(draft.id, 'logoPanel', event.target.value)
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                        >
                          <option value="light">浅色</option>
                          <option value="dark">深色</option>
                        </select>
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium text-slate-700">Logo 适配</span>
                        <select
                          value={draft.logoFit ?? 'contain'}
                          onChange={(event) =>
                            updatePartnerDraftField(draft.id, 'logoFit', event.target.value)
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                        >
                          <option value="contain">完整显示</option>
                          <option value="cover">填充裁切</option>
                        </select>
                      </label>
                      <TextInput
                        label="文字 Logo 第一行（可选）"
                        value={draft.logoWordmarkLine1}
                        onChange={(value) =>
                          updatePartnerDraftField(draft.id, 'logoWordmarkLine1', value)
                        }
                      />
                      <TextInput
                        label="文字 Logo 第二行（可选）"
                        value={draft.logoWordmarkLine2}
                        onChange={(value) =>
                          updatePartnerDraftField(draft.id, 'logoWordmarkLine2', value)
                        }
                      />
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                        {uploadingPartnerLogoMap[draft.id]
                          ? '供应商 logo 上传中...'
                          : '上传供应商 Logo'}
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

function TextInput({
  label,
  value,
  onChange,
  className = '',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <label className={`space-y-1.5 ${className}`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
        placeholder={placeholder}
      />
    </label>
  );
}

function TextareaInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
      />
    </label>
  );
}
