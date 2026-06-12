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
        <h2 className="text-xl font-semibold text-text-primary mb-4 font-heading">Export</h2>
        <p className="text-text-secondary">Select a project to export</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold text-text-primary mb-4 font-heading">Export Pack</h2>

      <div className="bg-surface rounded-xl p-5 shadow-sm border border-separator/50">
        <div className="mb-4">
          <p className="text-sm text-text-secondary">
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
                  ? 'border-accent bg-accent/5'
                  : 'border-separator bg-background hover:border-text-tertiary'
                }`}
            >
              <span className="text-sm font-medium text-text-primary">{fmt.label}</span>
              <p className="text-xs text-text-tertiary mt-0.5">{fmt.description}</p>
            </button>
          ))}
        </div>

        <button
          onClick={handleExport}
          disabled={exporting || mods.length === 0}
          className="w-full py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
        >
          {exporting ? 'Exporting...' : 'Export'}
        </button>

        {result && (
          <div className="mt-3 p-3 bg-success/10 rounded-lg">
            <p className="text-sm text-success font-medium">Export successful!</p>
            <p className="text-xs text-text-secondary mt-0.5">{result}</p>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-danger/10 rounded-lg">
            <p className="text-sm text-danger font-medium">Export failed</p>
            <p className="text-xs text-text-secondary mt-0.5">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
