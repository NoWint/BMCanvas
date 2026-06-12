import { useState } from 'react';
import { PackageExport, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { useProjectStore } from '../../stores/projectStore';
import { invoke } from '@tauri-apps/api/core';
import type { ExportFormat } from '../../types';

const FORMATS: { key: ExportFormat; label: string; ext: string }[] = [
  { key: 'modrinth', label: 'Modrinth Pack', ext: '.mrpack' },
  { key: 'curseforge', label: 'CurseForge Pack', ext: '.zip' },
  { key: 'prism', label: 'Prism Launcher', ext: ' instance' },
  { key: 'zip', label: 'ZIP Archive', ext: '.zip' },
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
      <div className="p-8 max-w-3xl mx-auto">
        <h2 className="text-lg font-heading font-semibold text-text-primary mb-4">Export</h2>
        <p className="text-text-tertiary text-sm">Select a project to export</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-lg font-heading font-semibold text-text-primary mb-5">Export Pack</h2>

      <div className="bg-surface rounded-xl p-5 border border-separator">
        <div className="mb-5">
          <p className="text-xs font-mono text-text-tertiary">
            {currentProject.name} / {currentProject.mc_version} / {currentProject.loader} / {mods.length} mods
          </p>
        </div>

        <div className="space-y-1.5 mb-5">
          {FORMATS.map((fmt) => (
            <button
              key={fmt.key}
              onClick={() => setSelectedFormat(fmt.key)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-150
                ${selectedFormat === fmt.key
                  ? 'border-accent bg-accent/5'
                  : 'border-separator bg-elevated hover:border-text-tertiary'
                }`}
            >
              <span className={`text-sm font-medium ${selectedFormat === fmt.key ? 'text-accent' : 'text-text-primary'}`}>
                {fmt.label}
              </span>
              <p className="text-[11px] text-text-tertiary mt-0.5 font-mono">{fmt.ext}</p>
            </button>
          ))}
        </div>

        <button
          onClick={handleExport}
          disabled={exporting || mods.length === 0}
          className="w-full py-2.5 bg-accent text-bg font-medium text-sm rounded-lg hover:bg-accent-light disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <PackageExport size={16} weight="fill" />
          {exporting ? 'Exporting...' : 'Export'}
        </button>

        {result && (
          <div className="mt-3 p-3 bg-success/5 border border-success/20 rounded-lg flex items-center gap-2">
            <CheckCircle size={16} className="text-success" weight="fill" />
            <div>
              <p className="text-sm text-success font-medium">Export successful</p>
              <p className="text-[11px] font-mono text-text-tertiary mt-0.5">{result}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-danger/5 border border-danger/20 rounded-lg flex items-center gap-2">
            <WarningCircle size={16} className="text-danger" weight="fill" />
            <div>
              <p className="text-sm text-danger font-medium">Export failed</p>
              <p className="text-[11px] font-mono text-text-tertiary mt-0.5">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
