import { useEffect, useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { X, Heart, Send, Trash2 } from "lucide-react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../UI/Avatar";

const STORY_DURATION = 5000; // 5 seconds per story

export default function StoryViewer({ storyGroups: groups, startIndex, onClose, onViewed, onDeleted }) {
  const { user } = useAuth();
  const [groupIndex, setGroupIndex] = useState(startIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const intervalRef = useRef(null);
  const elapsedRef = useRef(0);
  const lastTickRef = useRef(Date.now());
  const inputRef = useRef(null);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];
  const isOwnStory = story?.user?._id === user?._id;

  const [isLiked, setIsLiked] = useState(story?.isLiked || false);
  const [likesCount, setLikesCount] = useState(story?.likesCount || 0);

  useEffect(() => {
    setIsLiked(story?.isLiked || false);
    setLikesCount(story?.likesCount || 0);
  }, [story]);

  const goNext = useCallback(() => {
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((i) => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  }, [storyIndex, groupIndex, group, groups, onClose]);

  const goPrev = () => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      setGroupIndex((i) => i - 1);
      setStoryIndex(0);
    }
  };

  useEffect(() => {
    if (!story || isOwnStory) return;
    api.post(`/stories/${story._id}/view`).then(() => onViewed?.()).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?._id]);

  useEffect(() => {
    elapsedRef.current = 0;
    setProgress(0);
  }, [groupIndex, storyIndex]);

  useEffect(() => {
    if (isPaused) return;
    lastTickRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      elapsedRef.current += now - lastTickRef.current;
      lastTickRef.current = now;
      const pct = Math.min((elapsedRef.current / STORY_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(intervalRef.current);
        goNext();
      }
    }, 50);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIndex, storyIndex, isPaused]);

  const handleLike = async () => {
    try {
      const { data } = await api.post(`/stories/${story._id}/like`);
      setIsLiked(data.isLiked);
      setLikesCount(data.likesCount);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      await api.post("/messages/story-reply", { storyId: story._id, text: replyText.trim() });
      toast.success("Reply sent!");
      setReplyText("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
      // Always resume the timer after a reply attempt, and remove focus
      // from the input so it doesn't stay stuck waiting for a manual blur.
      setIsPaused(false);
      inputRef.current?.blur();
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setIsPaused(true);
    if (!window.confirm("Delete this story? This can't be undone.")) {
      setIsPaused(false);
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/stories/${story._id}`);
      toast.success("Story deleted");
      onDeleted?.(story._id);
      onClose();
    } catch (err) {
      toast.error(err.message || "Delete failed");
      setIsPaused(false);
    } finally {
      setDeleting(false);
    }
  };

  if (!story) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="relative w-full max-w-md h-full sm:h-[90vh] bg-black sm:rounded-xl overflow-hidden">
        <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
          {group.stories.map((s, i) => (
            <div key={s._id} className="flex-1 h-0.5 bg-white/30 rounded overflow-hidden">
              <div
                className="h-full bg-white transition-all"
                style={{
                  width:
                    i < storyIndex ? "100%" : i === storyIndex ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-6 left-3 right-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Avatar src={group.user.avatar?.url} name={group.user.name} size={32} />
            <span className="text-white text-sm font-medium">{group.user.username}</span>
          </div>
          <div className="flex items-center gap-3">
            {isOwnStory && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-white disabled:opacity-50"
                aria-label="Delete story"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button onClick={onClose} className="text-white">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={story.image?.url}
          alt="story"
          className="w-full h-full object-contain"
        />

        {!isPaused && (
          <>
            <button onClick={goPrev} className="absolute left-0 top-0 w-1/3 h-full" />
            <button onClick={goNext} className="absolute right-0 top-0 w-1/3 h-full" />
          </>
        )}

        {/* Reply box + like â€” only shown to viewers, never to the story's own owner */}
        {!isOwnStory && (
          <form
            onSubmit={handleReply}
            className="absolute bottom-4 left-3 right-3 flex items-center gap-3 z-10"
          >
            <input
              ref={inputRef}
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
              placeholder="Send message..."
              className="flex-1 bg-transparent border border-white/50 rounded-full px-4 py-2 text-white text-sm placeholder-white/70 focus:outline-none"
            />
            <button type="button" onClick={handleLike}>
              <Heart
                size={24}
                className={isLiked ? "fill-red-500 text-red-500" : "text-white"}
              />
            </button>
            <button type="submit" disabled={sending || !replyText.trim()}>
              <Send size={22} className="text-white" />
            </button>
          </form>
        )}

        {/* Likes count â€” only visible to the story's owner (matches real Instagram,
            where viewers never see how many people liked someone else's story) */}
        {isOwnStory && likesCount > 0 && (
          <div className="absolute bottom-4 left-3 text-white text-xs">
            {likesCount} {likesCount === 1 ? "like" : "likes"}
          </div>
        )}
      </div>
    </div>
  );
}