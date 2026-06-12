import { useState } from 'react';
import { Plus, CaretDown, CaretUp } from '@phosphor-icons/react';
import { useProjectStore } from '../../stores/projectStore';
import { useUiStore } from '../../stores/uiStore';
import type { Loader } from '../../types';

const MC_VERSIONS = ['1.21.1', '1.21', '1.20.6', '1.20.4', '1.20.1', '1.19.4', '1.19.2', '1.18.2', '1.16.5'];
const LOADERS: { value: Loader; label: string }[] = [
  { value: 'forge', label: 'Forge' },
  { value: 'neoforge', label: 'NeoForge' },
  { value: 'fabric', label: 'Fabric' },
  { value: 'quilt', label: 'Quilt' },
];

export function ProjectCreate() {
  const createProject = useProjectStore((s) => s.createProject);
  const selectProject = useProjectStore((s) => s.selectProject);
  const setActiveView = useUiStore((s) => s.setActiveView);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mcVersion, setMcVersion] = useState('1.21.1');
  const [loader, setLoader] = useState<Loader>('fabric');
  const [author, setAuthor] = useState('');
  const [expanded, setExpanded] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const project = await createProject({
      name: name.trim(),
      description: description.trim(),
      mc_version: mcVersion,
      loader,
      author: author.trim(),
      tags: [],
    });
    await selectProject(project.id);
    setActiveView('graph');
    setName('');
    setDescription('');
    setAuthor('');
    setExpanded(false);
  };

  return (
    <div className="bg-surface rounded-xl border border-sep overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-elevated/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Plus size={18} className="text-accent" weight="bold" />
          <span className="text-sm font-heading font-semibold text-primary">Create New Pack</span>
        </div>
        {expanded ? <CaretUp size={14} className="text-muted" /> : <CaretDown size={14} className="text-muted" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-sep pt-4">
          <div>
            <label className="text-[10px] text-muted uppercase tracking-wider font-mono">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tech Revolution"
              className="w-full mt-1.5 px-3 py-2 bg-elevated rounded-lg border border-sep text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] text-muted uppercase tracking-wider font-mono">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technology-focused progression pack"
              className="w-full mt-1.5 px-3 py-2 bg-elevated rounded-lg border border-sep text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-muted uppercase tracking-wider font-mono">MC Version</label>
              <select
                value={mcVersion}
                onChange={(e) => setMcVersion(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 bg-elevated rounded-lg border border-sep text-primary text-sm focus:outline-none focus:border-accent appearance-none"
              >
                {MC_VERSIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-muted uppercase tracking-wider font-mono">Loader</label>
              <select
                value={loader}
                onChange={(e) => setLoader(e.target.value as Loader)}
                className="w-full mt-1.5 px-3 py-2 bg-elevated rounded-lg border border-sep text-primary text-sm focus:outline-none focus:border-accent appearance-none"
              >
                {LOADERS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted uppercase tracking-wider font-mono">Author</label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your name"
              className="w-full mt-1.5 px-3 py-2 bg-elevated rounded-lg border border-sep text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="w-full py-2.5 bg-accent text-bg font-medium text-sm rounded-lg hover:bg-accentlight disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98]"
          >
            Create Pack
          </button>
        </div>
      )}
    </div>
  );
}
