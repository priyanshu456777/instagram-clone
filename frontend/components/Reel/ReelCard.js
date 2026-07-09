import { useEffect, useRef, useState } from "react";

import Link from "next/link";

import { Heart, MessageCircle, Send, Volume2, VolumeX } from "lucide-react";


function Avatar({ src, name }) {

  const colors = ["bg-pink-500", "bg-purple-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-red-500"];

  const initial = String(name || "?").trim().charAt(0).toUpperCase() || "?";

  if (src) {

    return (

      <img

        src={src}

        alt={initial}

        className="w-8 h-8 rounded-full object-cover"

        onError={(e) => { e.currentTarget.style.display = "none"; }}

      />

    );

  }

  return (

    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${colors[(initial.charCodeAt(0) || 0) % colors.length]}`}>

      {initial}

    </div>

  );

}


function renderCaption(text) {

  if (!text) return null;

  const out = [];

  const re = /([#@])([a-zA-Z0-9_.]+)/g;

  let last = 0;

  let m;

  let i = 0;

  while ((m = re.exec(text)) !== null) {

    if (m.index > last) out.push(text.slice(last, m.index));

    const sym = m[1];

    const tag = m[2];

    const href = sym === "#"

      ? `/explore?tag=${encodeURIComponent(tag.toLowerCase())}`

      : `/profile/${encodeURIComponent(tag)}`;

    out.push(

      <Link key={`p${i++}`} href={href} className="font-semibold hover:underline" style={{ color: "#0095f6" }}>

        {sym}{tag}

      </Link>

    );

    last = m.index + m[0].length;

  }

  if (last < text.length) out.push(text.slice(last));

  return out.map((seg, idx) => typeof seg === "string" ? <span key={`s${idx}`}>{seg}</span> : seg);

}


function fmt(n) {

  if (n == null) return "0";

  if (n < 1000) return String(n);

  if (n < 1e6) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";

  return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";

}


/**

 * In-feed reel card — Instagram-style. Quiet by default, no loud banner.

 * Subtle "Reel" tag in header so reviewers can spot it without it screaming.

 */

export default function ReelCard({ reel }) {

  const videoRef = useRef(null);

  const [liked, setLiked] = useState(Boolean(reel.isLiked));

  const [likeCount, setLikeCount] = useState(reel.likesCount ?? reel.likes?.length ?? 0);

  const [muted, setMuted] = useState(true);


  useEffect(() => {

    const node = videoRef.current;

    if (!node) return;

    const io = new IntersectionObserver(

      ([e]) => {

        if (e.isIntersecting && e.intersectionRatio > 0.4) node.play().catch(() => {});

        else node.pause();

      },

      { threshold: [0, 0.4] }

    );

    io.observe(node);

    return () => io.disconnect();

  }, []);


  async function toggleLike(e) {

    e?.preventDefault();

    if (liked) { setLiked(false); setLikeCount((c) => Math.max(0, c - 1)); }

    else { setLiked(true); setLikeCount((c) => c + 1); }

    try {

      await fetch(`/api/reels/${reel._id}/like`, { method: "PUT" });

    } catch (_) {}

  }


  const username = reel.user?.username || reel.username || "user";

  const avatarUrl = reel.user?.avatar?.url || reel.user?.avatar || null;

  const caption = reel.caption || "";

  const videoSrc = reel.videoUrl || reel.video;


  return (

    <article className="border-b border-gray-800 bg-black">

      {/* Header — subtle, no loud banner */}

      <header className="flex items-center gap-3 p-3">

        <Link href={`/profile/${username}`}>

          <Avatar src={avatarUrl} name={username} />

        </Link>

        <div className="flex items-center gap-2">

          <Link href={`/profile/${username}`} className="font-semibold text-sm text-white hover:underline">

            {username}

          </Link>

          {/* Subtle Reel label — small, monochrome */}

          <span className="text-[10px] uppercase tracking-wider text-gray-400 border border-gray-700 px-1.5 py-0.5 rounded">

            Reel

          </span>

        </div>

      </header>


      {/* Video */}

      <div className="relative w-full bg-black" style={{ maxHeight: 640 }}>

        <video

          ref={videoRef}

          src={videoSrc}

          className="w-full max-h-[640px] object-contain mx-auto block"

          loop

          playsInline

          muted={muted}

          onClick={(e) => {

            const node = e.currentTarget;

            if (node.paused) node.play().catch(() => {});

            else node.pause();

          }}

        />

        <button

          onClick={() => setMuted((m) => !m)}

          className="absolute bottom-3 right-3 bg-black/60 rounded-full p-2 text-white hover:bg-black/80"

          aria-label={muted ? "Unmute" : "Mute"}

        >

          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}

        </button>

      </div>


      {/* Actions */}

      <div className="flex items-center gap-4 p-3 text-white">

        <button onClick={toggleLike} className="flex items-center gap-1.5 hover:opacity-80">

          <Heart size={24} className={liked ? "text-red-500" : "text-white"} fill={liked ? "currentColor" : "none"} />

          <span className="text-sm">{fmt(likeCount)}</span>

        </button>

        <Link href="/reels" className="flex items-center gap-1.5 hover:opacity-80">

          <MessageCircle size={24} />

        </Link>

        <button

          onClick={() => {

            const url = `${window.location.origin}/reels#${reel._id}`;

            navigator.clipboard?.writeText(url).catch(() => {});

          }}

          className="ml-auto hover:opacity-80"

        >

          <Send size={24} />

        </button>

      </div>


      {/* Caption */}

      {caption && (

        <p className="px-3 pb-3 text-sm text-white">

          <span className="font-semibold mr-1">{username}</span>

          <span>{renderCaption(caption)}</span>

        </p>

      )}

    </article>

  );

}

