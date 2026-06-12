import { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import type { Loader } from '../../types';

const MC_VERSIONS = ['1.21.1', '1.21', '1.20.4', '1.20.1', '1.19.4', '1.18.2', '1.16.5'];
const LOADERS: Loader[] = ['neoforge', 'forge', 'fabric', 'quilt'];

export function WelcomeScreen() {
  const { projects, loadProjects, createProject, selectProject } = useProjectStore();
  const { hideWelcome } = useUIStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [mcVersion, setMcVersion] = useState('1.21.1');
  const [loader, setLoader] = useState<Loader>('neoforge');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const project = await createProject({
      name: name.trim(),
      description,
      mc_version: mcVersion,
      loader,
      author: '',
      tags: [],
    });
    await selectProject(project.id);
    hideWelcome();
  };

  const handleSelect = async (id: string) => {
    await selectProject(id);
    hideWelcome();
  };

  return (
    <div className="absolute inset-0 z-30 bg-[#09090B] flex items-center justify-center animate-fade-in">
      <div className="w-[520px]">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-semibold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>
            ModCanvas
          </h1>
          <p className="text-[13px] text-[#71717A] mt-1">Design Minecraft Modpacks Visually</p>
        </div>

        {projects.length > 0 && !showCreate && (
          <div className="space-y-2 mb-6">
            <div className="text-[9px] text-[#52525B] uppercase tracking-wider mb-2">Recent Projects</div>
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className="w-full text-left px-4 py-3 bg-[#111113] border border-[#27272A] rounded-lg hover:border-[#3F3F46] hover:bg-[#18181B] transition-colors duration-100"
              >
                <div className="text-[12px] text-[#FAFAFA] font-medium">{p.name}</div>
                <div className="text-[9px] text-[#52525B] mt-0.5 font-mono">{p.mc_version} · {p.loader}</div>
              </button>
            ))}
          </div>
        )}

        {showCreate ? (
          <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5 space-y-4">
            <div className="text-[12px] text-[#FAFAFA] font-medium">Create New Pack</div>
            <div>
              <label className="text-[9px] text-[#52525B] uppercase tracking-wider">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tech Revolution"
                className="w-full mt-1 px-3 py-2 bg-[#09090B] border border-[#27272A] rounded-md text-[11px] text-[#FAFAFA] placeholder-[#3F3F46] outline-none focus:border-[#D4A017] transition-colors duration-100"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[9px] text-[#52525B] uppercase tracking-wider">Minecraft Version</label>
                <select
                  value={mcVersion}
                  onChange={(e) => setMcVersion(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[#09090B] border border-[#27272A] rounded-md text-[11px] text-[#FAFAFA] outline-none focus:border-[#D4A017]"
                >
                  {MC_VERSIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[9px] text-[#52525B] uppercase tracking-wider">Loader</label>
                <select
                  value={loader}
                  onChange={(e) => setLoader(e.target.value as Loader)}
                  className="w-full mt-1 px-3 py-2 bg-[#09090B] border border-[#27272A] rounded-md text-[11px] text-[#FAFAFA] outline-none focus:border-[#D4A017]"
                >
                  {LOADERS.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[9px] text-[#52525B] uppercase tracking-wider">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Technology-focused progression pack"
                className="w-full mt-1 px-3 py-2 bg-[#09090B] border border-[#27272A] rounded-md text-[11px] text-[#FAFAFA] placeholder-[#3F3F46] outline-none focus:border-[#D4A017] transition-colors duration-100"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-3 py-1.5 text-[10px] text-[#71717A] hover:text-[#FAFAFA] transition-colors duration-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-1.5 bg-[#D4A017] text-[#09090B] text-[10px] font-semibold rounded-md hover:bg-[#FFCC66] transition-colors duration-100"
              >
                Create Pack
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full px-4 py-3 bg-[#111113] border border-dashed border-[#27272A] rounded-lg text-[11px] text-[#71717A] hover:text-[#D4A017] hover:border-[#D4A017] transition-colors duration-100"
          >
            + Create New Pack
          </button>
        )}
      </div>
    </div>
  );
}
