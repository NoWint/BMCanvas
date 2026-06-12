import { useEffect } from 'react';
import { Trash, ArrowRight } from '@phosphor-icons/react';
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
    return <p className="text-text-tertiary text-sm mt-6">Loading...</p>;
  }

  if (projects.length === 0) {
    return (
      <div className="mt-10 text-center">
        <p className="text-text-tertiary text-sm">No projects yet</p>
        <p className="text-text-tertiary text-xs mt-1">Create your first modpack above</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-2">
      <h2 className="text-xs text-text-tertiary uppercase tracking-wider font-mono mb-3">Your Projects</h2>
      {projects.map((project) => (
        <div
          key={project.id}
          className="bg-surface rounded-lg p-4 border border-separator hover:border-accent/30 transition-all duration-150 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-text-primary text-sm truncate">
                {project.name}
              </h3>
              <p className="text-[11px] font-mono text-text-tertiary mt-0.5">
                {project.mc_version} / {project.loader}
              </p>
              {project.description && (
                <p className="text-xs text-text-tertiary mt-1.5 line-clamp-1">
                  {project.description}
                </p>
              )}
            </div>
            <div className="flex gap-1.5 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleOpen(project.id)}
                className="p-2 bg-accent/10 text-accent rounded-md hover:bg-accent/20 transition-colors"
                title="Open"
              >
                <ArrowRight size={14} weight="bold" />
              </button>
              <button
                onClick={() => deleteProject(project.id)}
                className="p-2 bg-danger/10 text-danger rounded-md hover:bg-danger/20 transition-colors"
                title="Delete"
              >
                <Trash size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
