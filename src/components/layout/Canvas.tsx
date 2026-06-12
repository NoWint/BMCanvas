import { useState } from 'react';
import { useUiStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import { ProjectList } from '../project/ProjectList';
import { ProjectCreate } from '../project/ProjectCreate';
import { SearchBar } from '../search/SearchBar';
import { SearchResults } from '../search/SearchResults';
import { GraphCanvas } from '../graph/GraphCanvas';
import { DiagnosticsPanel } from '../diagnostics/DiagnosticsPanel';
import { ExportDialog } from '../export/ExportDialog';

export function Canvas() {
  const activeView = useUiStore((s) => s.activeView);
  const [searchQuery, setSearchQuery] = useState('');

  const renderContent = () => {
    switch (activeView) {
      case 'projects':
        return (
          <div className="p-8 max-w-2xl mx-auto">
            <ProjectCreate />
            <ProjectList />
          </div>
        );
      case 'discover':
        return (
          <div className="p-8 max-w-3xl mx-auto">
            <SearchBar onSearch={setSearchQuery} />
            <SearchResults query={searchQuery} />
          </div>
        );
      case 'graph':
        return <GraphCanvas />;
      case 'diagnostics':
        return <DiagnosticsPanel />;
      case 'export':
        return <ExportDialog />;
      default:
        return null;
    }
  };

  return (
    <main className="flex-1 h-full bg-bg overflow-auto">
      {renderContent()}
    </main>
  );
}
