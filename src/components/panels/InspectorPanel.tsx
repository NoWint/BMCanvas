import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { getNodeType } from '../../engine/dependencyResolver';
import * as tauri from '../../lib/tauri';
import type { NodeType, ModrinthVersion } from '../../types';

const NODE_COLORS: Record<NodeType, string> = {
  mod: '#D4A017',
  library: '#3B82F6',
  api: '#8B5CF6',
  loader: '#22C55E',
};

const NODE_LABELS: Record<NodeType, string> = {
  mod: 'MOD',
  library: 'LIB',
  api: 'API',
  loader: 'LOADER',
};

export function InspectorPanel() {
  const { t } = useTranslation();
  const { mods } = useProjectStore();
  const { selectedNodeId, closeInspector } = useUIStore();
  const [versions, setVersions] = useState<ModrinthVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [modDetails, setModDetails] = useState<any>(null);

  const mod = mods.find((m) => m.id === selectedNodeId);

  useEffect(() => {
    if (!mod?.modrinth_id) return;
    setLoadingVersions(true);
    const fetchDetails = async () => {
      try {
        const [details, vers] = await Promise.all([
          tauri.getModDetails(mod.modrinth_id!),
          tauri.getModVersions(mod.modrinth_id!),
        ]);
        setModDetails(details);
        setVersions(vers);
      } catch (e) {
        console.warn('Failed to fetch mod details:', e);
      } finally {
        setLoadingVersions(false);
      }
    };
    fetchDetails();
  }, [mod?.modrinth_id]);

  if (!mod) {
    return (
      <div className="w-[320px] bg-[#0C0C0E] border-l border-[#1E1E22] flex items-center justify-center shrink-0">
        <span className="text-[#3F3F46] text-[10px]">{t('inspector.noModSelected')}</span>
      </div>
    );
  }

  const nodeType = getNodeType(mod);
  const color = NODE_COLORS[nodeType];
  const description = modDetails?.description || mod.description;
  const sourceUrl = modDetails?.source_url || mod.source_url;
  const licenseId = modDetails?.license?.id || mod.license;
  const licenseName = modDetails?.license?.name;
  const supportedVersions = modDetails?.versions || mod.supported_mc_versions;

  return (
    <div className="w-[320px] bg-[#0C0C0E] border-l border-[#1E1E22] flex flex-col shrink-0 animate-slide-right overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1E1E22]">
        <span className="text-[8px] text-[#52525B] uppercase tracking-wider">{t('inspector.modDetails')}</span>
        <button onClick={closeInspector} className="text-[#3F3F46] hover:text-[#FAFAFA] text-[10px]">✕</button>
      </div>
      <div className="p-3 space-y-4">
        {/* Icon + Name */}
        <div className="flex items-start gap-2.5">
          {mod.icon_url ? (
            <img src={mod.icon_url} alt="" className="w-10 h-10 rounded bg-[#27272A] shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded bg-[#27272A] flex items-center justify-center text-[14px] text-[#71717A] shrink-0">
              {mod.name[0]}
            </div>
          )}
          <div className="border-l-2 pl-2.5 flex-1" style={{ borderColor: color }}>
            <div className="text-[12px] text-[#FAFAFA] font-medium">{mod.name}</div>
            <div className="text-[9px] mt-0.5" style={{ color }}>
              {NODE_LABELS[nodeType]} · {mod.version_number ?? '—'}
            </div>
          </div>
        </div>

        <InfoField label={t('common.description')} value={description} />
        <InfoField label={t('common.author')} value={mod.author} />

        {/* Supported MC Versions */}
        {supportedVersions && supportedVersions.length > 0 && (
          <div>
            <div className="text-[8px] text-[#52525B] uppercase tracking-wider mb-1">{t('inspector.supportedVersions')}</div>
            <div className="flex flex-wrap gap-1">
              {supportedVersions.map((v: string) => (
                <span key={v} className="text-[8px] px-1.5 py-0.5 rounded bg-[#18181B] text-[#A1A1AA] border border-[#27272A] font-mono">
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* License */}
        {(licenseId || licenseName) && (
          <div>
            <div className="text-[8px] text-[#52525B] uppercase tracking-wider mb-1">{t('inspector.license')}</div>
            <div className="text-[9px] text-[#A1A1AA]">{licenseName || licenseId}</div>
          </div>
        )}

        {/* Links */}
        {sourceUrl && (
          <div>
            <div className="text-[8px] text-[#52525B] uppercase tracking-wider mb-1">{t('inspector.repository')}</div>
            <a href={sourceUrl} target="_blank" rel="noopener" className="text-[9px] text-[#D4A017] hover:underline break-all">
              {sourceUrl}
            </a>
          </div>
        )}

        {/* Versions */}
        <div>
          <div className="text-[8px] text-[#52525B] uppercase tracking-wider mb-1">
            {t('inspector.versions')} {loadingVersions && <span className="text-[#3F3F46]">{t('inspector.loading')}</span>}
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {versions.slice(0, 10).map((v) => (
              <div key={v.id} className="flex items-center gap-1.5 text-[8px]">
                <span className="text-[#FAFAFA] font-mono">{v.version_number}</span>
                <span className="text-[#3F3F46]">·</span>
                <span className="text-[#52525B]">{v.game_versions?.[0] ?? '?'}</span>
                <span className="text-[#3F3F46]">·</span>
                <span className="text-[#52525B]">{v.loaders?.join(', ') ?? '?'}</span>
              </div>
            ))}
            {versions.length === 0 && !loadingVersions && (
              <div className="text-[8px] text-[#3F3F46]">{t('inspector.noVersionInfo')}</div>
            )}
          </div>
        </div>

        {/* Changelog */}
        {mod.changelog && (
          <div>
            <div className="text-[8px] text-[#52525B] uppercase tracking-wider mb-1">{t('inspector.changelog')}</div>
            <div className="text-[9px] text-[#71717A] max-h-24 overflow-y-auto whitespace-pre-wrap bg-[#09090B] rounded p-2 border border-[#1E1E22]">
              {mod.changelog}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[8px] text-[#52525B] uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-[9px] text-[#A1A1AA] leading-relaxed">{value}</div>
    </div>
  );
}
