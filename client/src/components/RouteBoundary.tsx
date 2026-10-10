import { Component, type ReactNode } from "react";
export default class RouteBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <section role="alert" className="mx-auto max-w-7xl px-5 py-12"><h1 className="text-2xl font-bold">This page could not open</h1><p className="mt-3">Check your connection and reload the page. If you were submitting a request, check its status before trying again.</p><button className="btn-primary mt-5" onClick={() => window.location.reload()}>Reload page</button></section>;
    return this.props.children;
  }
}
