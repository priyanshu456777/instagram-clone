import Link from "next/link";
import { useRouter } from "next/router";
import { Home, Search, PlusSquare, Video, MessageSquare, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function MobileNav({ onCreatePost }) {
  const router = useRouter();
  const { user } = useAuth();

  const items = [
    { href: "/", label: "Home", Icon: Home, fillable: true },
    { href: "/search", label: "Search", Icon: Search },
    { href: "#create", label: "Create", Icon: PlusSquare, action: onCreatePost },
    { href: "/reels", label: "Reels", Icon: Video, fillable: true },
    { href: "/messages", label: "Messages", Icon: MessageSquare, fillable: true },
    { href: user ? `/profile/${user.username}` : "/login", label: "Profile", Icon: User, fillable: true },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/80 glass-panel flex justify-between items-center px-2 py-2 z-40 shadow-premium-lg">
      {items.map((item, i) => {
        const Icon = item.Icon;
        const active = !item.action && router.pathname === item.href;

        if (item.action) {
          return (
            <button
              key={i}
              onClick={item.action}
              aria-label={item.label}
              className="flex-1 flex flex-col items-center py-1.5 text-gray-300 hover:text-white active:scale-90 transition-all duration-150"
            >
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-premium shadow-glow">
                <Icon size={19} strokeWidth={2.3} className="text-white" />
              </span>
            </button>
          );
        }

        return (
          <Link
            key={i}
            href={item.href}
            aria-label={item.label}
            className={`flex-1 flex flex-col items-center py-1.5 transition-all duration-200 active:scale-90 ${
              active ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            <span
              className={`grid place-items-center w-9 h-9 rounded-xl transition-colors duration-200 ${
                active ? "bg-white/[0.08]" : ""
              }`}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 2}
                fill={active && item.fillable ? "currentColor" : "none"}
              />
            </span>
            {active && (
              <span className="w-1 h-1 rounded-full bg-gradient-premium mt-0.5" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}