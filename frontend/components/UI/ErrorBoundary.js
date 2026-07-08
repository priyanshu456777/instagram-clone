import { Component } from "react";
import Link from "next/link";

/**
 * ErrorBoundary — catches uncaught React render errors anywhere in its tree
 * and shows a friendly fallback UI instead of letting the entire app crash.
 *
 * Usage: wrap any section in <ErrorBoundary>{children}</ErrorBoundary>.
 * For the whole app, wrap inside <Component /> in _app.js.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console — in production you'd send this to Sentry / LogRocket etc.
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Force a full reload if the user wants a clean slate.
    if (this.props.resetOnRetry) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if the consumer provided one.
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <span className="text-6xl mb-4">😵</span>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-4 max-w-md">
            {this.state.error?.message ||
              "An unexpected error happened. Try refreshing the page."}
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try again
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Go home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}