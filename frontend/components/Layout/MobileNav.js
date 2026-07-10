import Link from "next/link";
import { useRouter } from "next/router";
import { Home, Search, PlusSquare, MessageSquare, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function MobileNav({ onCreatePost }) {
  const router = useRouter();
  const { user } = useAuth();

  const items = [
    { href: "/", label: "Home", Icon: Home },
    { href: "/search", label: "Search", Icon: Search },
    { href: "#create", label: "Create", Icon: PlusSquare, action: onCreatePost },
    { href: "/messages", label: "Messages", Icon: MessageSquare },
    { href: user ? `/profile/${user.username}` : "/login", label: "Profile", Icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex justify-around items-center py-2.5 z-40">
      {items.map((item, i) => {
        const Icon = item.Icon;
        const active = !item.action && router.pathname === item.href;

        if (item.action) {
          return (
            <button
              key={i}
              onClick={item.action}
              aria-label={item.label}
              className="flex flex-col items-center px-3 py-1 text-gray-300 hover:text-white transition-colors"
            >
              <Icon size={24} />
            </button>
          );
        }

        return (
          <Link
            key={i}
            href={item.href}
            aria-label={item.label}
            className={`flex flex-col items-center px-3 py-1 transition-colors ${
              active ? "text-accent" : "text-gray-300 hover:text-white"
            }`}
          >
            <Icon size={24} />
          </Link>
        );
      })}
    </nav>
  );
}