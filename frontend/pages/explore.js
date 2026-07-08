import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout/Layout";
import Spinner from "../components/UI/Spinner";
import api from "../lib/api";
import toast from "react-hot-toast";

export default function Explore() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef(null);

  const fetchExplore = useCallback(async (pageNum) => {
    try {
      const { data } = await api.get(`/posts?page=${pageNum}&limit=15&type=explore`);
      setPosts((prev) => (pageNum === 1 ? data.posts : [...prev, ...data.posts]));
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchExplore(1);
  }, [fetchExplore]);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && page < totalPages && !loadingMore) {
          setLoadingMore(true);
          const next = page + 1;
          setPage(next);
          fetchExplore(next);
        }
      },
      { threshold: 1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [page, totalPages, loadingMore, fetchExplore]);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-2 py-6">
        <h1 className="text-lg font-semibold mb-4 px-2">Explore</h1>

        {loading ? (
          <Spinner size={32} />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => (
                <div
                  key={post._id}
                  onClick={() => router.push(`/profile/${post.user?.username}`)}
                  className="relative aspect-square cursor-pointer group overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.image?.url}
                    alt={post.caption || "post"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-4 text-white opacity-0 group-hover:opacity-100 text-sm font-semibold">
                    <span>❤️ {post.likesCount ?? post.likes?.length ?? 0}</span>
                    <span>💬 {post.commentsCount || 0}</span>
                  </div>
                </div>
              ))}
            </div>
            <div ref={observerTarget} />
            {loadingMore && <Spinner size={24} />}
          </>
        )}
      </div>
    </Layout>
  );
}