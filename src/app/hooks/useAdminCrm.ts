import { useEffect, useRef, useState } from 'react';
import { loadCrmState, saveCrmState } from '../lib/crm';
import { getErrorMessage } from '../lib/contracts';
import { CRM_STORAGE_KEY, loadCrm, normalizeCrmState } from '../pages/adminCrmModel';

// One queue across page mounts prevents an older write from finishing after a newer one.
let saveQueue: Promise<void> = Promise.resolve();

export function useAdminCrm() {
  const [crm, setCrm] = useState(loadCrm);
  const [hasLoadedCloudCrm, setLoaded] = useState(false);
  const [cloudSyncNotice, setNotice] = useState('正在读取客户资料…');
  const [saveStatus, setSaveStatus] = useState<'loading' | 'saved' | 'saving' | 'error'>('loading');
  const [revision, setRevision] = useState(0);
  const lastSaved = useRef('');
  const sequence = useRef(0);

  useEffect(() => {
    let active = true;
    setLoaded(false);
    setSaveStatus('loading');
    setNotice('正在读取客户资料…');
    // Await writes from a previous visit before reading the server again.
    void saveQueue.then(() => loadCrmState()).then((cloud) => {
      if (!active) return;
      const next = normalizeCrmState(cloud ?? loadCrm());
      lastSaved.current = cloud ? JSON.stringify(next) : '';
      setCrm(next);
      setLoaded(true);
      setSaveStatus('saved');
      setNotice(cloud ? '已同步云端资料' : '云端暂无资料，将同步本机缓存');
    }).catch((error) => {
      if (!active) return;
      setSaveStatus('error');
      setNotice(`读取失败，已暂停编辑以保护云端资料：${getErrorMessage(error)}`);
    });
    return () => { active = false; };
  }, [revision]);

  useEffect(() => {
    if (!hasLoadedCloudCrm) return;
    const payload = JSON.stringify(crm);
    if (payload === lastSaved.current) return;
    let cacheFailed = false;
    try { window.localStorage.setItem(CRM_STORAGE_KEY, payload); } catch { cacheFailed = true; }
    const currentSequence = ++sequence.current;
    setSaveStatus('saving');
    setNotice(cacheFailed ? '本机缓存不可用，正在保存到云端…' : '正在保存更改…');
    let active = true;
    // Serialize writes. React cleanup alone does not cancel a request already sent.
    saveQueue = saveQueue.then(async () => {
      await saveCrmState(crm);
      if (!active || currentSequence !== sequence.current) return;
      lastSaved.current = payload;
      setSaveStatus('saved');
      setNotice(`云端已保存 ${new Date().toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}`);
    }).catch((error) => {
      if (!active || currentSequence !== sequence.current) return;
      setSaveStatus('error');
      setNotice(`保存失败，${cacheFailed ? '本机缓存也不可用，请勿关闭页面' : '更改已保存在本机'}：${getErrorMessage(error)}`);
    });
    return () => { active = false; };
  }, [crm, hasLoadedCloudCrm]);

  useEffect(() => {
    const preventClose = (event: BeforeUnloadEvent) => {
      if (saveStatus !== 'saving' && !(saveStatus === 'error' && hasLoadedCloudCrm)) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', preventClose);
    return () => window.removeEventListener('beforeunload', preventClose);
  }, [saveStatus, hasLoadedCloudCrm]);

  const retry = () => {
    if (hasLoadedCloudCrm) setCrm((current) => ({ ...current }));
    else setRevision((current) => current + 1);
  };
  return { crm, setCrm, hasLoadedCloudCrm, cloudSyncNotice, saveStatus, retry };
}
