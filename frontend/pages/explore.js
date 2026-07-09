import { useEffect, useState } from "react";

import Layout from "../components/Layout/Layout";

import Link from "next/link";

import { useRouter } from "next/router";

import { Film, Hash, X, Volume2, VolumeX } from "lucide-react";

import api from "../lib/api";


/* ---------- Avatar (inline, no external dep) ---------- */

function Avatar({ src, name, size = 28 }) {

  const colors = ["bg-pink-500", "bg-purple-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-red-500"];

  const initial = String(name || "?").trim().charAt(0).toUpperCase() || "?";

  if (src) {

    return (

      <img

        src={src}

        alt={initial}

        style={{ width: size, height: size }}

        className="rounded-full object-cover"

        onError={(e) => { e.currentTarget.style.display = "none"; }}

      />

    );

  }

  return (

    <div

      className={`rounded-full flex items-center justify-center text-white font-semibold ${colors[(initial.charCodeAt(0) || 0) % colors.length]}`}

      style={{ width: size, height: size, fontSize: size * 0.42 }}

    >

      {initial}

    </div>

  );

}


/* ---------- Reel strip (inline) ---------- */

function ReelStrip({ reels }) {

  if (!reels || !reels.length) return null;

  return (

    <section className="mb-6">

      <div className="flex items-center gap-2 mb-3 px-1">

        <Film size={18} className="text-accent" />

        <h2 className="font-semibold text-base">Reels</h2>

        <Link href="/reels" className="ml-auto text-xs text-accent hover:underline">

          See all →

        </Link>

      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">

        {reels.map((r) => {

          const username = r.user?.username || "user";

          const caption = (r.caption || "").trim();

          return (

            <Link

              key={r._id}

              href="/reels"

              className="shrink-0 w-28 group"

            >

              <div className="relative w-28 h-40 rounded-lg overflow-hidden bg-black border border-gray-800 group-hover:border-accent transition-colors">

                <video

                  src={r.videoUrl || r.video}

                  className="w-full h-full object-cover"

                  muted

                  playsInline

                  preload="metadata"

                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

                <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1">

                  <Volume2 size={10} className="text-white" />

                </div>

                <div className="absolute bottom-1.5 left-1.5 text-[10px] text-white/90 line-clamp-2">

                  {caption}

                </div>

              </div>

              <p className="mt-1 text-xs text-gray-300 truncate">{username}</p>

            </Link>

          );

        })}

      </div>

    </section>

  );

}


/* ---------- Main ---------- */

export default function Explore() {

  const router = useRouter();

  const initialTag = (router.query.tag || "").toString().toLowerCase();

  const [tag, setTag] = useState(initialTag);

  const [posts, setPosts] = useState([]);

  const [reels, setReels] = useState([]);

  const [loading, setLoading] = useState(false);

  const [reelsError, setReelsError] = useState(null);


  // sync tag from URL (?tag=chai) -> state

  useEffect(() => {

    if (router.query.tag !== undefined) {

      setTag(router.query.tag.toString().toLowerCase());

    }

  }, [router.query.tag]);


  // Fetch posts (hashtag or explore)

  useEffect(() => {

    setLoading(true);

    (async () => {

      try {

        const url = tag

          ? `/posts/hashtag/${encodeURIComponent(tag)}`

          : `/posts/explore`;

        const { data } = await api.get(url);

        setPosts(data?.posts || []);

      } catch (_) {

        setPosts([]);

      } finally {

        setLoading(false);

      }

    })();

  }, [tag]);


  // Fetch reels ONCE on mount + tag change (always — reels ignore hashtag filter)

  useEffect(() => {

    (async () => {

      try {

        const { data } = await api.get(`/reels?limit=10`);

        setReels(Array.isArray(data?.reels) ? data.reels : []);

        setReelsError(null);

      } catch (err) {

        setReelsError(err?.message || "Failed to load reels");

        setReels([]);

      }

    })();

  }, []);


  return (

    <Layout>

      <div className="max-w-4xl mx-auto px-4 py-4">

        <h1 className="text-2xl font-bold mb-4">Explore</h1>


        {/* Hashtag search */}

        <form

          onSubmit={(e) => {

            e.preventDefault();

            const next = (e.target.tag?.value || "").trim().toLowerCase().replace(/^#/, "");

            setTag(next);

          }}

          className="flex gap-2 mb-4"

        >

          <div className="flex-1 relative">

            <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

            <input

              name="tag"

              defaultValue={tag}

              placeholder="Search #hashtag"

              className="w-full bg-surface2 rounded pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"

            />

          </div>

          <button

            type="submit"

            className="bg-accent hover:bg-accentSoft text-white px-4 py-2 rounded text-sm font-medium"

          >

            Search

          </button>

        </form>


        {/* Active tag indicator */}

        {tag && (

          <div className="flex items-center gap-2 mb-4 text-sm">

            <span className="text-gray-400">Showing</span>

            <span className="bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">

              #{tag}

            </span>

            <button

              onClick={() => setTag("")}

              className="text-gray-400 hover:text-white"

              aria-label="Clear tag"

            >

              <X size={14} />

            </button>

          </div>

        )}


        {/* ✅ REELS STRIP — always shown at top when reels exist */}

        {reels.length > 0 ? (

          <ReelStrip reels={reels} />

        ) : (

          <div className="mb-6 text-xs text-gray-500 italic">

            {reelsError ? `Reels failed to load: ${reelsError}` : "No reels yet"}

          </div>

        )}


        {/* Posts grid */}

        {loading ? (

          <div className="grid grid-cols-3 gap-1">

            {Array.from({ length: 9 }).map((_, i) => (

              <div key={i} className="aspect-square bg-surface2 animate-pulse" />

            ))}

          </div>

        ) : posts.length === 0 ? (

          <div className="flex flex-col items-center justify-center py-16 text-gray-500">

            <span className="text-5xl mb-3">🔍</span>

            <p className="text-sm">

              {tag

                ? `No posts tagged #${tag}`

                : "No posts to explore yet. Check back soon!"}

            </p>

          </div>

        ) : (

          <div className="grid grid-cols-3 gap-1">

            {posts.map((p) => {

              const src = p.images?.[0]?.url || p.image?.url || p.imageUrl;

              return (

                <Link

                  key={p._id}

                  href={`/profile/${p.user?.username || "user"}`}

                  className="aspect-square bg-surface2 overflow-hidden relative group"

                >

                  {src ? (

                    <img

                      src={src}

                      alt={p.caption || ""}

                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"

                    />

                  ) : (

                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">

                      no image

                    </div>

                  )}

                  {Array.isArray(p.images) && p.images.length > 1 && (

                    <div className="absolute top-2 right-2 text-white text-xs">⧉</div>

                  )}

                </Link>

              );

            })}

          </div>

        )}

      </div>

    </Layout>

  );

}

