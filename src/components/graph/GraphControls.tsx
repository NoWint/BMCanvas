import { useReactFlow } from 'reactflow';
import { useTranslation } from 'react-i18next';

export function GraphControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { t } = useTranslation();

  return (
    <div className="absolute bottom-3 right-3 flex gap-1 z-10">
      <button
        onClick={() => zoomIn({ duration: 300 })}
        className="flex items-center justify-center w-8 h-8 glass-panel rounded-lg text-[#86868b] text-xs hover:text-[#f5f5f7] hover:border-[rgba(255,255,255,0.14)] transition-all duration-300"
        title={t('graph.zoomIn')}
      >
        +
      </button>
      <button
        onClick={() => zoomOut({ duration: 300 })}
        className="flex items-center justify-center w-8 h-8 glass-panel rounded-lg text-[#86868b] text-xs hover:text-[#f5f5f7] hover:border-[rgba(255,255,255,0.14)] transition-all duration-300"
        title={t('graph.zoomOut')}
      >
        −
      </button>
      <button
        onClick={() => fitView({ padding: 0.2, duration: 300 })}
        className="flex items-center justify-center w-8 h-8 glass-panel rounded-lg text-[#86868b] text-xs hover:text-[#f5f5f7] hover:border-[rgba(255,255,255,0.14)] transition-all duration-300"
        title={t('graph.fitView')}
      >
        ⊞
      </button>
    </div>
  );
}
