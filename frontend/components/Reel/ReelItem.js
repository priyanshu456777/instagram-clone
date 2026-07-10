import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Heart, MessageCircle, Send, Trash2, Volume2, VolumeX } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";

/* === Avatar === */
function SimpleAvatar({ src, name, size = 36 }) {
  const colors = ["bg-pink-500", "bg-purple-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-red-500"];
  const initial = String(name || "?").trim().charAt(0).toUpperCase() || "?";
  if (src) {
    return (
      <img
        src={src}
        alt={initial}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }}
        onError={(e) => { e.target.style.display = "none"; e.target.nextElementSibling?.style.setProperty("display", "flex"); }}
        className="border border-white/10"
      />
    );
  }
  return (
    <div
      className={`items-center justify-center text-white font-semibold rounded-full ${colors[(initial.charCodeAt(0) || 0) % colors.length]}`}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.floor(size * 0.42)), lineHeight: 1, display: "flex" }}
    >
      {initial}
    </div>
  );
}

/* === Caption parser — handles #hashtags and @mentions INLINE === */
function renderCaption(text) {
  if (!text) return null;
  const out = [];
  let last = 0;
  const re = /([#@])([a-zA-Z0-9_.]+)/g;
  let m;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const sym = m[1];
    const tag = m[2];
    const isHash = sym === "#";
    const href = isHash ? `/explore?tag=${encodeURIComponent(tag.toLowerCase())}` : `/profile/${encodeURIComponent(tag)}`;
    out.push(
      <Link key={`t${i++}`} href={href} className="font-semibold hover:underline" style={{ color: "#0095f6" }}>
        {sym}{tag}
      </Link>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.map((seg, idx) => (typeof seg === "string" ? <span key={`s${idx}`}>{seg}</span> : seg));
}

function fmt(n) {
  if (n == null) return "0";
  if (n < 1000) return String(n);
  if (n < 1e6) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
}

export default function ReelItem({ reel, currentUser, isActive, onDeleted }) {
  const router = useRouter();
  const authUser = currentUser;
  const videoRef = useRef(null);

  const [liked, setLiked] = useState(Boolean(reel.isLiked));
  const [likeCount, setLikeCount] = useState(reel.likesCount ?? reel.likes?.length ?? 0);
  const [following, setFollowing] = useState(Boolean(reel.isFollowing));
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentCount, setCommentCount] = useState(reel.commentsCount ?? reel.comments?.length ?? 0);

  const captionRendered = useMemo(() => renderCaption(reel.caption || ""), [reel.caption]);

  /* autoplay driven by isActive (from parent's IntersectionObserver over the scroll list) */
  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    if (isActive) {
      node.play().catch(() => {});
      setPaused(false);
    } else {
      node.pause();
      node.currentTime = 0;
    }
  }, [isActive]);

  useEffect(() => {
    if (showComments) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [showComments]);

  /* load real comments from backend the first time the panel opens */
  useEffect(() => {
    if (!showComments || commentsLoaded) return;
    let cancelled = false;
    setCommentsLoading(true);
    api.get(`/reels/${reel._id}/comments`)
      .then(({ data }) => {
        if (cancelled) return;
        setComments(data.comments || []);
        setCommentCount((data.comments || []).length);
        setCommentsLoaded(true);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err.message || "Failed to load comments");
      })
      .finally(() => { if (!cancelled) setCommentsLoading(false); });
    return () => { cancelled = true; };
  }, [showComments, commentsLoaded, reel._id]);

  /* === LIKE === */
  async function handleLike() {
    if (!authUser) return router.push("/login");
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    try {
      const { data } = await api.put(`/reels/${reel._id}/like`);
      if (typeof data.isLiked === "boolean") setLiked(data.isLiked);
      if (typeof data.likesCount === "number") setLikeCount(data.likesCount);
    } catch (err) {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
      toast.error(err.message || "Like failed");
    }
  }

  /* === FOLLOW === */
  async function handleFollow() {
    if (!authUser) return router.push("/login");
    const ownerId = reel.user?._id || reel.userId;
    if (!ownerId) return;
    const was = following;
    setFollowing(!was);
    try {
      const { data } = await api.put(`/users/${ownerId}/follow`);
      if (typeof data.isFollowing === "boolean") setFollowing(data.isFollowing);
    } catch (err) {
      setFollowing(was);
      toast.error(err.message || "Follow failed");
    }
  }

  /* === COMMENT — real backend call, no localStorage === */
  async function submitComment(e) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || submitting) return;
    if (!authUser) { toast.error("Please log in"); return router.push("/login"); }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/reels/${reel._id}/comments`, { text });
      setComments((prev) => [data.comment, ...prev]);
      setCommentCount(typeof data.commentsCount === "number" ? data.commentsCount : (c) => c + 1);
      setCommentText("");
    } catch (err) {
      toast.error(err.message || "Comment failed");
    } finally {
      setSubmitting(false);
    }
  }

  /* === DELETE (owner only) === */
  async function handleDelete() {
    if (deleting) return;
    if (!window.confirm("Delete this reel? This can't be undone.")) return;
    setDeleting(true);
    try {
      await api.delete(`/reels/${reel._id}`);
      toast.success("Reel deleted");
      onDeleted?.(reel._id);
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  function togglePlay() {
    const node = videoRef.current;
    if (!node) return;
    if (node.paused) { node.play(); setPaused(false); } else { node.pause(); setPaused(true); }
  }

  const reelUser = reel.user || {};
  const username = reelUser.username || reel.username || "user";
  const avatarUrl = reelUser.avatar?.url || reelUser.avatar || null;
  const displayName = reelUser.name || reelUser.fullName || username;
  const ownerId = reelUser._id || reel.userId || reel.ownerId;
  const isOwnReel = authUser && String(authUser._id) === String(ownerId);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center snap-start">
      <video
        ref={videoRef}
        src={reel.videoUrl || reel.video}
        poster={reel.thumbnailUrl}
        className="w-full h-full object-contain"
        loop
        playsInline
        muted={muted}
        onClick={togglePlay}
      />

      <button
        onClick={() => setMuted((m) => !m)}
        className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white"
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {paused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-black/40 flex items-center justify-center text-white text-3xl">▶</div>
        </div>
      )}

      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 text-white">
        <button onClick={handleLike} className="flex flex-col items-center">
          <Heart size={32} className={liked ? "text-red-500" : "text-white"} fill={liked ? "currentColor" : "none"} />
          <span className="text-xs mt-1">{fmt(likeCount)}</span>
        </button>
        <button onClick={() => setShowComments(true)} className="flex flex-col items-center">
          <MessageCircle size={32} />
          <span className="text-xs mt-1">{commentCount > 0 ? fmt(commentCount) : "Comment"}</span>
        </button>
        <button
          onClick={() => {
            const url = `${window.location.origin}/reels#${reel._id}`;
            navigator.clipboard?.writeText(url).then(() => toast.success("Link copied")).catch(() => toast("Share: " + url));
          }}
          className="flex flex-col items-center"
        >
          <Send size={28} />
          <span className="text-xs mt-1">Share</span>
        </button>
        {isOwnReel && (
          <button onClick={handleDelete} disabled={deleting} className="flex flex-col items-center disabled:opacity-50">
            <Trash2 size={28} />
            <span className="text-xs mt-1">Delete</span>
          </button>
        )}
      </div>

      {/* BOTTOM — caption with BLUE LINKS for # and @ */}
      <div className="absolute left-3 right-20 bottom-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Link href={`/profile/${username}`}>
            <span className="inline-block">
              <SimpleAvatar src={avatarUrl} name={displayName} size={36} />
            </span>
          </Link>
          <Link href={`/profile/${username}`} className="font-semibold text-sm">{username}</Link>
          {!isOwnReel && (
            <button
              onClick={handleFollow}
              className={`text-xs px-3 py-1 rounded border ${following ? "border-white/60 text-white hover:bg-white/10" : "border-white text-white hover:bg-white hover:text-black"}`}
            >
              {following ? "Following" : "Follow"}
            </button>
          )}
        </div>
        <p className="text-sm leading-snug line-clamp-3">{captionRendered}</p>
      </div>

      {/* Comments panel */}
      {showComments && (
        <div className="absolute inset-0 z-30 bg-black/70 flex" onClick={() => setShowComments(false)}>
          <div className="ml-auto w-full max-w-md h-full bg-surface flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="font-semibold">Comments <span className="text-gray-400 text-sm">({commentCount})</span></h3>
              <button onClick={() => setShowComments(false)}>✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
              {commentsLoading ? (
                <p className="text-gray-400 text-sm text-center mt-6">Loading…</p>
              ) : comments.length === 0 ? (
                <p className="text-gray-400 text-sm text-center mt-6">No comments yet. Be first!</p>
              ) : (
                comments.map((c) => (
                  <div key={c._id} className="flex gap-2">
                    <SimpleAvatar src={c.user?.avatar?.url || c.user?.avatar} name={c.user?.username || "User"} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-semibold mr-1">{c.user?.username || "user"}</span>
                        <span className="text-gray-200">{c.text}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{new Date(c.createdAt || Date.now()).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={submitComment} className="border-t border-border p-3 flex gap-2">
              <SimpleAvatar src={authUser?.avatar?.url} name={authUser?.username || "Me"} size={32} />
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment…"
                maxLength={500}
                className="flex-1 bg-surface2 rounded-full px-4 py-2 text-sm outline-none"
              />
              <button type="submit" disabled={!commentText.trim() || submitting} className="text-accent font-semibold text-sm disabled:opacity-50">
                Post
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}