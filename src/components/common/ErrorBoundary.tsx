import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ModCanvas crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-[#000] flex items-center justify-center">
          <div className="text-center max-w-md px-8">
            <div className="text-5xl mb-6">⚠️</div>
            <h1 className="text-2xl font-semibold text-[#f5f5f7] mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              出错了
            </h1>
            <p className="text-[#86868b] text-sm mb-6">
              ModCanvas 遇到了一个意外错误。请尝试重新启动应用。
            </p>
            <details className="text-left mb-6">
              <summary className="text-[#48484a] text-xs cursor-pointer hover:text-[#86868b]">
                错误详情
              </summary>
              <pre className="mt-2 text-[10px] text-[#ff453a] bg-[#1c1c1e] rounded-lg p-3 overflow-auto max-h-32 font-mono">
                {this.state.error?.message}
              </pre>
            </details>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="btn-primary px-6 py-2.5 text-sm"
            >
              重新加载
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
