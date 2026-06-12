import { useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUiStore } from '../../stores/uiStore';

export function ProjectList() {
  const projects = useProjectStore((s) => s.projects);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const selectProject = useProjectStore((s) => s.selectProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const setActiveView = useUiStore((s) => s.setActiveView);
  const loading = useProjectStore((s) => s.loading);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleOpen = async (id: string) => {
    await selectProject(id);
    setActiveView('graph');
  };

  if (loading && projects.length === 0) {
    return <p className="text-[#8E8E93] text-sm mt-4">Loading projects...</p>;
  }

  if (projects.length === 0) {
    return (
      <div className="mt-8 text-center">
        <p className="text-[#AEAEB2]">No projects yet</p>
        <p className="text-[#AEAEB2] text-sm mt-1">Create your first modpack above</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <h2 className="text-lg font-semibold text-[#1C1C1E]" style={{ fontFamily: '"SF Pro Display", "Inter Tight", system-ui, sans-serif' }}>Your Projects</h2>
      {projects.map((project) => (
        <div
          key={project.id}
          className="bg-white rounded-xl p-4 shadow-sm border border-[#C6C6C8]/50 hover:shadow-md transition-shadow duration-150"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[#1C1C1E] truncate" style={{ fontFamily: '"SF Pro Display", "Inter Tight", system-ui, sans-serif' }}>
                {project.name}
              </h3>
              <p className="text-sm text-[#8E8E93] mt-0.5">
                {project.mc_version} · {project.loader}
              </p>
              {project.description && (
                <p className="text-sm text-[#AEAEB2] mt-1 line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>
            <div className="flex gap-2 ml-3">
              <button
                onClick={() => handleOpen(project.id)}
                className="px-3 py-1.5 text-sm font-medium bg-[#D4A017] text-white rounded-lg hover:bg-[#FFCC66] transition-colors duration-150"
              >
                Open
              </button>
              <button
                onClick={() => deleteProject(project.id)}
                className="px-3 py-1.5 text-sm font-medium text-[#FF3B30] border border-[#FF3B30]/30 rounded-lg hover:bg-[#FF3B30]/5 transition-colors duration-150"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
