import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format } from "timeago.js";
import toast from "react-hot-toast";
import { Heart, MessageCircle, Bookmark, Send } from "lucide-react";
import api from "../../lib/api";
import { getSocket } from "../../lib/socket";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../UI/Avatar";
import PostCarousel from "./PostCarousel";
import { CaptionText } from "../../lib/textParse";
import CommentSection from "./CommentSection";

export default function PostCard({ post }) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(
    post.likesCount ?? post.likes?.length ?? 0
  );
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [liking, setLiking] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Backward-compat: backend may still return `image` (singular) for old posts.
  // Use `images` array if present, otherwise fall back to a one-element array.
  const images =
    post.images && post.images.length > 0
      ? post.images
      : post.image
      ? [post.image]
      : [];

  useEffect(() => {
    const socket = getSocket();
    socket.emit("joinPost", post._id);

    const handleLikeUpdate = (payload) => {
      if (payload.postId === post._id) setLikesCount(payload.likesCount);
    };

    socket.on("likeUpdate", handleLikeUpdate);
    return () => {
      socket.emit("leavePost", post._id);
      socket.off("likeUpdate", handleLikeUpdate);
    };
  }, [post._id]);

  const handleLike = async () => {
    if (!user) {
      toast.error("Please log in to like posts");
      return;
    }
    if (liking) return;

    setLiking(true);
    const prevLiked = isLiked;
    // OPTIMISTIC UI — flip the state immediately, rollback on error.
    setIsLiked(!prevLiked);
    setLikesCount((c) => (prevLiked ? c - 1 : c + 1));

    try {
      const { data } = await api.put(`/posts/${post._id}/like`);
      // Reconcile with server's authoritative count.
      setIsLiked(data.isLiked);
      setLikesCount(data.likesCount);
    } catch (err) {
      // Rollback on failure.
      setIsLiked(prevLiked);
      setLikesCount((c) => (prevLiked ? c + 1 : c - 1));
      toast.error(err.message);
    } finally {
      setLiking(false);
    }
  };

  const handleCommentsCountChange = useCallback((count) => {
    setCommentsCount(count);
  }, []);

  const handleSaveToggle = async () => {
    if (!user) {
      toast.error("Please log in to save posts");
      return;
    }
    if (saving) return;

    setSaving(true);
    const prev = isSaved;
    // Optimistic — flip now, rollback if server fails.
    setIsSaved(!prev);

    try {
      const { data } = await api.put(`/users/save/${post._id}`);
      setIsSaved(data.isSaved);
    } catch (err) {
      setIsSaved(prev);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border rounded-lg mb-4 group">
      {/* Header */}
      <div className="flex items-center p-4">
        <Link href={`/profile/${post.user?.username}`}>
          <Avatar src={post.user?.avatar?.url || post.user?.avatar} size="md" />
        </Link>
        <div className="ml-3 flex-1 min-w-0">
          <Link
            href={`/profile/${post.user?.username}`}
            className="font-semibold hover:underline"
          >
            {post.user?.username}
          </Link>
          {post.location && (
            <p className="text-sm text-gray-500 truncate">{post.location}</p>
          )}
        </div>
      </div>

      {/* Image / carousel — supports multi-image posts */}
      <PostCarousel images={images} alt={post.caption || "Post image"} />

      {/* Action bar */}
      <div className="p-4">
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={handleLike}
            className={`p-2 hover:bg-gray-100 rounded-full transition-transform active:scale-125 ${
              isLiked ? "text-red-500" : ""
            }`}
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            <Heart className={isLiked ? "fill-current" : ""} />
          </button>
          <button
            onClick={() => setShowComments((s) => !s)}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Comments"
          >
            <MessageCircle />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full" aria-label="Share">
            <Send />
          </button>
          <button
            onClick={handleSaveToggle}
            className={`ml-auto p-2 hover:bg-gray-100 rounded-full ${
              isSaved ? "text-blue-500" : ""
            }`}
            aria-label={isSaved ? "Unsave" : "Save"}
          >
            <Bookmark className={isSaved ? "fill-current" : ""} />
          </button>
        </div>

        <p className="font-semibold mb-2">{likesCount.toLocaleString()} likes</p>

        {/* Caption with clickable hashtags + mentions */}
        {post.caption && (
          <p className="mb-2">
            <Link
              href={`/profile/${post.user?.username}`}
              className="font-semibold mr-2 hover:underline"
            >
              {post.user?.username}
            </Link>
            <CaptionText text={post.caption} />
          </p>
        )}

        <button
          onClick={() => setShowComments((s) => !s)}
          className="px-4 pt-1 text-sm text-gray-500 hover:text-gray-300"
        >
          {commentsCount > 0
            ? `View all ${commentsCount} comments`
            : "Add a comment"}
        </button>

        <p className="px-4 pt-1 text-xs text-gray-400">{format(post.createdAt)}</p>

        {showComments && (
          <CommentSection
            postId={post._id}
            onCommentsCountChange={handleCommentsCountChange}
          />
        )}
      </div>
    </div>
  );
}