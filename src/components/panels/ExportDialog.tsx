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
      <div className="absolute inset-0 bg-[#09090B]/60 backdrop-blur-sm" onClick={closePanel} />
      <div className="relative w-[420px] bg-[#18181B] border border-[#27272A] rounded-xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1E1E22]">
          <span className="text-[12px] text-[#FAFAFA] font-medium">{t('export.title')}</span>
          <button onClick={closePanel} className="text-[#3F3F46] hover:text-[#FAFAFA] text-[12px]">✕</button>
        </div>
        <div className="p-5 space-y-2">
          {FORMATS.map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => setSelectedFormat(fmt.id)}
              className={`w-full text-left px-3 py-2.5 rounded-md border transition-colors duration-100 ${
                selectedFormat === fmt.id
                  ? 'border-[#D4A017] bg-[#D4A01711]'
                  : 'border-[#27272A] hover:border-[#3F3F46]'
              }`}
            >
              <div className={`text-[11px] font-medium ${selectedFormat === fmt.id ? 'text-[#D4A017]' : 'text-[#FAFAFA]'}`}>
                {t(`export.${fmt.id}`)}
              </div>
              <div className="text-[9px] text-[#52525B] mt-0.5">{fmt.desc}</div>
            </button>
          ))}
        </div>
        {result && (
          <div className="px-5 pb-2 text-[9px] text-[#71717A] font-mono break-all">{result}</div>
        )}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-[#1E1E22]">
          <button
            onClick={closePanel}
            className="px-3 py-1.5 text-[10px] text-[#71717A] hover:text-[#FAFAFA] transition-colors duration-100"
          >
            {t('export.cancel')}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-1.5 bg-[#D4A017] text-[#09090B] text-[10px] font-semibold rounded-md hover:bg-[#FFCC66] disabled:opacity-50 transition-colors duration-100"
          >
            {exporting ? t('export.exporting') : t('export.export')}
          </button>
        </div>
      </div>
    </div>
  );
}
