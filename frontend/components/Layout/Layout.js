import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Bell } from "lucide-react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import CreatePostModal from "../Post/CreatePostModal";

export default function Layout({ children }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();

  const handleCreated = () => {
    // Simplest reliable way to bring the new post into view immediately,
    // regardless of which page the user created it from.
    if (router.pathname === "/") {
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-screen bg-base text-gray-100 selection:bg-accent/30">
      <Sidebar onCreatePost={() => setShowCreateModal(true)} />

      {/* Mobile-only top bar: houses the Notifications icon top-right, Instagram-style */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 bg-surface/80 glass-panel shadow-premium"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center gap-2 py-2.5">
          <span className="grid place-items-center w-7 h-7 rounded-lg bg-gradient-premium text-white text-xs font-bold shadow-glow">
            {"</>"}
          </span>
          <span className="font-bold text-base tracking-tight text-gradient-premium">
            InstaClone
          </span>
        </div>

        <Link
          href="/notifications"
          aria-label="Notifications"
          className={`grid place-items-center w-9 h-9 rounded-xl transition-all duration-200 active:scale-90 ${
            router.pathname === "/notifications"
              ? "text-white bg-white/[0.08]"
              : "text-gray-300 hover:text-white hover:bg-white/[0.05]"
          }`}
        >
          <Bell
            size={22}
            strokeWidth={router.pathname === "/notifications" ? 2.5 : 2}
            fill={router.pathname === "/notifications" ? "currentColor" : "none"}
          />
        </Link>
      </header>

      <main className="flex-1 min-h-screen pb-20 pt-14 md:pt-0 md:pb-0">{children}</main>

      <MobileNav onCreatePost={() => setShowCreateModal(true)} />

      {showCreateModal && (
        <CreatePostModal onClose={() => setShowCreateModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}