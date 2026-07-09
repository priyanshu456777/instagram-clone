import Link from "next/link";
import { useRouter } from "next/router";
import {
  Home,
  Compass,
  Search,
  Bell,
  MessageSquare,
  Bookmark,
  PlusSquare,
  User,
  LogOut,
  Video,        // ← ADDED (lucide-react mein hai)
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../UI/Avatar";

const navItems = [
  { label: "Home", href: "/", Icon: Home },
  { label: "Explore", href: "/explore", Icon: Compass },
  { label: "Search", href: "/search", Icon: Search },
  { label: "Notifications", href: "/notifications", Icon: Bell },
  { label: "Messages", href: "/messages", Icon: MessageSquare },
  { label: "Saved", href: "/saved", Icon: Bookmark },
  { label: "Reels", href: "/reels", Icon: Video },   // ← ab Video defined hai
];

export default function Sidebar({ onCreatePost }) {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen sticky top-0 border-r border-border px-4 py-6 bg-surface">
      <div className="flex items-center gap-2 px-2 mb-8">
        <span className="text-accent text-xl">{"</>"}</span>
        <span className="font-bold text-lg tracking-wide">InstaClone</span>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? router.pathname === "/" || router.pathname === "/index"
              : router.pathname === item.href ||
                router.asPath.startsWith(item.href);
          const Icon = item.Icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-surface2 text-accent font-medium"
                  : "text-gray-300 hover:bg-surface2 hover:text-white"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={onCreatePost}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-surface2 hover:text-white transition-colors"
        >
          <PlusSquare size={20} /> Create
        </button>
        {user && (
          <Link
            href={`/profile/${user.username}`}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              router.asPath.startsWith("/profile/")
                ? "bg-surface2 text-accent font-medium"
                : "text-gray-300 hover:bg-surface2 hover:text-white"
            }`}
          >
            <User size={20} /> Profile
          </Link>
        )}
      </nav>
      {user ? (
        <div className="border-t border-border pt-4 flex items-center gap-3 px-2">
          <Avatar src={user.avatar?.url} name={user.name} size={36} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user.username}</p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="text-gray-400 hover:text-red-400 text-sm"
          >
            <LogOut size={18} />
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          className="text-center bg-accent hover:bg-accentSoft transition-colors text-white rounded-lg py-2 text-sm font-medium"
        >
          Log in
        </Link>
      )}
    </aside>
  );
}