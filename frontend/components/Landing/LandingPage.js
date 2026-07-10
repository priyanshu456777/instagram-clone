import Link from "next/link";
import {
  Camera,
  Video,
  MessageSquare,
  Compass,
  Bookmark,
  Bell,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import ThemeToggle from "../UI/ThemeToggle";
import PhoneMockup from "./PhoneMockup";

const features = [
  {
    Icon: Camera,
    title: "Share Posts",
    desc: "Post photos and carousels with captions, likes, and comments — just like the real thing.",
  },
  {
    Icon: Sparkles,
    title: "Stories",
    desc: "Share moments that disappear in 24 hours. Tap through your friends' stories in a ring.",
  },
  {
    Icon: Video,
    title: "Reels",
    desc: "Short, scrollable videos with a dedicated feed built for endless discovery.",
  },
  {
    Icon: MessageSquare,
    title: "Direct Messages",
    desc: "Real-time chat with friends, powered by sockets — messages arrive instantly.",
  },
  {
    Icon: Compass,
    title: "Explore",
    desc: "Discover new posts and creators outside your usual feed.",
  },
  {
    Icon: Bookmark,
    title: "Save & Revisit",
    desc: "Bookmark posts you love and find them again anytime in your saved collection.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base text-gray-100 overflow-x-hidden">
      {/* ---------------------------------------------------------------- */}
      {/* Nav */}
      {/* ---------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-surface/70 glass-panel">
        <div
          className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3.5"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.875rem)" }}
        >
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-8 h-8 rounded-xl bg-gradient-premium text-white text-sm font-bold shadow-glow">
              {"</>"}
            </span>
            <span className="font-bold text-lg tracking-tight text-gradient-premium">
              InstaClone
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle size={18} className="w-9 h-9 hover:bg-white/[0.05]" />
            <Link
              href="/login"
              className="hidden sm:inline-block text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 px-3 py-2"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium text-white bg-gradient-premium hover:brightness-110 active:scale-[0.97] transition-all duration-200 px-4 py-2 rounded-xl2 shadow-glow"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Hero */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-radial-glow pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-5 pt-14 pb-16 sm:pt-20 sm:pb-24 grid md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left animate-slideUp">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.06] text-gray-300 mb-5">
              <Sparkles size={13} className="text-accent" />
              Your world, your feed
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] mb-5">
              Share your world,{" "}
              <span className="text-gradient-premium">your way</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-400 max-w-md mx-auto md:mx-0 mb-8">
              Posts, stories, reels, and real-time messaging — all in one clean,
              fast, and beautifully simple app.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 text-white bg-gradient-premium hover:brightness-110 active:scale-[0.98] transition-all duration-200 px-6 py-3 rounded-xl2 text-sm font-semibold shadow-glow"
              >
                Get Started
                <ArrowRight
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 text-gray-200 bg-white/[0.05] hover:bg-white/[0.08] active:scale-[0.98] transition-all duration-200 px-6 py-3 rounded-xl2 text-sm font-semibold border border-white/[0.06]"
              >
                Log in
              </Link>
            </div>
          </div>

          <PhoneMockup />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Features */}
      {/* ---------------------------------------------------------------- */}
      <section className="max-w-6xl mx-auto px-5 py-16 sm:py-20">
        <div className="text-center mb-12 animate-fadeIn">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Everything you'd expect. Nothing you don't.
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            Built with the core features that make sharing feel effortless.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ Icon, title, desc }, i) => (
            <div
              key={title}
              className="group rounded-xl3 p-5 bg-surface/70 glass-panel border border-white/[0.06] hover-lift"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="w-11 h-11 rounded-xl2 grid place-items-center bg-gradient-premium-soft mb-4 group-hover:scale-105 transition-transform duration-200">
                <Icon size={20} className="text-accent" />
              </div>
              <h3 className="font-semibold text-white mb-1.5">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Secondary showcase strip */}
      {/* ---------------------------------------------------------------- */}
      <section className="max-w-6xl mx-auto px-5 py-4 sm:py-8">
        <div className="rounded-xl4 bg-surface/70 glass-panel border border-white/[0.06] px-6 py-10 sm:px-12 sm:py-14 grid md:grid-cols-2 gap-8 items-center overflow-hidden relative">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-gradient-premium-soft blur-3xl pointer-events-none" />
          <div className="relative">
            <span className="grid place-items-center w-11 h-11 rounded-xl2 bg-gradient-premium mb-5 shadow-glow">
              <Bell size={20} className="text-white" />
            </span>
            <h3 className="text-2xl font-bold tracking-tight mb-3">
              Real-time, from the ground up
            </h3>
            <p className="text-gray-400 leading-relaxed mb-6">
              Likes, comments, and messages update instantly with socket-powered
              notifications — no refreshing, ever.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent2 transition-colors duration-200"
            >
              Create your account
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="relative grid grid-cols-2 gap-3">
            {[
              { label: "Notifications", Icon: Bell },
              { label: "Messages", Icon: MessageSquare },
              { label: "Explore", Icon: Compass },
              { label: "Saved", Icon: Bookmark },
            ].map(({ label, Icon }) => (
              <div
                key={label}
                className="rounded-xl2 bg-surface2 border border-white/[0.06] p-4 flex flex-col items-center gap-2 text-center hover-lift"
              >
                <Icon size={18} className="text-accent" />
                <span className="text-xs text-gray-400 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* CTA banner */}
      {/* ---------------------------------------------------------------- */}
      <section className="max-w-6xl mx-auto px-5 py-16 sm:py-20">
        <div className="relative rounded-xl4 overflow-hidden bg-gradient-premium px-6 py-14 sm:px-12 sm:py-16 text-center shadow-glow">
          <div className="absolute inset-0 bg-black/10 pointer-events-none" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
              Ready to join?
            </h2>
            <p className="text-white/85 max-w-md mx-auto mb-8">
              Create an account in seconds and start sharing your world.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-white text-gray-900 hover:brightness-95 active:scale-[0.98] transition-all duration-200 px-7 py-3.5 rounded-xl2 text-sm font-bold"
            >
              Get Started Free
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Footer */}
      {/* ---------------------------------------------------------------- */}
      <footer className="border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-7 h-7 rounded-lg bg-gradient-premium text-white text-xs font-bold">
              {"</>"}
            </span>
            <span className="font-semibold text-sm text-gray-300">InstaClone</span>
          </div>
          <p className="text-xs text-gray-500">
            Built as a learning project. Not affiliated with Instagram.
          </p>
        </div>
      </footer>
    </div>
  );
}