import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";

export default function MobileNav({ onCreatePost }) {
  const router = useRouter();
  const { user } = useAuth();

  const items = [
    { href: "/", icon: "🏠" },
    { href: "/search", icon: "🔍" },
    { href: "#create", icon: "➕", action: onCreatePost },
    { href: "/notifications", icon: "🔔" },
    { href: user ? `/profile/${user.username}` : "/login", icon: "👤" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex justify-around py-2.5 z-40">
      {items.map((item, i) =>
        item.action ? (
          <button key={i} onClick={item.action} className="text-xl px-3">
            {item.icon}
          </button>
        ) : (
          <Link
            key={i}
            href={item.href}
            className={`text-xl px-3 ${router.pathname === item.href ? "opacity-100" : "opacity-60"}`}
          >
            {item.icon}
          </Link>
        )
      )}
    </nav>
  );
}
