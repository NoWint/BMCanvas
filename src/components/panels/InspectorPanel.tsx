import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { getNodeType } from '../../engine/dependencyResolver';
import * as tauri from '../../lib/tauri';
import type { NodeType, ModrinthVersion, Dependency } from '../../types';

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

type TabId = 'details' | 'versions' | 'dependencies';

export function InspectorPanel() {
  const { t } = useTranslation();
  const { mods, currentProject } = useProjectStore();
  const { selectedNodeId, closeInspector, setSelectedNode, openInspector } = useUIStore();
  const [activeTab, setActiveTab] = useState<TabId>('details');
  const [versions, setVersions] = useState<ModrinthVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [modDetails, setModDetails] = useState<any>(null);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);

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

  useEffect(() => {
    if (!mod || !currentProject) return;
    tauri.getAllDependencies(currentProject.id).then((deps) => {
      setDependencies(deps.filter((d) => d.project_mod_id === mod.id));
    }).catch(() => {});
  }, [mod?.id, currentProject?.id]);

  // Reset tab when mod changes
  useEffect(() => {
    setActiveTab('details');
  }, [selectedNodeId]);

  if (!mod) {
    return (
      <div className="w-[320px] bg-[#0C0C0E]/80 backdrop-blur-xl border-l border-white/[0.06] flex items-center justify-center shrink-0">
        <span className="text-[#52525B] text-[10px]">{t('inspector.noModSelected')}</span>
      </div>
    );
  }

  const nodeType = getNodeType(mod);
  const color = NODE_COLORS[nodeType];
  const description = modDetails?.description || mod.description;
  const sourceUrl = modDetails?.source_url || mod.source_url;
  const homepageUrl = modDetails?.wiki_url || mod.homepage_url;
  const licenseId = modDetails?.license?.id || mod.license;
  const licenseName = modDetails?.license?.name;
  const supportedVersions = modDetails?.versions || mod.supported_mc_versions;

  const tabs: { id: TabId; label: string }[] = [
    { id: 'details', label: t('inspector.details') },
    { id: 'versions', label: t('inspector.versions') },
    { id: 'dependencies', label: t('inspector.dependencies') },
  ];

  const handleDepClick = (depModrinthId: string | null, depSlug: string) => {
    // Try to find the dependency in current mods
    const targetMod = depModrinthId
      ? mods.find(m => m.modrinth_id === depModrinthId)
      : mods.find(m => m.slug?.toLowerCase() === depSlug.toLowerCase());
    if (targetMod) {
      setSelectedNode(targetMod.id);
      openInspector(targetMod.id);
    }
  };

  return (
    <div className="w-[320px] bg-[#0C0C0E]/80 backdrop-blur-xl border-l border-white/[0.06] flex flex-col shrink-0 animate-slide-right">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
        <span className="text-[8px] text-[#86868b] uppercase tracking-wider">{t('inspector.modDetails')}</span>
        <button onClick={closeInspector} className="text-[#52525B] hover:text-[#FAFAFA] text-[10px] transition-colors">✕</button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-white/[0.06]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-[9px] font-medium transition-colors duration-150 relative ${
              activeTab === tab.id
                ? 'text-[#D4A017]'
                : 'text-[#86868b] hover:text-[#A1A1AA]'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-2 right-2 h-[1.5px] bg-[#D4A017] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'details' && (
          <DetailsTab
            mod={mod}
            nodeType={nodeType}
            color={color}
            description={description}
            sourceUrl={sourceUrl}
            homepageUrl={homepageUrl}
            licenseId={licenseId}
            licenseName={licenseName}
            supportedVersions={supportedVersions}
            t={t}
          />
        )}
        {activeTab === 'versions' && (
          <VersionsTab
            versions={versions}
            loading={loadingVersions}
            currentVersion={mod.version_number}
            t={t}
          />
        )}
        {activeTab === 'dependencies' && (
          <DependenciesTab
            dependencies={dependencies}
            mods={mods}
            onDepClick={handleDepClick}
            t={t}
          />
        )}
      </div>
    </div>
  );
}

