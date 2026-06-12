import { useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';

export function useKeyboard() {
  const { togglePanel, closePanel, activePanel } = useUIStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        togglePanel('search');
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        togglePanel('diagnostics');
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        togglePanel('export');
        return;
      }
      if (e.key === 'Escape' && activePanel) {
        e.preventDefault();
        closePanel();
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePanel, closePanel, activePanel]);
}
