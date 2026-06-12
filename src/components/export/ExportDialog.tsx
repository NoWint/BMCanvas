import { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { invoke } from '@tauri-apps/api/core';
import type { ExportFormat } from '../../types';

const FORMATS: { key: ExportFormat; label: string; description: string }[] = [
  { key: 'modrinth', label: 'Modrinth Pack', description: '.mrpack format for Modrinth' },
  { key: 'curseforge', label: 'CurseForge Pack', description: 'Standard CurseForge zip format' },
  { key: 'prism', label: 'Prism Launcher', description: 'Instance folder for Prism Launcher' },
  { key: 'zip', label: 'ZIP Archive', description: 'Plain ZIP with mods folder' },
];

export function ExportDialog() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const mods = useProjectStore((s) => s.mods);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('modrinth');
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!currentProject) return;
    setExporting(true);
    setError(null);
    setResult(null);

    try {
      const outputPath = `~/ModCanvas/Exports/${currentProject.name}`;
      const res = await invoke<string>('export_pack', {
        input: {
          projectId: currentProject.id,
          format: { [selectedFormat]: null },
          outputPath,
        },
      });
      setResult(res);
    } catch (e) {
      setError(String(e));
    } finally {
      setExporting(false);
    }
  };

  if (!currentProject) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-[#1C1C1E] mb-4" style={{ fontFamily: '"SF Pro Display", "Inter Tight", system-ui, sans-serif' }}>Export</h2>
        <p className="text-[#8E8E93]">Select a project to export</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold text-[#1C1C1E] mb-4" style={{ fontFamily: '"SF Pro Display", "Inter Tight", system-ui, sans-serif' }}>Export Pack</h2>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-[#C6C6C8]/50">
        <div className="mb-4">
          <p className="text-sm text-[#8E8E93]">
            {currentProject.name} · {currentProject.mc_version} · {currentProject.loader} · {mods.length} mods
          </p>
        </div>

        <div className="space-y-2 mb-5">
          {FORMATS.map((fmt) => (
            <button
              key={fmt.key}
              onClick={() => setSelectedFormat(fmt.key)}
              className={`w-full text-left p-3 rounded-lg border transition-colors duration-150
                ${selectedFormat === fmt.key
                  ? 'border-[#D4A017] bg-[#D4A017]/5'
                  : 'border-[#C6C6C8] bg-[#F2F2F7] hover:border-[#AEAEB2]'
                }`}
            >
              <span className="text-sm font-medium text-[#1C1C1E]">{fmt.label}</span>
              <p className="text-xs text-[#AEAEB2] mt-0.5">{fmt.description}</p>
            </button>
          ))}
        </div>

        <button
          onClick={handleExport}
          disabled={exporting || mods.length === 0}
          className="w-full py-2.5 bg-[#D4A017] text-white font-medium rounded-lg hover:bg-[#FFCC66] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
        >
          {exporting ? 'Exporting...' : 'Export'}
        </button>

        {result && (
          <div className="mt-3 p-3 bg-[#34C759]/10 rounded-lg">
            <p className="text-sm text-[#34C759] font-medium">Export successful!</p>
            <p className="text-xs text-[#8E8E93] mt-0.5">{result}</p>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-[#FF3B30]/10 rounded-lg">
            <p className="text-sm text-[#FF3B30] font-medium">Export failed</p>
            <p className="text-xs text-[#8E8E93] mt-0.5">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
