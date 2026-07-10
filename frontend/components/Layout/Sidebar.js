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
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-white/[0.06] px-3 py-6 bg-surface/70 glass-panel">
      <div className="flex items-center gap-2.5 px-3 mb-9">
        <span className="grid place-items-center w-8 h-8 rounded-xl bg-gradient-premium text-white text-sm font-bold shadow-glow">
          {"</>"}
        </span>
        <span className="font-bold text-lg tracking-tight text-gradient-premium">
          InstaClone
        </span>
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
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl2 text-sm transition-all duration-200 ${
                active
                  ? "text-white font-medium bg-white/[0.06] shadow-premium"
                  : "text-gray-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-gradient-premium" />
              )}
              <Icon
                size={20}
                strokeWidth={active ? 2.3 : 2}
                className={`transition-transform duration-200 group-hover:scale-110 ${
                  active ? "text-transparent" : ""
                }`}
                style={
                  active
                    ? {
                        stroke: "url(#sidebarIconGradient)",
                      }
                    : undefined
                }
              />
              {item.label}
            </Link>
          );
        })}

        <button
          onClick={onCreatePost}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl2 text-sm text-gray-400 hover:bg-white/[0.04] hover:text-white transition-all duration-200 group"
        >
          <PlusSquare size={20} className="transition-transform duration-200 group-hover:scale-110 group-hover:rotate-90" />
          Create
        </button>

        {user && (
          <Link
            href={`/profile/${user.username}`}
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl2 text-sm transition-all duration-200 ${
              router.asPath.startsWith("/profile/")
                ? "text-white font-medium bg-white/[0.06] shadow-premium"
                : "text-gray-400 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            {router.asPath.startsWith("/profile/") && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-gradient-premium" />
            )}
            <User size={20} />
            Profile
          </Link>
        )}
      </nav>

      {/* SVG gradient definition reused by active nav icons above. */}
      <svg width="0" height="0" className="absolute">
        <linearGradient id="sidebarIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="55%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
      </svg>

      {user ? (
        <div className="border-t border-white/[0.06] pt-4 mt-2 flex items-center gap-3 px-2">
          <div className="rounded-full p-[2px] bg-gradient-premium">
            <div className="rounded-full bg-surface p-[2px]">
              <Avatar src={user.avatar?.url} name={user.name} size={36} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user.username}</p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="text-gray-500 hover:text-like transition-colors duration-200 p-1.5 rounded-lg hover:bg-white/[0.06]"
          >
            <LogOut size={18} />
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          className="text-center bg-gradient-premium hover:brightness-110 active:scale-[0.98] transition-all duration-200 text-white rounded-xl2 py-2.5 text-sm font-medium shadow-glow"
        >
          Log in
        </Link>
      )}
    </aside>
  );
}