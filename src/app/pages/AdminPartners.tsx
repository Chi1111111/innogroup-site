import { useEffect, useState } from 'react';
import { Building2, Check, ChevronRight, ImagePlus, MapPin, Plus, RotateCcw, Save, Search, Trash2 } from 'lucide-react';
import { uploadImageToCloudinary } from '../../config/cloudinaryConfig';
import type { PartnerPlaceholder } from '../../data/services';
import { usePartnersCatalog } from '../hooks/usePartnersCatalog';
import { EMPTY_PARTNER_DRAFT, createId, getNoticeClass, toPartner, toPartnerDraft, type AdminNotice, type PartnerDraft } from './adminVehiclesModel';
import { TextInput } from './adminVehicleFields';

export function AdminPartners() {
  const { partners, setPartners, resetPartners } = usePartnersCatalog();
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState<AdminNotice | null>(null);
  const [partnerDrafts, setPartnerDrafts] = useState<PartnerDraft[]>([]);
  const [expandedPartnerId, setExpandedPartnerId] = useState<string | null>(null);
  const [uploadingPartnerLogoMap, setUploadingPartnerLogoMap] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const nextPartnerDrafts = partners.map((partner) => toPartnerDraft(partner));
    setPartnerDrafts(nextPartnerDrafts);
    setExpandedPartnerId((current) => current ?? nextPartnerDrafts[0]?.id ?? null);
  }, [partners]);

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
        name: `新合作方 ${current.length + 1}`,
      },
    ]);
    setQuery('');
    setExpandedPartnerId(nextId);
    setNotice({ type: 'info', text: '已新增供应商/合作方。' });
  };

  const removePartnerDraft = (id: string) => {
    setPartnerDrafts((current) => current.filter((draft) => draft.id !== id));
    setExpandedPartnerId((current) => (current === id ? partnerDrafts.find((draft) => draft.id !== id)?.id ?? null : current));
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
    setNotice({ type: 'success', text: '合作伙伴已保存在当前浏览器，可在本机网站预览。' });
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

  const active = partnerDrafts.find((draft) => draft.id === expandedPartnerId);
  const filtered = partnerDrafts.filter((draft) => [draft.name, draft.address, draft.id].some((value) => value.toLowerCase().includes(query.toLowerCase().trim())));
  const hasChanges = JSON.stringify(partnerDrafts) !== JSON.stringify(partners.map(toPartnerDraft));
  const uploading = Object.values(uploadingPartnerLogoMap).some(Boolean);
  const update = (key: keyof PartnerDraft, value: string) => { if (active) updatePartnerDraftField(active.id, key, value); };

  return (
    <div className="partners-workspace">
      <div className="partners-heading">
        <div><p className="admin-eyebrow">CONTENT / PARTNERS</p><h1>合作伙伴<span aria-hidden="true">{partnerDrafts.length}</span></h1><p>维护合作关系，呈现一致的品牌形象。</p></div>
        <button type="button" className="admin-action primary" onClick={addPartnerDraft}><Plus size={17} />添加合作伙伴</button>
      </div>
      <div className="partners-context"><span className="partners-context-dot" /><strong>本机预览</strong><span>更改仅保存在当前浏览器，不会发布给其他访客。</span></div>
      {notice && <p role={notice.type === 'error' ? 'alert' : 'status'} className={`partners-notice ${getNoticeClass(notice.type)}`}>{notice.text}</p>}
      <div className="partners-layout">
        <section className="partners-directory" aria-label="合作伙伴列表">
          <div className="partners-directory-top"><h2>伙伴目录</h2><span>{filtered.length} 位</span></div>
          <label className="partners-search"><Search size={16} /><input aria-label="搜索合作伙伴" placeholder="搜索名称或地址…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="partners-list">
            {filtered.map((draft) => <button type="button" key={draft.id} aria-pressed={active?.id === draft.id} className={`partners-list-item ${active?.id === draft.id ? 'selected' : ''}`} onClick={() => setExpandedPartnerId(draft.id)}>
              <span className={`partners-avatar ${draft.logoPanel === 'dark' ? 'dark' : ''}`}>{draft.logoSrc ? <img src={draft.logoSrc} alt="" /> : <Building2 size={21} />}</span>
              <span className="partners-list-copy"><strong>{draft.name || '未命名合作伙伴'}</strong><small>{draft.address || '待完善地址'}</small></span><ChevronRight size={15} />
            </button>)}
            {!filtered.length && <div className="partners-empty"><Search size={24} /><p>{query ? '未找到匹配的合作伙伴' : '还没有合作伙伴'}</p><button type="button" onClick={query ? () => setQuery('') : addPartnerDraft}>{query ? '清除搜索' : '添加第一位伙伴'}</button></div>}
          </div>
          <div className="partners-directory-footer"><button type="button" onClick={handleResetPartners}><RotateCcw size={14} />恢复默认资料</button></div>
        </section>
        <section className="partners-editor" aria-label="合作伙伴编辑">
          {active ? <>
            <div className="partners-editor-top"><div><p>合作伙伴资料</p><h2>{active.name || '未命名合作伙伴'}</h2></div><span className={hasChanges ? 'partners-status pending' : 'partners-status'}>{hasChanges ? '有未保存更改' : <><Check size={13} />已保存</>}</span></div>
            <div className="partners-editor-body">
              <section className="partners-field-section"><div className="partners-section-label"><span>01</span><div><h3>基本资料</h3><p>名称与地址为必填，填写后可保存。</p></div></div><div className="partners-fields">
                <TextInput label="伙伴名称 *" value={active.name} onChange={(value) => update('name', value)} className="md:col-span-2" />
                <TextInput label="地址 *" value={active.address} onChange={(value) => update('address', value)} className="md:col-span-2" />
                <TextInput label="网站" value={active.website ?? ''} onChange={(value) => update('website', value)} placeholder="https://" />
                <TextInput label="营业时间" value={active.hours ?? ''} onChange={(value) => update('hours', value)} placeholder="例如 Mon–Fri, 9:00–17:00" />
                <TextInput label="联系邮箱" value={active.email ?? ''} onChange={(value) => update('email', value)} placeholder="hello@example.com" />
                <TextInput label="联系电话" value={active.phone ?? ''} onChange={(value) => update('phone', value)} placeholder="+64" />
              </div></section>
              <section className="partners-field-section"><div className="partners-section-label"><span>02</span><div><h3>品牌展示</h3><p>上传 Logo，实时确认展示效果。</p></div></div>
                <div className="partners-brand-editor"><div className={`partners-logo-preview ${active.logoPanel === 'dark' ? 'dark' : ''}`}>
                  {active.logoSrc ? <img src={active.logoSrc} alt={active.logoAlt || active.name} style={{ objectFit: active.logoFit === 'cover' ? 'cover' : 'contain' }} /> : active.logoWordmarkLine1 ? <strong>{active.logoWordmarkLine1}<small>{active.logoWordmarkLine2}</small></strong> : <><Building2 size={30} /><span>品牌预览</span></>}
                </div><div className="partners-upload"><label className="admin-action"><ImagePlus size={16} />{uploadingPartnerLogoMap[active.id] ? '正在上传…' : '上传 Logo'}<input type="file" accept="image/*" className="sr-only" disabled={uploadingPartnerLogoMap[active.id]} onChange={(event) => { void handleUploadPartnerLogo(active.id, event.target.files); event.target.value = ''; }} /></label><p>建议使用透明背景的 PNG 图片。<br />上传后请保存更改。</p></div></div>
                <div className="partners-fields">
                  <TextInput label="Logo 图片地址" value={active.logoSrc ?? ''} onChange={(value) => update('logoSrc', value)} placeholder="https://" className="md:col-span-2" />
                  <TextInput label="图片说明" value={active.logoAlt ?? ''} onChange={(value) => update('logoAlt', value)} className="md:col-span-2" />
                  <label className="partners-select">背景颜色<select value={active.logoPanel ?? 'light'} onChange={(event) => update('logoPanel', event.target.value)}><option value="light">浅色背景</option><option value="dark">深色背景</option></select></label>
                  <label className="partners-select">图片适配<select value={active.logoFit ?? 'contain'} onChange={(event) => update('logoFit', event.target.value)}><option value="contain">完整显示</option><option value="cover">填充裁切</option></select></label>
                </div>
                <details className="partners-advanced" key={active.id}><summary>文字 Logo 与资料编号</summary><div className="partners-fields"><TextInput label="文字 Logo 第一行" value={active.logoWordmarkLine1} onChange={(value) => update('logoWordmarkLine1', value)} /><TextInput label="文字 Logo 第二行" value={active.logoWordmarkLine2} onChange={(value) => update('logoWordmarkLine2', value)} /></div><p>资料编号：{active.id}</p></details>
              </section>
            </div>
            <div className="partners-editor-footer"><button type="button" className="partners-delete" onClick={() => removePartnerDraft(active.id)}><Trash2 size={15} />移除伙伴</button><div><span>{hasChanges ? '更改待保存' : '资料已保存'} · {partnerDrafts.length} 位伙伴</span><button type="button" className="admin-action primary" disabled={!hasChanges || uploading} onClick={handleSavePartners}><Save size={16} />{uploading ? '等待上传完成' : '保存全部更改'}</button></div></div>
          </> : <div className="partners-empty editor-empty"><Building2 size={36} /><h2>选择一位合作伙伴</h2><p>从左侧目录选择，或添加新的合作伙伴。</p><button type="button" className="admin-action primary" onClick={addPartnerDraft}><Plus size={16} />添加合作伙伴</button>{hasChanges && <button type="button" className="admin-action" onClick={handleSavePartners}><Save size={16} />保存全部更改</button>}</div>}
        </section>
        <aside className="partners-preview"><p className="admin-eyebrow">DISPLAY PREVIEW</p><h2>展示预览</h2><p>检查品牌与联系资料的完整度。</p>{active ? <div className="partners-preview-card"><div className={`partners-preview-brand ${active.logoPanel === 'dark' ? 'dark' : ''}`}>{active.logoSrc ? <img src={active.logoSrc} alt={active.logoAlt || active.name} style={{ objectFit: active.logoFit === 'cover' ? 'cover' : 'contain' }} /> : <strong>{active.logoWordmarkLine1 || active.name}<small>{active.logoWordmarkLine2}</small></strong>}</div><div><h3>{active.name || '伙伴名称'}</h3><p><MapPin size={14} />{active.address || '尚未填写地址'}</p>{active.hours && <p>{active.hours}</p>}{active.phone && <p>{active.phone}</p>}{active.email && <p>{active.email}</p>}</div></div> : <p>选择伙伴后显示预览。</p>}<div className="partners-preview-note"><Check size={16} /><span>建议补全联系方式，方便客户找到合作伙伴。</span></div></aside>
      </div>
    </div>
  );
}
