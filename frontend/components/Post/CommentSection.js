import { useEffect, useState, useRef } from "react";
import { format } from "timeago.js";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { getSocket } from "../../lib/socket";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../UI/Avatar";

export default function CommentSection({ postId, onCommentsCountChange }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const { user } = useAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const { data } = await api.get(`/posts/${postId}/comments`);
        if (mounted) setComments(data.comments);
      } catch (err) {
        toast.error(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();

    // Join the post's real-time room so new comments from other users appear
    // instantly without a refresh.
    const socket = getSocket();
    socket.emit("joinPost", postId);

    const handleNewComment = (payload) => {
      if (payload.postId !== postId) return;
      setComments((prev) => [...prev, payload.comment]);
      onCommentsCountChange?.(payload.commentsCount);
    };

    const handleCommentDeleted = (payload) => {
      if (payload.postId !== postId) return;
      setComments((prev) => prev.filter((c) => c._id !== payload.commentId));
      onCommentsCountChange?.(payload.commentsCount);
    };

    socket.on("newComment", handleNewComment);
    socket.on("commentDeleted", handleCommentDeleted);

    return () => {
      mounted = false;
      socket.emit("leavePost", postId);
      socket.off("newComment", handleNewComment);
      socket.off("commentDeleted", handleCommentDeleted);
    };
  }, [postId, onCommentsCountChange]);

  const handlePostComment = async () => {
    if (!user) {
      toast.error("Please log in to comment");
      return;
    }
    if (!text.trim()) return;

    setPosting(true);
    try {
      await api.post(`/posts/${postId}/comments`, { text: text.trim() });
      setText("");
      // The comment also arrives via the socket "newComment" broadcast,
      // so we don't need to manually push it here — avoids duplicates.
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {loading ? (
          <p className="text-sm text-gray-500">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-500">No comments yet. Be the first!</p>
        ) : (
          comments.map((c) => (
            <div key={c._id} className="flex items-start gap-2 text-sm group">
              <Avatar src={c.user?.avatar?.url} name={c.user?.name} size={28} />
              <div className="flex-1">
                <span className="font-medium mr-1">{c.user?.username}</span>
                <span className="text-gray-300">{c.text}</span>
                <div className="text-xs text-gray-500">{format(c.createdAt)}</div>
              </div>
              {user && (user._id === c.user?._id) && (
                <button
                  onClick={() => handleDelete(c._id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 text-xs"
                >
                  Delete
                </button>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-border pt-3 mt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
          placeholder="Add a comment..."
          maxLength={500}
          className="flex-1 bg-transparent text-sm focus:outline-none placeholder-gray-500"
        />
        <button
          onClick={handlePostComment}
          disabled={posting || !text.trim()}
          className="text-accent font-medium text-sm disabled:opacity-40"
        >
          Post
        </button>
      </div>
    </div>
  );
}
