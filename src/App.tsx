import './i18n';
import { useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout/AppShell';
import { WelcomeScreen } from './components/welcome/WelcomeScreen';
import { SearchPanel } from './components/panels/SearchPanel';
import { DiagnosticsPanel } from './components/panels/DiagnosticsPanel';
import { ExportDialog } from './components/panels/ExportDialog';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastContainer } from './components/common/ToastContainer';
import { useProjectStore } from './stores/projectStore';
import { useUIStore } from './stores/uiStore';
import { useKeyboard } from './hooks/useKeyboard';

const queryClient = new QueryClient();

function AppContent() {
  const { currentProject, loadProjects } = useProjectStore();
  const { welcomeVisible, activePanel, hideWelcome } = useUIStore();

  useKeyboard();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const showWelcome = welcomeVisible && !currentProject;

  return (
    <ErrorBoundary>
      <ReactFlowProvider>
        <div className="relative h-screen overflow-hidden">
          <AppShell />
          {activePanel === 'search' && <SearchPanel />}
          {activePanel === 'diagnostics' && <DiagnosticsPanel />}
          {activePanel === 'export' && <ExportDialog />}
          {showWelcome && <WelcomeScreen />}
          <ToastContainer />
        </div>
      </ReactFlowProvider>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
