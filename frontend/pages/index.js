import { useEffect, useState, useCallback, useRef } from "react";

import Layout from "../components/Layout/Layout";

import StoryBar from "../components/Story/StoryBar";

import PostCard from "../components/Post/PostCard";

import ReelCard from "../components/Reel/ReelCard";

import { PostCardSkeleton, StoryBarSkeleton } from "../components/UI/Skeletons";

import api from "../lib/api";

import { useAuth } from "../context/AuthContext";


export default function Home() {

  const { user } = useAuth();

  const [feedType, setFeedType] = useState("forYou");

  const [feed, setFeed] = useState([]);

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);

  const [loadingMore, setLoadingMore] = useState(false);

  const [counts, setCounts] = useState({ posts: 0, reels: 0 });

  const observerTarget = useRef(null);


  const fetchFeed = useCallback(async (pageNum, type) => {

    try {

      let posts = [];

      let totalP = 1;

      try {

        const { data } = await api.get(`/posts?page=${pageNum}&limit=6&type=${type}`);

        posts = data.posts || [];

        totalP = data.totalPages || 1;

      } catch (_) {}


      let reels = [];

      if (pageNum === 1) {

        try {

          const { data } = await api.get(`/reels?limit=10`);

          reels = data.reels || [];

        } catch (_) {}

      }


      // Mix posts and reels — every 2 posts add a reel (clean interleaving)

      const mixed = [];

      const reelPool = [...reels];

      let rIdx = 0;

      posts.forEach((p, i) => {

        mixed.push({ kind: "post", data: p });

        if ((i + 1) % 2 === 0 && rIdx < reelPool.length) {

          mixed.push({ kind: "reel", data: reelPool[rIdx++] });

        }

      });

      while (rIdx < reelPool.length) {

        mixed.push({ kind: "reel", data: reelPool[rIdx++] });

      }


      setFeed((prev) => (pageNum === 1 ? mixed : [...prev, ...mixed]));

      setTotalPages(totalP);

      setCounts({ posts: posts.length, reels: reelPool.length });

    } catch (_) {

      // silent — keep showing what we have

    } finally {

      setLoading(false);

      setLoadingMore(false);

    }

  }, []);


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

        <div>

          <PostCardSkeleton />

          <PostCardSkeleton />

          <PostCardSkeleton />

        </div>

      ) : feed.length === 0 ? (

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

          {feed.map((item, idx) =>

            item.kind === "reel" ? (

              <ReelCard key={`reel-${item.data._id}-${idx}`} reel={item.data} />

            ) : (

              <PostCard key={`post-${item.data._id}-${idx}`} post={item.data} />

            )

          )}


          {loadingMore && <PostCardSkeleton />}


          {page >= totalPages && feed.length > 0 && (

            <p className="text-center text-gray-500 py-6 text-xs uppercase tracking-wider">

              You're all caught up

            </p>

          )}

        </>

      )}


      <div ref={observerTarget} />

    </Layout>

  );

}

