import { useState } from "react";
import { useRouter } from "next/router";
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
    <div className="flex min-h-screen bg-base text-gray-100">
      <Sidebar onCreatePost={() => setShowCreateModal(true)} />

      <main className="flex-1 min-h-screen pb-16 md:pb-0">{children}</main>

      <MobileNav onCreatePost={() => setShowCreateModal(true)} />

      {showCreateModal && (
        <CreatePostModal onClose={() => setShowCreateModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
