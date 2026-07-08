import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../context/AuthContext";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <ClerkProvider {...pageProps}>
      <AuthProvider>
        <Component {...pageProps} />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: { background: "#1a1a1a", color: "#e5e7eb", border: "1px solid #2a2a2e" },
          }}
        />
      </AuthProvider>
    </ClerkProvider>
  );
}