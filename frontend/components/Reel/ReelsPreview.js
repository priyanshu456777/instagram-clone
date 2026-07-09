import { useEffect, useState } from "react";

import Link from "next/link";

import { Film, Volume2, Play } from "lucide-react";


/**

 * Horizontal scroll reels preview strip — drop into home or explore pages.

 * Self-contained: fetches /api/reels, renders clickable thumbnails that

 * navigate to /reels (or fullscreen overlay if you wire it).

 */

export default function ReelsPreview({ title = "Reels", maxItems = 8 }) {

  const [reels, setReels] = useState([]);

  const [loading, setLoading] = useState(true);


  useEffect(() => {

    let cancelled = false;

    (async () => {

      try {

        const res = await fetch(`/api/reels?limit=${maxItems}`);

        const data = await res.json();

        if (!cancelled && data && data.success && Array.isArray(data.reels)) {

          setReels(data.reels.slice(0, maxItems));

        }

      } catch (_) {

        // silent — strip will just be empty

      } finally {

        if (!cancelled) setLoading(false);

      }

    })();

    return () => { cancelled = true; };

  }, [maxItems]);


  if (loading) {

    return (

      <section className="w-full border-b border-border bg-surface/40 py-3 px-4">

        <div className="flex items-center gap-2 mb-2 text-sm font-semibold">

          <Film size={16} className="text-accent" /> {title}

        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">

          {Array.from({ length: 4 }).map((_, i) => (

            <div key={i} className="shrink-0 w-28 h-40 rounded-lg bg-surface2 animate-pulse" />

          ))}

        </div>

      </section>

    );

  }


  if (!reels.length) return null;


  return (

    <section className="w-full border-b border-border bg-surface/40 py-3 px-4">

      <div className="flex items-center justify-between mb-2">

        <div className="flex items-center gap-2 text-sm font-semibold">

          <Film size={16} className="text-accent" /> {title}

        </div>

        <Link href="/reels" className="text-xs text-accent hover:underline">

          See all →

        </Link>

      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">

        {reels.map((r) => {

          const thumb = r.thumbnailUrl || (r.videoUrl ? `${r.videoUrl}#t=0.5` : null);

          const caption = (r.caption || "").trim();

          const username = r.user?.username || "user";

          return (

            <Link

              key={r._id}

              href="/reels"

              className="shrink-0 w-28 group"

              aria-label={`Reel by ${username}`}

            >

              <div className="relative w-28 h-40 rounded-lg overflow-hidden bg-black border border-border group-hover:border-accent transition-colors">

                {thumb ? (

                  <video

                    src={r.videoUrl}

                    poster={thumb.startsWith("http") ? thumb : undefined}

                    className="w-full h-full object-cover"

                    muted

                    playsInline

                    preload="metadata"

                  />

                ) : (

                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">

                    No video

                  </div>

                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

                <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1">

                  <Volume2 size={10} className="text-white" />

                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">

                  <div className="bg-black/50 rounded-full p-3">

                    <Play size={20} className="text-white" fill="white" />

                  </div>

                </div>

              </div>

              <p className="mt-1 text-xs text-gray-200 truncate">{username}</p>

              {caption && (

                <p className="text-[10px] text-gray-400 truncate" title={caption}>{caption}</p>

              )}

            </Link>

          );

        })}

      </div>

    </section>

  );

}

