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
    return <p className="text-text-secondary text-sm mt-4">Loading projects...</p>;
  }

  if (projects.length === 0) {
    return (
      <div className="mt-8 text-center">
        <p className="text-text-tertiary">No projects yet</p>
        <p className="text-text-tertiary text-sm mt-1">Create your first modpack above</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <h2 className="text-lg font-semibold text-text-primary font-heading">Your Projects</h2>
      {projects.map((project) => (
        <div
          key={project.id}
          className="bg-surface rounded-xl p-4 shadow-sm border border-separator/50 hover:shadow-md transition-shadow duration-150"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text-primary truncate font-heading">
                {project.name}
              </h3>
              <p className="text-sm text-text-secondary mt-0.5">
                {project.mc_version} · {project.loader}
              </p>
              {project.description && (
                <p className="text-sm text-text-tertiary mt-1 line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>
            <div className="flex gap-2 ml-3">
              <button
                onClick={() => handleOpen(project.id)}
                className="px-3 py-1.5 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-light transition-colors duration-150"
              >
                Open
              </button>
              <button
                onClick={() => deleteProject(project.id)}
                className="px-3 py-1.5 text-sm font-medium text-danger border border-danger/30 rounded-lg hover:bg-danger/5 transition-colors duration-150"
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
