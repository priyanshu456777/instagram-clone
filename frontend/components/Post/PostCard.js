import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format } from "timeago.js";
import toast from "react-hot-toast";
import { Heart, MessageCircle, Bookmark, Send } from "lucide-react";
import api from "../../lib/api";
import { getSocket } from "../../lib/socket";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../UI/Avatar";
import CommentSection from "./CommentSection";

export default function PostCard({ post }) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount ?? post.likes?.length ?? 0);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [liking, setLiking] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

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
    setIsLiked(!prevLiked);
    setLikesCount((c) => (prevLiked ? c - 1 : c + 1));

    try {
      const { data } = await api.put(`/posts/${post._id}/like`);
      setIsLiked(data.isLiked);
      setLikesCount(data.likesCount);
    } catch (err) {
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
    <div className="bg-surface border border-border rounded-xl2 overflow-hidden mb-6">
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar src={post.user?.avatar?.url} name={post.user?.name} size={36} />
        <div className="min-w-0">
          <Link href={`/profile/${post.user?.username}`} className="font-medium text-sm hover:underline">
            {post.user?.username}
          </Link>
          <p className="text-xs text-gray-500 truncate">{post.user?.location || ""}</p>
        </div>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={post.image?.url} alt={post.caption || "post"} className="w-full max-h-[600px] object-cover" />

      <div className="px-4 pt-3 flex items-center gap-4">
        <button onClick={handleLike} className="transition-transform active:scale-90">
          <Heart
            size={24}
            className={isLiked ? "fill-red-500 text-red-500" : "text-gray-300"}
          />
        </button>
        <button onClick={() => setShowComments((s) => !s)}>
          <MessageCircle size={24} className="text-gray-300" />
        </button>
        <button className="text-gray-300">
          <Send size={22} />
        </button>
        <button onClick={handleSaveToggle} className="ml-auto">
          <Bookmark
            size={24}
            className={isSaved ? "fill-white text-white" : "text-gray-300"}
          />
        </button>
      </div>

      <div className="px-4 pt-2 pb-1 text-sm font-medium">{likesCount.toLocaleString()} likes</div>

      {post.caption && (
        <div className="px-4 text-sm">
          <Link href={`/profile/${post.user?.username}`} className="font-medium mr-1 hover:underline">
            {post.user?.username}
          </Link>
          <span className="text-gray-300">{post.caption}</span>
        </div>
      )}

      <button
        onClick={() => setShowComments((s) => !s)}
        className="px-4 pt-1 text-sm text-gray-500 hover:text-gray-300"
      >
        {commentsCount > 0 ? `View all ${commentsCount} comments` : "Add a comment"}
      </button>

      <div className="px-4 pb-2 pt-1 text-xs text-gray-600 uppercase">{format(post.createdAt)}</div>

      {showComments && (
        <div className="border-t border-border px-4 py-3 h-64">
          <CommentSection postId={post._id} onCommentsCountChange={handleCommentsCountChange} />
        </div>
      )}
    </div>
  );
}