export default function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[320px] animate-scaleIn">
      {/* Ambient glow behind the phone */}
      <div className="absolute inset-0 bg-gradient-radial-glow blur-3xl scale-125 -z-10" />

      {/* Phone frame */}
      <div className="relative rounded-[2.5rem] p-3 bg-surface2 border border-border shadow-premium-lg">
        <div className="rounded-[2rem] overflow-hidden bg-surface border border-border">
          {/* Notch */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-20 h-4 rounded-full bg-base" />
          </div>

          {/* Fake app top bar */}
          <div className="flex items-center justify-between px-4 py-2">
            <span className="font-bold text-xs tracking-tight text-gradient-premium">InstaClone</span>
            <div className="flex gap-2">
              <div className="w-4 h-4 rounded-full bg-white/[0.08]" />
              <div className="w-4 h-4 rounded-full bg-white/[0.08]" />
            </div>
          </div>

          {/* Story ring row */}
          <div className="flex gap-2 px-4 py-3 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="story-ring w-10 h-10 rounded-full p-[2px] shrink-0">
                <div className="w-full h-full rounded-full bg-surface2" />
              </div>
            ))}
          </div>

          {/* Fake post card */}
          <div className="px-3 pb-3">
            <div className="rounded-xl2 overflow-hidden border border-border bg-surface2">
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-gradient-premium" />
                <div className="h-2 w-16 rounded-full bg-white/[0.1]" />
              </div>
              <div className="aspect-square bg-gradient-premium-soft" />
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div className="w-4 h-4 rounded-full bg-like/70" />
                <div className="w-4 h-4 rounded-full bg-white/[0.15]" />
                <div className="w-4 h-4 rounded-full bg-white/[0.15]" />
              </div>
              <div className="px-3 pb-3 space-y-1.5">
                <div className="h-2 w-24 rounded-full bg-white/[0.1]" />
                <div className="h-2 w-32 rounded-full bg-white/[0.06]" />
              </div>
            </div>
          </div>

          {/* Fake bottom nav */}
          <div className="flex items-center justify-around py-3 border-t border-border">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-md ${i === 0 ? "bg-gradient-premium" : "bg-white/[0.12]"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}