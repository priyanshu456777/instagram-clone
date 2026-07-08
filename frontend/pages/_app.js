import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../context/AuthContext";
import ErrorBoundary from "../components/UI/ErrorBoundary";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <ClerkProvider>
      <ErrorBoundary>
        <AuthProvider>
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#1f1f23",
                color: "#e5e7eb",
                border: "1px solid #2a2a2e",
              },
            }}
          />
          <ErrorBoundary>
            <Component {...pageProps} />
          </ErrorBoundary>
        </AuthProvider>
      </ErrorBoundary>
    </ClerkProvider>
  );
}