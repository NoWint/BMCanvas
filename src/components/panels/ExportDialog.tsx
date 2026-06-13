import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import * as tauri from '../../lib/tauri';
import type { ExportFormat } from '../../types';

const FORMATS: { id: ExportFormat; name: string; desc: string }[] = [
  { id: 'modrinth', name: 'Modrinth Pack', desc: '.mrpack format for Modrinth' },
  { id: 'curseforge', name: 'CurseForge Pack', desc: 'ZIP with manifest.json' },
  { id: 'prism', name: 'Prism Launcher', desc: 'MultiMC-compatible instance' },
  { id: 'zip', name: 'ZIP Archive', desc: 'Plain ZIP with all mod files' },
];

export function ExportDialog() {
  const { t } = useTranslation();
  const { currentProject } = useProjectStore();
  const { closePanel } = useUIStore();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('modrinth');
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleExport = async () => {
    if (!currentProject) return;
    setExporting(true);
    setResult(null);
    try {
      const outputPath = `~/ModCanvas/Exports/${currentProject.name}`;
      const res = await tauri.callInvoke('export_pack', {
        input: {
          project_id: currentProject.id,
          format: selectedFormat,
          output_path: outputPath,
        },
      });
      setResult(String(res));
    } catch (e) {
      setResult(`Error: ${String(e)}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#000000]/60 backdrop-blur-sm" onClick={closePanel} />
      <div className="relative w-[420px] glass-panel rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(255,255,255,0.08)]">
          <span className="text-[13px] text-[#f5f5f7] font-medium">{t('export.title')}</span>
          <button onClick={closePanel} className="text-[#48484a] hover:text-[#f5f5f7] text-[13px] transition-colors duration-300">✕</button>
        </div>
        <div className="p-5 space-y-2">
          {FORMATS.map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => setSelectedFormat(fmt.id)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-300 ${
                selectedFormat === fmt.id
                  ? 'border-[#0a84ff] bg-[rgba(10,132,255,0.1)]'
                  : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.14)]'
              }`}
            >
              <div className={`text-[13px] font-medium ${selectedFormat === fmt.id ? 'text-[#0a84ff]' : 'text-[#f5f5f7]'}`}>
                {t(`export.${fmt.id}`)}
              </div>
              <div className="text-[9px] text-[#48484a] mt-0.5">{fmt.desc}</div>
            </button>
          ))}
        </div>
        {result && (
          <div className="px-5 pb-2 text-[9px] text-[#86868b] font-mono break-all">{result}</div>
        )}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-[rgba(255,255,255,0.08)]">
          <button
            onClick={closePanel}
            className="btn-secondary px-4 py-2 text-[11px]"
          >
            {t('export.cancel')}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-primary px-5 py-2 text-[11px] disabled:opacity-50"
          >
            {exporting ? t('export.exporting') : t('export.export')}
          </button>
        </div>
      </div>
    </div>
  );
}
