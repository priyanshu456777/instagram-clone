// frontend/components/Post/PostCard.js — REPLACE existing file.

// Uses LetterAvatar for clean fallback when avatar URL is broken.


import { useState, useRef } from "react";

import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";

import Link from "next/link";

import toast from "react-hot-toast";

import api from "../../lib/api";

import PostCarousel from "./PostCarousel";

import LetterAvatar from "../UI/LetterAvatar";

import { parseCaption } from "../../lib/textParse";


export default function PostCard({ post, currentUser, onPostDeleted }) {

  const [likesCount, setLikesCount] = useState(post.likesCount ?? post.likes?.length ?? 0);

  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);

  const [saved, setSaved] = useState(post.isSaved ?? false);

  const [showHeart, setShowHeart] = useState(false);

  const [commentText, setCommentText] = useState("");

  const [commentsCount, setCommentsCount] = useState(post.commentsCount ?? 0);

  const likeTimer = useRef(null);


  const handleLikeToggle = async () => {

    if (likeTimer.current) return;

    const nextLiked = !isLiked;

    setIsLiked(nextLiked);

    setLikesCount((c) => c + (nextLiked ? 1 : -1));


    likeTimer.current = setTimeout(async () => {

      try {

        const { data } = await api.put(`/posts/${post._id}/like`);

        setIsLiked(data.isLiked);

        setLikesCount(data.likesCount);

      } catch (err) {

        setIsLiked(!nextLiked);

        setLikesCount((c) => c - (nextLiked ? 1 : -1));

        toast.error("Failed to update like");

      } finally {

        likeTimer.current = null;

      }

    }, 300);

  };


  const handleSave = async () => {

    const next = !saved;

    setSaved(next); // optimistic

    try {

      const { data } = await api.put(`/posts/${post._id}/save`);

      // Sync with server response — backend may flip differently

      setSaved(data.isSaved);

      toast.success(data.isSaved ? "Post saved" : "Removed from saved");

    } catch (err) {

      setSaved(!next); // rollback

      toast.error(err.response?.data?.message || "Failed to save post");

    }

  };


  const handleDoubleTap = () => {

    if (!isLiked) handleLikeToggle();

    setShowHeart(true);

    setTimeout(() => setShowHeart(false), 1000);

  };


  const handleComment = async (e) => {

    e.preventDefault();

    if (!commentText.trim()) return;

    try {

      await api.post(`/posts/${post._id}/comments`, { text: commentText });

      setCommentsCount((c) => c + 1);

      setCommentText("");

    } catch (err) {

      toast.error("Failed to add comment");

    }

  };


  const handleDelete = async () => {

    if (!confirm("Delete this post?")) return;

    try {

      await api.delete(`/posts/${post._id}`);

      toast.success("Post deleted");

      onPostDeleted?.(post._id);

    } catch (err) {

      toast.error("Failed to delete");

    }

  };


  const isOwner = currentUser?._id === post.user?._id;


  return (

    <article className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-4 max-w-[600px] mx-auto w-full">

      {/* Header */}

      <header className="flex items-center justify-between px-4 py-3">

        <Link

          href={`/profile/${post.user?.username}`}

          className="flex items-center gap-3 hover:opacity-80 transition-opacity"

        >

          <LetterAvatar

            username={post.user?.username}

            avatar={post.user?.avatar}

            size={36}

          />

          <div className="flex flex-col">

            <span className="text-sm font-semibold text-white flex items-center gap-1">

              {post.user?.username}

              {post.user?.isVerified && <span className="text-blue-400 text-xs">✓</span>}

            </span>

            {post.location && (

              <span className="text-xs text-zinc-400">{post.location}</span>

            )}

          </div>

        </Link>


        {isOwner && (

          <button

            onClick={handleDelete}

            className="text-zinc-400 hover:text-red-400 transition-colors"

            aria-label="Delete"

          >

            <MoreHorizontal size={20} />

          </button>

        )}

      </header>


      {/* Carousel — bounded container */}

      <div className="relative w-full bg-black">

        <PostCarousel

          images={post.images || (post.image ? [post.image] : [])}

          onDoubleTap={handleDoubleTap}

        />

        {showHeart && <div className="heart-burst-overlay">❤️</div>}

      </div>


      {/* Actions */}

      <div className="px-4 py-3">

        <div className="flex items-center justify-between mb-2">

          <div className="flex items-center gap-4">

            <button

              onClick={handleLikeToggle}

              className={`transition-colors ${

                isLiked ? "text-red-500" : "text-white hover:text-zinc-400"

              }`}

              aria-label="Like"

            >

              <Heart

                size={24}

                fill={isLiked ? "currentColor" : "none"}

                className={isLiked ? "like-animation" : ""}

              />

            </button>

            <button className="text-white hover:text-zinc-400" aria-label="Comment">

              <MessageCircle size={24} />

            </button>

            <button className="text-white hover:text-zinc-400" aria-label="Share">

              <Send size={24} />

            </button>

          </div>

          <button

            onClick={handleSave}

            className={saved ? "text-white" : "text-white hover:text-zinc-400"}

            aria-label="Save"

          >

            <Bookmark size={24} fill={saved ? "currentColor" : "none"} />

          </button>

        </div>


        {likesCount > 0 && (

          <p className="text-sm font-semibold text-white mb-1">

            {likesCount.toLocaleString()} {likesCount === 1 ? "like" : "likes"}

          </p>

        )}


        {post.caption && (

          <p className="text-sm text-white whitespace-pre-wrap break-words">

            <Link

              href={`/profile/${post.user?.username}`}

              className="font-semibold mr-1"

            >

              {post.user?.username}

            </Link>

            <span>{parseCaption(post.caption)}</span>

          </p>

        )}


        {commentsCount > 0 && (

          <button className="text-sm text-zinc-400 mt-2 hover:text-zinc-300">

            View all {commentsCount} {commentsCount === 1 ? "comment" : "comments"}

          </button>

        )}


        <form

          onSubmit={handleComment}

          className="mt-3 flex items-center gap-2 border-t border-zinc-800 pt-3"

        >

          <input

            type="text"

            value={commentText}

            onChange={(e) => setCommentText(e.target.value)}

            placeholder="Add a comment..."

            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"

          />

          <button

            type="submit"

            disabled={!commentText.trim()}

            className="text-blue-500 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"

          >

            Post

          </button>

        </form>

      </div>

    </article>

  );

}

