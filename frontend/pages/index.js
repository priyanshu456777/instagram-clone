import { useEffect, useState, useCallback, useRef } from "react";
import Layout from "../components/Layout/Layout";
import StoryBar from "../components/Story/StoryBar";
import PostCard from "../components/Post/PostCard";
import { PostCardSkeleton, StoryBarSkeleton } from "../components/UI/Skeletons";
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
      const { data } = await api.get(
        `/posts?page=${pageNum}&limit=6&type=${type}`
      );
      setPosts((prev) =>
        pageNum === 1 ? data.posts : [...prev, ...data.posts]
      );
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
        if (
          entries[0].isIntersecting &&
          page < totalPages &&
          !loadingMore
        ) {
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
      {loading ? <StoryBarSkeleton /> : <StoryBar />}

      <div className="flex gap-8 border-b border-gray-800">
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
        // Skeleton placeholders — much smoother UX than a single spinner.
        <div>
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <span className="text-6xl mb-4">📷</span>
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

          {loadingMore && (
            <div>
              <PostCardSkeleton />
            </div>
          )}

          {page >= totalPages && posts.length > 0 && (
            <p className="text-center text-gray-500 py-4">
              You're all caught up ✨
            </p>
          )}
        </>
      )}

      <div ref={observerTarget} />
    </Layout>
  );
}