// ── Details Tab ──────────────────────────────────────────────────
function DetailsTab({
  mod,
  nodeType,
  color,
  description,
  sourceUrl,
  homepageUrl,
  licenseId,
  licenseName,
  supportedVersions,
  t,
}: {
  mod: any;
  nodeType: NodeType;
  color: string;
  description: string | null | undefined;
  sourceUrl: string | null | undefined;
  homepageUrl: string | null | undefined;
  licenseId: string | null | undefined;
  licenseName: string | null | undefined;
  supportedVersions: string[] | null | undefined;
  t: (key: string) => string;
}) {
  return (
    <>
      {/* Icon + Name + Author */}
      <div className="flex items-start gap-3">
        {mod.icon_url ? (
          <img src={mod.icon_url} alt="" className="w-16 h-16 rounded-lg bg-[#27272A] shrink-0" />
        ) : (
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center text-[24px] font-medium shrink-0"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {mod.name[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-[#FAFAFA] font-medium leading-tight">{mod.name}</div>
          <div className="text-[9px] mt-1" style={{ color }}>{NODE_LABELS[nodeType]}</div>
          {mod.author && (
            <div className="text-[9px] text-[#86868b] mt-0.5">{t('common.author')}: {mod.author}</div>
          )}
        </div>
      </div>

      {/* Description */}
      <InfoField label={t('common.description')} value={description} />

      {/* Links row */}
      <div className="space-y-1.5">
        {licenseId && (
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-[#86868b] uppercase tracking-wider w-16 shrink-0">{t('inspector.license')}</span>
            <span className="text-[9px] text-[#A1A1AA]">{licenseName || licenseId}</span>
          </div>
        )}
        {homepageUrl && (
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-[#86868b] uppercase tracking-wider w-16 shrink-0">{t('inspector.homepage')}</span>
            <a href={homepageUrl} target="_blank" rel="noopener" className="text-[9px] text-[#D4A017] hover:underline truncate">
              {homepageUrl}
            </a>
          </div>
        )}
        {sourceUrl && (
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-[#86868b] uppercase tracking-wider w-16 shrink-0">{t('inspector.repository')}</span>
            <a href={sourceUrl} target="_blank" rel="noopener" className="text-[9px] text-[#D4A017] hover:underline truncate">
              {sourceUrl}
            </a>
          </div>
        )}
      </div>

      {/* MC Version tags */}
      {supportedVersions && supportedVersions.length > 0 && (
        <div>
          <div className="text-[8px] text-[#86868b] uppercase tracking-wider mb-1.5">{t('inspector.supportedVersions')}</div>
          <div className="flex flex-wrap gap-1">
            {supportedVersions.map((v: string) => (
              <span key={v} className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.04] text-[#A1A1AA] border border-white/[0.06] font-mono">
                {v}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Loader tags */}
      {mod.supported_mc_versions && mod.supported_mc_versions.length > 0 && (
        <div>
          <div className="text-[8px] text-[#86868b] uppercase tracking-wider mb-1.5">{t('common.loader')}</div>
          <div className="flex flex-wrap gap-1">
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 font-mono">
              {nodeType === 'loader' ? 'LOADER' : NODE_LABELS[nodeType]}
            </span>
          </div>
        </div>
      )}
    </>
  );
}

// ── Versions Tab ─────────────────────────────────────────────────
function VersionsTab({
  versions,
  loading,
  currentVersion,
  t,
}: {
  versions: ModrinthVersion[];
  loading: boolean;
  currentVersion: string | null;
  t: (key: string) => string;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-[9px] text-[#86868b]">{t('inspector.loading')}</span>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-[9px] text-[#52525B]">{t('inspector.noVersionInfo')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {versions.map((v) => {
        const isCurrent = v.version_number === currentVersion;
        return (
          <div
            key={v.id}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg transition-colors duration-150 cursor-pointer ${
              isCurrent
                ? 'bg-[#D4A017]/10 ring-1 ring-[#D4A017]/30'
                : 'hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-mono ${isCurrent ? 'text-[#D4A017] font-medium' : 'text-[#FAFAFA]'}`}>
                  {v.version_number}
                </span>
                {isCurrent && (
                  <span className="text-[7px] px-1 py-0.5 rounded bg-[#D4A017]/20 text-[#D4A017] font-medium">
                    {t('inspector.currentVersion')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[7px] text-[#86868b] font-mono">{v.game_versions?.[0] ?? '?'}</span>
                <span className="text-[7px] text-[#3F3F46]">·</span>
                <span className="text-[7px] text-[#86868b]">{v.loaders?.join(', ') ?? '?'}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Dependencies Tab ─────────────────────────────────────────────
function DependenciesTab({
  dependencies,
  mods,
  onDepClick,
  t,
}: {
  dependencies: Dependency[];
  mods: any[];
  onDepClick: (depModrinthId: string | null, depSlug: string) => void;
  t: (key: string) => string;
}) {
  const requiredDeps = dependencies.filter(d => d.dep_type === 'required');
  const optionalDeps = dependencies.filter(d => d.dep_type === 'optional');
  const incompatibleDeps = dependencies.filter(d => d.dep_type === 'incompatible');

  if (dependencies.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-[9px] text-[#52525B]">{t('inspector.noVersionInfo')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requiredDeps.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[8px] text-[#86868b] uppercase tracking-wider">{t('inspector.required')}</span>
            <span className="text-[7px] px-1 py-0.5 rounded bg-[#D4A017]/10 text-[#D4A017]">{requiredDeps.length}</span>
          </div>
          <div className="space-y-0.5">
            {requiredDeps.map((dep) => {
              const targetMod = dep.dep_modrinth_id
                ? mods.find(m => m.modrinth_id === dep.dep_modrinth_id)
                : mods.find(m => m.slug?.toLowerCase() === dep.depends_on_slug.toLowerCase());
              return (
                <button
                  key={dep.id}
                  onClick={() => onDepClick(dep.dep_modrinth_id, dep.depends_on_slug)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors duration-150 text-left border-l-2 border-[#D4A017]/60"
                >
                  <span className="text-[9px] text-[#FAFAFA] truncate">{dep.depends_on_slug}</span>
                  {targetMod && (
                    <span className="text-[7px] text-[#86868b] ml-auto shrink-0">{targetMod.version_number ?? '?'}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {optionalDeps.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[8px] text-[#86868b] uppercase tracking-wider">{t('inspector.optional')}</span>
            <span className="text-[7px] px-1 py-0.5 rounded bg-[#3B82F6]/10 text-[#3B82F6]">{optionalDeps.length}</span>
          </div>
          <div className="space-y-0.5">
            {optionalDeps.map((dep) => {
              const targetMod = dep.dep_modrinth_id
                ? mods.find(m => m.modrinth_id === dep.dep_modrinth_id)
                : mods.find(m => m.slug?.toLowerCase() === dep.depends_on_slug.toLowerCase());
              return (
                <button
                  key={dep.id}
                  onClick={() => onDepClick(dep.dep_modrinth_id, dep.depends_on_slug)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors duration-150 text-left border-l-2 border-dashed border-[#3B82F6]/40"
                >
                  <span className="text-[9px] text-[#A1A1AA] truncate">{dep.depends_on_slug}</span>
                  {targetMod && (
                    <span className="text-[7px] text-[#86868b] ml-auto shrink-0">{targetMod.version_number ?? '?'}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {incompatibleDeps.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[8px] text-[#86868b] uppercase tracking-wider">{t('diagnostics.knownIncompatibility')}</span>
            <span className="text-[7px] px-1 py-0.5 rounded bg-[#EF4444]/10 text-[#EF4444]">{incompatibleDeps.length}</span>
          </div>
          <div className="space-y-0.5">
            {incompatibleDeps.map((dep) => (
              <button
                key={dep.id}
                onClick={() => onDepClick(dep.dep_modrinth_id, dep.depends_on_slug)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors duration-150 text-left border-l-2 border-[#EF4444]/40"
              >
                <span className="text-[9px] text-[#EF4444] truncate">{dep.depends_on_slug}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[8px] text-[#86868b] uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-[9px] text-[#A1A1AA] leading-relaxed">{value}</div>
    </div>
  );
}
