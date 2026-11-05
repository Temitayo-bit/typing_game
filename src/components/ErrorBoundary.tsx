import { Component, type ReactNode } from 'react';

type State = { error: Error | null };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-berry">oops, something broke 💔</h1>
        <p className="mt-2 text-muted">{this.state.error.message}</p>
        <button className="mt-6 rounded-full bg-accent px-6 py-2 font-semibold text-white" onClick={() => location.reload()}>
          reload
        </button>
      </main>
    );
  }
}
