import type { ModrinthSearchHit } from '../../types';
import { useTranslation } from 'react-i18next';

interface ModCardProps {
  hit: ModrinthSearchHit;
  onAdd: (hit: ModrinthSearchHit) => void;
  canAdd: boolean;
}

function formatDownloads(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function ModCard({ hit, onAdd, canAdd }: ModCardProps) {
  const { t } = useTranslation();

  return (
    <div className="glass-card p-4 flex flex-col w-[160px] shrink-0">
      <div className="w-14 h-14 rounded-xl bg-[#1c1c1e] flex items-center justify-center text-xl mb-3 overflow-hidden">
        {hit.icon_url ? (
          <img src={hit.icon_url} alt="" className="w-full h-full object-cover rounded-xl" />
        ) : (
          <span className="text-[#48484a]">{hit.title[0]}</span>
        )}
      </div>
      <div className="text-[13px] text-[#f5f5f7] font-semibold leading-tight mb-1 truncate">{hit.title}</div>
      <div className="text-[11px] text-[#86868b] leading-snug mb-2 line-clamp-2" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{hit.description}</div>
      <div className="text-[10px] text-[#48484a] mb-3">⬇ {formatDownloads(hit.downloads)}</div>
      <div className="flex gap-1 mb-3 flex-wrap">
        {hit.versions?.slice(0, 2).map((v: string) => (
          <span key={v} className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-[#86868b] font-mono">{v}</span>
        ))}
        {hit.loaders?.slice(0, 1).map((l: string) => (
          <span key={l} className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(10,132,255,0.1)] text-[#0a84ff]">{l}</span>
        ))}
      </div>
      {canAdd ? (
        <button onClick={() => onAdd(hit)} className="mt-auto btn-success px-3 py-1.5 text-[11px]">
          {t('search.add')}
        </button>
      ) : (
        <span className="mt-auto text-[10px] text-[#48484a]">{t('search.selectProjectFirst')}</span>
      )}
    </div>
  );
}
