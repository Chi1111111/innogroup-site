import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { sourceMarkets } from '../../../data/sourceMarkets';
import { useLanguage } from '../SiteTranslator';

export function ImportOrigins({ stage }: { stage: number }) {
  const { text } = useLanguage();
  const [selected, setSelected] = useState(0);

  return (
    <div id="source-markets" className="import-origins" data-active={stage === 0 || stage === 3}>
      <div className="import-origin-options" role="group" aria-label={text({ en: 'Explore our sourcing markets', zh: '查看进口来源市场' })}>
        {sourceMarkets.map((market, index) => {
          const Icon = market.icon;
          return <button key={market.id} type="button" aria-pressed={selected === index} aria-describedby="import-origin-description" onClick={() => setSelected(index)}>
            <Icon size={14} aria-hidden="true" /><span>{text(market.title)}</span>
          </button>;
        })}
      </div>
      <div className="import-origin-routes" aria-hidden="true">
        <svg viewBox="0 0 800 56" preserveAspectRatio="none">
          {sourceMarkets.map((market, index) => <path key={market.id} data-selected={selected === index} d={`M${100 + index * 200} 0 C${100 + index * 200} 32 400 8 400 50`} />)}
          <circle cx="400" cy="50" r="3" />
        </svg>
        <span className="import-destination"><MapPin size={12} />{text({ en: 'NEW ZEALAND', zh: '新西兰' })}</span>
      </div>
      <p id="import-origin-description" className="import-origin-description" aria-live="polite">{text(sourceMarkets[selected].title)} · {text(sourceMarkets[selected].text)}</p>
    </div>
  );
}
