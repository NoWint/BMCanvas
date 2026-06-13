import { useToastStore } from '../../stores/toastStore';

const TYPE_STYLES = {
  success: { bar: '#30d158', icon: '✓' },
  error: { bar: '#ff453a', icon: '✕' },
  warning: { bar: '#ff9f0a', icon: '⚠' },
  info: { bar: '#0a84ff', icon: 'ℹ' },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const style = TYPE_STYLES[toast.type];
        return (
          <div
            key={toast.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl animate-slide-right"
            style={{
              background: 'rgba(44,44,46,0.9)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderLeft: `3px solid ${style.bar}`,
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}
          >
            <span style={{ color: style.bar }} className="text-sm font-semibold">{style.icon}</span>
            <span className="text-[13px] text-[#f5f5f7] flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#48484a] hover:text-[#86868b] text-xs ml-2"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
