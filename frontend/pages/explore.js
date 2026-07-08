import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout/Layout";
import { PostCardSkeleton } from "../components/UI/Skeletons";
import api from "../lib/api";
import toast from "react-hot-toast";
import { Hash, X } from "lucide-react";

/**
 * Explore page — grid of recent posts + hashtag search.
 *
 * Behaviour:
 *   - /explore                  -> shows recent posts grid
 *   - /explore?tag=travel       -> shows posts tagged #travel
 *   - Search box at top lets the user type and jump into a hashtag feed
 */
export default function Explore() {
  const router = useRouter();
  const tagFromUrl = router.query.tag;

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const observerTarget = useRef(null);

  const fetchExplore = useCallback(
    async (pageNum, tag) => {
      try {
        // Two different endpoints depending on whether we're showing all
        // posts or filtering by hashtag.
        const url = tag
          ? `/posts/hashtag/${encodeURIComponent(tag)}?page=${pageNum}&limit=15`
          : `/posts?page=${pageNum}&limit=15&type=forYou`;

        const { data } = await api.get(url);
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
    },
    []
  );

  // Sync the search input with the URL tag when the page loads or changes
  useEffect(() => {
    setSearchInput(tagFromUrl ? `#${tagFromUrl}` : "");
  }, [tagFromUrl]);

  useEffect(() => {
    if (!router.isReady) return;
    setLoading(true);
    setPage(1);
    fetchExplore(1, tagFromUrl);
  }, [tagFromUrl, router.isReady, fetchExplore]);

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
          fetchExplore(next, tagFromUrl);
        }
      },
      { threshold: 1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [page, totalPages, loadingMore, fetchExplore, tagFromUrl]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const cleaned = searchInput.trim().replace(/^#/, "").toLowerCase();
    if (!cleaned) {
      // Empty -> back to plain explore
      router.push("/explore", undefined, { shallow: true });
      return;
    }
    router.push(`/explore?tag=${encodeURIComponent(cleaned)}`, undefined, {
      shallow: true,
    });
  };

  const clearTag = () => {
    setSearchInput("");
    router.push("/explore", undefined, { shallow: true });
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Search header */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2 mb-4 px-4"
        >
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-[#1f1f23] border border-gray-700 rounded">
            <Hash size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search a hashtag (e.g. travel)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearTag}
                className="text-gray-400 hover:text-white"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </form>

        {/* Active-tag banner */}
        {tagFromUrl && (
          <div className="px-4 mb-3 text-sm text-gray-400">
            Showing posts for{" "}
            <span className="font-semibold text-white">#{tagFromUrl}</span>
            <button
              onClick={clearTag}
              className="ml-2 text-blue-400 hover:underline"
            >
              clear
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square">
                <PostCardSkeleton />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <span className="text-6xl mb-4">🔍</span>
            <p>
              {tagFromUrl
                ? `No posts tagged #${tagFromUrl} yet.`
                : "No posts to explore yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post, i) => {
                // Use first image of the carousel for the thumbnail.
                const thumb =
                  post.images?.[0]?.url || post.image?.url || post.image;
                return (
                  <div
                    key={post._id}
                    onClick={() => router.push(`/posts/${post._id}`)}
                    className="relative aspect-square cursor-pointer group overflow-hidden bg-gray-800"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumb}
                      alt={post.caption || "Post"}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Carousel indicator — small dot in corner for multi-image posts */}
                    {post.images && post.images.length > 1 && (
                      <span className="absolute top-2 right-2 text-white text-xs">
                        📚
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-semibold">
                      <span>
                        ❤️{" "}
                        {post.likesCount ?? post.likes?.length ?? 0}
                      </span>
                      <span>💬 {post.commentsCount || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {loadingMore && (
              <div className="grid grid-cols-3 gap-1 mt-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="aspect-square">
                    <PostCardSkeleton />
                  </div>
                ))}
              </div>
            )}
            <div ref={observerTarget} className="h-10" />
          </>
        )}
      </div>
    </Layout>
  );
}