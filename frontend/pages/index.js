import { useEffect, useState, useCallback, useRef } from "react";
import Layout from "../components/Layout/Layout";
import StoryBar from "../components/Story/StoryBar";
import PostCard from "../components/Post/PostCard";
import Spinner from "../components/UI/Spinner";
import api from "../lib/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const [feedType, setFeedType] = useState("forYou"); // "forYou" | "following"
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef(null);

  const fetchFeed = useCallback(async (pageNum, type) => {
    try {
      const { data } = await api.get(`/posts?page=${pageNum}&limit=6&type=${type}`);
      setPosts((prev) => (pageNum === 1 ? data.posts : [...prev, ...data.posts]));
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Refetch from page 1 whenever the tab changes
  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchFeed(1, feedType);
  }, [feedType, fetchFeed]);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && page < totalPages && !loadingMore) {
          setLoadingMore(true);
          const next = page + 1;
          setPage(next);
          fetchFeed(next, feedType);
        }
      },
      { threshold: 1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [page, totalPages, loadingMore, fetchFeed, feedType]);

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-6">
        <StoryBar />
        <div className="flex items-center gap-6 mb-6 border-b border-border">
          <button
            onClick={() => setFeedType("forYou")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              feedType === "forYou"
                ? "border-white text-white"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            For You
          </button>
          {user && (
            <button
              onClick={() => setFeedType("following")}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                feedType === "following"
                  ? "border-white text-white"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              Following
            </button>
          )}
        </div>

        {loading ? (
          <Spinner size={32} />
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <p className="text-3xl mb-2">📷</p>
            <p>
              {feedType === "following"
                ? "No posts from people you follow yet. Try exploring!"
                : "No posts yet. Be the first to share something!"}
            </p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
            <div ref={observerTarget} />
            {loadingMore && <Spinner size={24} />}
            {page >= totalPages && posts.length > 0 && (
              <p className="text-center text-xs text-gray-600 py-4">You&apos;re all caught up ✨</p>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}