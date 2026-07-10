import Link from "next/link";
import { useRouter } from "next/router";
import { Home, Search, PlusSquare, Bell, MessageSquare, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function MobileNav({ onCreatePost }) {
  const router = useRouter();
  const { user } = useAuth();

  const items = [
    { href: "/", label: "Home", Icon: Home, fillable: true },
    { href: "/search", label: "Search", Icon: Search },
    { href: "#create", label: "Create", Icon: PlusSquare, action: onCreatePost },
    { href: "/notifications", label: "Notifications", Icon: Bell, fillable: true },
    { href: "/messages", label: "Messages", Icon: MessageSquare, fillable: true },
    { href: user ? `/profile/${user.username}` : "/login", label: "Profile", Icon: User, fillable: true },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex justify-between items-center px-2 py-2.5 z-40">
      {items.map((item, i) => {
        const Icon = item.Icon;
        const active = !item.action && router.pathname === item.href;

        if (item.action) {
          return (
            <button
              key={i}
              onClick={item.action}
              aria-label={item.label}
              className="flex-1 flex flex-col items-center py-1 text-gray-300 hover:text-white transition-colors"
            >
              <Icon size={22} strokeWidth={2} />
            </button>
          );
        }

        return (
          <Link
            key={i}
            href={item.href}
            aria-label={item.label}
            className={`flex-1 flex flex-col items-center py-1 transition-colors ${
              active ? "text-accent" : "text-gray-300 hover:text-white"
            }`}
          >
            <Icon
              size={22}
              strokeWidth={active ? 2.5 : 2}
              fill={active && item.fillable ? "currentColor" : "none"}
            />
          </Link>
        );
      })}
    </nav>
  );
}