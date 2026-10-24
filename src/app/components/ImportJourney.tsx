import { memo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { ArrowDown, ArrowRight, FolderOpen, Pause, Play, Plus, X } from 'lucide-react';
import { Link } from 'react-router';
import { useLanguage } from './SiteTranslator';
import { useImportJourney } from './import-journey/useImportJourney';
import { ImportOrigins } from './import-journey/ImportOrigins';
import steps from './import-journey/steps.json';
import scene from './import-journey/scene.svg?raw';
import '../../styles/import-journey.css';

// A checked, local SVG asset from the supplied concept. No external markup or scripts.
const Scene = memo(function Scene() {
  return <div className="import-scene" aria-hidden="true" dangerouslySetInnerHTML={{ __html: scene }} />;
});

export function ImportJourney({ introduction, network }: { introduction: ReactNode; network: ReactNode }) {
  const { language, text } = useLanguage();
  const { root, navigate, stage, motion, setMotion } = useImportJourney(language);
  const detailDialog = useRef<HTMLDialogElement>(null);
  const detailTrigger = useRef<HTMLButtonElement | null>(null);
  const detailScrollY = useRef(0);
  const [detailStage, setDetailStage] = useState<number | null>(null);
  const current = steps[stage];
  const nextStage = (stage + 1) % steps.length;
  const nextStepLabel = nextStage === 0
    ? text({ en: 'Replay the import journey', zh: '重新查看进口旅程' })
    : `${text({ en: 'Next step', zh: '下一步' })}: ${text(steps[nextStage].name)}`;
  const selectedDetail = steps[detailStage ?? stage];

  const revealDetail = (event: MouseEvent<HTMLButtonElement>, index = stage) => {
    // Read details without expanding a chapter or moving the scroll-driven scene.
    detailTrigger.current = event.currentTarget;
    detailScrollY.current = window.scrollY;
    setDetailStage(index);
    detailDialog.current?.showModal();
    // Cancel any pending focus scroll on a sticky trigger, including keyboard activation.
    window.scrollTo({ top: detailScrollY.current, behavior: 'instant' });
  };

  const finishDetail = () => {
    setDetailStage(null);
    detailTrigger.current?.focus({ preventScroll: true });
    window.scrollTo({ top: detailScrollY.current, behavior: 'instant' });
  };

  const closeDetail = () => {
    detailDialog.current?.close();
    // Restore immediately as well as on close, before the next browser paint.
    finishDetail();
  };

  return (
    <section ref={root} id="import-journey" className="import-journey hero-motion" data-motion={motion} aria-label={text({ en: 'Your import journey with INNO', zh: '与 INNO 一起了解进口旅程' })}>
      <div className="import-shell">
        <div className="import-overline">
          <span>INNO GROUP <span aria-hidden="true"> / </span> {text({ en: 'THE IMPORT JOURNEY', zh: '看懂车辆进口' })}</span>
          <Link to="/services">{text({ en: 'Explore our services', zh: '直接查看服务' })}<ArrowRight size={13} /></Link>
        </div>
        <div className="import-grid">
          <div className="import-story">
            {steps.map((step, index) => (
              <article key={step.name.en} id={`import-step-${index + 1}`} className="import-chapter" tabIndex={-1} aria-labelledby={index === 0 ? 'import-title' : `import-title-${index + 1}`}>
                <div className="import-chapter-body">
                  {index === 0 ? introduction : <>
                    <div className="import-eyebrow"><span>{String(index + 1).padStart(2, '0')}</span>{text(step.eyebrow)}</div>
                    <h2 id={`import-title-${index + 1}`} className="import-title">
                      {step.title[language].map((line, lineIndex) => <span key={line} className={lineIndex === step.title[language].length - 1 ? 'import-title-accent' : undefined}>{line}</span>)}
                    </h2>
                    <p className="import-intro">{text(step.intro)}</p>
                    <div className="import-points">
                      {step.points.map((point) => <div key={point.title.en}><h3>{text(point.title)}</h3><p>{text(point.text)}</p></div>)}
                    </div>
                    <p className="import-takeaway">{text(step.takeaway)}</p>
                  </>}
                  <div className="import-detail">
                    <button type="button" aria-haspopup="dialog" aria-expanded={detailStage === index} aria-controls="import-detail-dialog" onClick={(event) => revealDetail(event, index)}>{text(step.detailTitle)}<Plus size={17} aria-hidden="true" /></button>
                  </div>
                  {index === 0 ? <a href="#import-step-2" className="import-scroll-link" onClick={(event) => { event.preventDefault(); navigate.current(1); }}><ArrowDown size={16} />{text({ en: 'Scroll to follow the journey', zh: '往下看，跟随车辆的旅程' })}</a> : null}
                  {index === 2 ? <a className="import-action" href="#calculator">{text({ en: 'Estimate your landed price', zh: '计算预计落地价' })}<ArrowRight size={16} /></a> : null}
                  {index === 5 ? <div className="import-finish-actions"><a href="#quote" className="button-primary">{text({ en: 'Find your starting point', zh: '开始寻找你的下一辆车' })}<ArrowRight size={17} /></a><Link to="/contact" className="import-action">{text({ en: 'Talk to our Auckland team', zh: '联系奥克兰团队' })}<ArrowRight size={16} /></Link></div> : null}
                </div>
              </article>
            ))}
          </div>

          <div className="import-visual-column">
            <ImportOrigins stage={stage} />
          <aside className="import-visual" aria-label={text({ en: 'Illustrated import process', zh: '车辆进口流程动画' })}>
            <div className="import-scene-top">
              <span className="import-location"><i aria-hidden="true" />{text(current.location)}</span>
              <button type="button" className="import-motion-toggle" aria-pressed={motion} aria-label={text({ en: 'Decorative motion', zh: '装饰动效' })} onClick={() => setMotion((value) => !value)}>
                {motion ? <Pause size={12} aria-hidden="true" /> : <Play size={12} aria-hidden="true" />}
                {text(motion ? { en: 'Motion on', zh: '动态开启' } : { en: 'Motion off', zh: '动态关闭' })}
              </button>
            </div>
            <div className="import-scene-frame">
              <span className="import-scene-number" aria-hidden="true">{String(stage + 1).padStart(2, '0')}</span>
              <Scene />
              <button type="button" className="import-hotspot" aria-label={`${text({ en: 'View details', zh: '查看详情' })}: ${text(current.detailTitle)}`} aria-haspopup="dialog" aria-expanded={detailStage !== null} aria-controls="import-detail-dialog" onClick={revealDetail}>
                <span><Plus size={18} aria-hidden="true" /></span><span><span className="import-hotspot-question">{text(current.detailTitle)}</span><span className="import-hotspot-short">{text({ en: 'View details', zh: '查看详情' })}</span></span>
              </button>
            </div>
            <button type="button" className="import-file" aria-controls={`import-step-${nextStage + 1}`} aria-label={nextStepLabel} title={nextStepLabel} onClick={() => navigate.current(nextStage)}>
              <span className="import-folder" aria-hidden="true"><span className="import-paper" /><FolderOpen size={48} strokeWidth={1} /></span>
              <span className="import-file-copy"><small>{text({ en: 'YOUR IMPORT FILE', zh: '你的进口档案' })}</small><span>{text(current.note)}</span><span className="import-file-progress" aria-hidden="true">{steps.map((step, index) => <i key={step.name.en} data-seen={index <= stage} data-current={index === stage} />)}</span></span>
              <span className="import-file-next"><span>{nextStepLabel}</span><ArrowRight size={17} aria-hidden="true" /></span>
            </button>
            <nav className="import-steps" aria-label={text({ en: 'Jump to an import step', zh: '直接查看进口步骤' })}>
              {steps.map((step, index) => <a key={step.name.en} href={`#import-step-${index + 1}`} aria-current={stage === index ? 'step' : undefined} data-past={index < stage} onClick={(event) => { event.preventDefault(); navigate.current(index); }}><span>{String(index + 1).padStart(2, '0')}</span><span>{text(step.name)}</span></a>)}
            </nav>
            <div className="import-scene-foot"><span>{text({ en: 'One car. Every step, explained.', zh: '一辆车，每一步都清楚。' })}</span><span>{String(stage + 1).padStart(2, '0')} / 06</span></div>
          </aside>
          </div>
        </div>
        {network}
      </div>
      <dialog ref={detailDialog} id="import-detail-dialog" className="import-detail-dialog" aria-labelledby="import-detail-dialog-title" onClose={finishDetail} onCancel={(event) => { event.preventDefault(); closeDetail(); }} onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDetail();
      }}>
        <div className="import-dialog-header">
          <span>{String((detailStage ?? stage) + 1).padStart(2, '0')} / 06 <span aria-hidden="true">·</span> {text(selectedDetail.name)}</span>
          <button type="button" className="import-dialog-close" aria-label={text({ en: 'Close details', zh: '关闭详情' })} onClick={closeDetail}><X size={19} aria-hidden="true" /></button>
        </div>
        <div className="import-dialog-body" tabIndex={0}>
          <h2 id="import-detail-dialog-title">{text(selectedDetail.detailTitle)}</h2>
          <div className="import-detail-content">
            {selectedDetail.details.map((detail) => <div key={detail.title.en}><h3>{text(detail.title)}</h3><p>{text(detail.text)}</p></div>)}
          </div>
        </div>
      </dialog>
    </section>
  );
}
