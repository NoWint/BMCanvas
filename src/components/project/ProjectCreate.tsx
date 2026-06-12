import { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUiStore } from '../../stores/uiStore';
import type { Loader } from '../../types';

const MC_VERSIONS = ['1.21.1', '1.21', '1.20.6', '1.20.4', '1.20.1', '1.19.4', '1.19.2', '1.18.2', '1.16.5'];
const LOADERS: Loader[] = ['forge', 'neoforge', 'fabric', 'quilt'];

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
    <div className="bg-surface rounded-xl p-5 shadow-sm border border-separator/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h2 className="text-lg font-semibold text-text-primary font-heading">Create New Pack</h2>
        <span className="text-text-tertiary text-xl">{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-text-tertiary uppercase tracking-wider">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tech Revolution"
              className="w-full mt-1 px-3 py-2 bg-background rounded-lg border border-separator text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-text-tertiary uppercase tracking-wider">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technology-focused progression pack"
              className="w-full mt-1 px-3 py-2 bg-background rounded-lg border border-separator text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-text-tertiary uppercase tracking-wider">Minecraft Version</label>
              <select
                value={mcVersion}
                onChange={(e) => setMcVersion(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background rounded-lg border border-separator text-text-primary text-sm focus:outline-none focus:border-accent"
              >
                {MC_VERSIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-text-tertiary uppercase tracking-wider">Loader</label>
              <select
                value={loader}
                onChange={(e) => setLoader(e.target.value as Loader)}
                className="w-full mt-1 px-3 py-2 bg-background rounded-lg border border-separator text-text-primary text-sm focus:outline-none focus:border-accent"
              >
                {LOADERS.map((l) => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-text-tertiary uppercase tracking-wider">Author</label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your name"
              className="w-full mt-1 px-3 py-2 bg-background rounded-lg border border-separator text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="w-full py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
          >
            Create Pack
          </button>
        </div>
      )}
    </div>
  );
}
