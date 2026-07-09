// frontend/components/Reel/ReelItem.js — NEW FILE.

// Single reel in the vertical full-screen feed.


import { useEffect, useRef, useState, useCallback } from "react";

import {

  Heart,

  MessageCircle,

  Send,

  Volume2,

  VolumeX,

  MoreHorizontal,

  Music,

  Pause,

  Play,

} from "lucide-react";

import Link from "next/link";

import { format } from "timeago.js";

import toast from "react-hot-toast";

import api from "../../lib/api";

import LetterAvatar from "../UI/LetterAvatar";

import { parseCaption } from "../../lib/textParse";


export default function ReelItem({

  reel,

  currentUser,

  isActive,

  onDeleted,

}) {

  const videoRef = useRef(null);

  const viewedRef = useRef(false); // ensure we only POST /view once per mount

  const [muted, setMuted] = useState(true);

  const [paused, setPaused] = useState(false);

  const [showHeart, setShowHeart] = useState(false);

  const [likesCount, setLikesCount] = useState(reel.likesCount ?? reel.likes?.length ?? 0);

  const [isLiked, setIsLiked] = useState(reel.isLiked ?? false);

  const [isFollowing, setIsFollowing] = useState(reel.user?.isFollowing ?? false);

  const [showMenu, setShowMenu] = useState(false);


  const isOwner = currentUser?._id === reel.user?._id;


  // Auto-play / pause based on isActive (parent controls this on scroll).

  useEffect(() => {

    const v = videoRef.current;

    if (!v) return;

    if (isActive) {

      v.muted = muted;

      const playPromise = v.play();

      if (playPromise && typeof playPromise.catch === "function") {

        playPromise.catch(() => {

          // Browser may block autoplay if user hasn't interacted yet.

          // That's fine — the click-to-play fallback handles it.

        });

      }

    } else {

      v.pause();

      v.currentTime = 0;

    }

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [isActive]);


  // Record a single view per user per reel.

  useEffect(() => {

    if (!isActive || viewedRef.current) return;

    viewedRef.current = true;

    api

      .post(`/reels/${reel._id}/view`)

      .catch(() => {

        // view is best-effort — never block UI on this.

      });

  }, [isActive, reel._id]);


  const handleLike = useCallback(async () => {

    const next = !isLiked;

    setIsLiked(next);

    setLikesCount((c) => c + (next ? 1 : -1));

    try {

      const { data } = await api.put(`/reels/${reel._id}/like`);

      setIsLiked(data.isLiked);

      setLikesCount(data.likesCount);

    } catch (err) {

      setIsLiked(!next);

      setLikesCount((c) => c - (next ? 1 : -1));

    }

  }, [isLiked, reel._id]);


  const handleDoubleTap = () => {

    if (!isLiked) handleLike();

    setShowHeart(true);

    setTimeout(() => setShowHeart(false), 900);

  };


  const handleFollow = async () => {

    const next = !isFollowing;

    setIsFollowing(next);

    try {

      await api.post(`/users/${reel.user?._id}/follow`);

    } catch (err) {

      setIsFollowing(!next);

      toast.error("Failed to update follow");

    }

  };


  const handleDelete = async () => {

    if (!confirm("Delete this reel?")) return;

    try {

      await api.delete(`/reels/${reel._id}`);

      toast.success("Reel deleted");

      onDeleted?.(reel._id);

    } catch (err) {

      toast.error("Failed to delete");

    }

  };


  return (

    <section

      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden snap-start"

      onDoubleClick={handleDoubleTap}

    >

      {/* Video */}

      <video

        ref={videoRef}

        src={reel.videoUrl}

        poster={reel.thumbnailUrl || undefined}

        className="w-full max-h-full object-contain"

        loop

        playsInline

        preload="metadata"

        muted={muted}

        onClick={() => {

          const v = videoRef.current;

          if (!v) return;

          if (v.paused) {

            v.play();

            setPaused(false);

          } else {

            v.pause();

            setPaused(true);

          }

        }}

      />


      {/* Heart burst */}

      {showHeart && (

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

          <span className="text-red-500 text-[120px] drop-shadow-2xl animate-ping-once">

            ❤️

          </span>

        </div>

      )}


      {/* Pause indicator */}

      {paused && isActive && (

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

          <div className="bg-black/40 rounded-full p-4">

            <Play size={48} className="text-white" fill="white" />

          </div>

        </div>

      )}


      {/* Right action rail */}

      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5 z-10">

        <div className="flex flex-col items-center">

          <LetterAvatar

            username={reel.user?.username}

            avatar={reel.user?.avatar}

            size={44}

          />

          {!isOwner && (

            <button

              onClick={handleFollow}

              className="mt-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold -translate-y-2 border-2 border-black"

              aria-label="Follow"

            >

              {isFollowing ? "✓" : "+"}

            </button>

          )}

        </div>


        <button

          onClick={handleLike}

          className="flex flex-col items-center"

          aria-label="Like"

        >

          <Heart

            size={32}

            fill={isLiked ? "#ef4444" : "none"}

            className={isLiked ? "text-red-500" : "text-white"}

          />

          <span className="text-white text-xs font-semibold mt-0.5">

            {likesCount || ""}

          </span>

        </button>


        <div className="flex flex-col items-center">

          <MessageCircle size={32} className="text-white" />

          <span className="text-white text-xs font-semibold mt-0.5">

            {reel.commentsCount || ""}

          </span>

        </div>


        <button

          className="flex flex-col items-center"

          aria-label="Share"

          onClick={() => {

            if (typeof navigator !== "undefined" && navigator.share) {

              navigator.share({ url: window.location.href }).catch(() => {});

            } else {

              navigator.clipboard?.writeText(window.location.href);

              toast.success("Link copied!");

            }

          }}

        >

          <Send size={28} className="text-white" />

          <span className="text-white text-xs font-semibold mt-0.5">Share</span>

        </button>


        <button

          onClick={() => setMuted((m) => !m)}

          className="text-white"

          aria-label="Toggle audio"

        >

          {muted ? <VolumeX size={26} /> : <Volume2 size={26} />}

        </button>

      </div>


      {/* Bottom overlay: caption + audio */}

      <div className="absolute left-0 right-16 bottom-4 px-4 z-10">

        <div className="flex items-start gap-2">

          {isOwner && (

            <div className="relative">

              <button

                onClick={() => setShowMenu((s) => !s)}

                className="text-white"

                aria-label="More"

              >

                <MoreHorizontal size={24} />

              </button>

              {showMenu && (

                <div className="absolute bottom-8 left-0 bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden shadow-xl">

                  <button

                    onClick={handleDelete}

                    className="px-4 py-2 text-sm text-red-400 hover:bg-zinc-800 w-full text-left"

                  >

                    Delete

                  </button>

                </div>

              )}

            </div>

          )}


          <div className="flex-1 min-w-0">

            <Link

              href={`/profile/${reel.user?.username}`}

              className="text-white font-semibold text-sm hover:underline"

            >

              {reel.user?.username}

            </Link>

            <p className="text-white text-sm mt-1 line-clamp-2 break-words">

              {parseCaption(reel.caption)}

            </p>

            <div className="flex items-center gap-1 mt-2 text-white/80 text-xs">

              <Music size={12} />

              <span className="truncate">

                {reel.audio || "Original audio"}

              </span>

            </div>

            <p className="text-white/60 text-[11px] mt-1">

              {format(reel.createdAt)}

            </p>

          </div>

        </div>

      </div>


      {/* Top gradient for readability */}

      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

    </section>

  );

}

