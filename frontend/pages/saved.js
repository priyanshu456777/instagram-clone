// frontend/pages/saved.js — REPLACE existing file.

// BUG FIX: was calling /users/saved (does not exist). Backend route is at /posts/saved.

// BUG FIX: saved list wasn't refreshing when user navigated back to the page —

// added router events listener so save/unsave from feed reflect immediately on /saved.


import { useEffect, useState, useCallback } from "react";

import { useRouter } from "next/router";

import { Bookmark } from "lucide-react";

import Layout from "../components/Layout/Layout";

import PostsGrid from "../components/Profile/PostsGrid";

import PostDetailModal from "../components/Profile/PostDetailModal";

import api from "../lib/api";

import { useAuth } from "../context/AuthContext";

import toast from "react-hot-toast";


export default function SavedPage() {

  const router = useRouter();

  const { user } = useAuth();

  const [posts, setPosts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [selectedPost, setSelectedPost] = useState(null);


  // Wrapped in useCallback so the listener can re-register cleanly.

  const loadSaved = useCallback(async () => {

    if (!user) {

      setLoading(false);

      return;

    }

    try {

      const { data } = await api.get("/posts/saved");

      setPosts(data.posts || []);

    } catch (err) {

      toast.error(err.response?.data?.message || err.message || "Failed to load saved");

    } finally {

      setLoading(false);

    }

  }, [user]);


  // Initial fetch on mount + when user changes

  useEffect(() => {

    setLoading(true);

    loadSaved();

  }, [loadSaved]);


  // Re-fetch when user navigates BACK to this page from somewhere else

  // (e.g. un-saved a post on the detail modal, then returned here).

  useEffect(() => {

    const onRouteComplete = (url) => {

      if (url === "/saved") loadSaved();

    };

    router.events.on("routeChangeComplete", onRouteComplete);

    return () => router.events.off("routeChangeComplete", onRouteComplete);

  }, [router, loadSaved]);


  if (!user) {

    return (

      <Layout>

        <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-400">

          <Bookmark size={64} className="mb-3 opacity-50" />

          <p className="text-lg font-medium text-white">Sign in to see saved posts</p>

          <p className="text-sm mt-1">Posts you save will appear here.</p>

        </div>

      </Layout>

    );

  }


  if (loading) {

    return (

      <Layout>

        <div className="flex items-center justify-center min-h-[60vh]">

          <div className="w-10 h-10 border-4 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />

        </div>

      </Layout>

    );

  }


  return (

    <Layout>

      <div className="max-w-4xl mx-auto px-4 py-6">

        <div className="flex items-center gap-3 mb-6">

          <Bookmark size={28} className="text-white" />

          <h1 className="text-2xl font-bold text-white">Saved</h1>

          <span className="text-sm text-zinc-400 ml-2">

            {posts.length} {posts.length === 1 ? "post" : "posts"}

          </span>

        </div>


        {posts.length === 0 ? (

          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">

            <Bookmark size={64} className="mb-3 opacity-50" />

            <p className="text-lg font-medium text-white">No saved posts yet</p>

            <p className="text-sm mt-1 max-w-md text-center">

              Tap the bookmark icon on any post to save it here. Only you can see what you've saved.

            </p>

          </div>

        ) : (

          <PostsGrid posts={posts} onPostClick={setSelectedPost} />

        )}

      </div>


      {selectedPost && (

        <PostDetailModal

          post={selectedPost}

          onClose={() => setSelectedPost(null)}

        />

      )}

    </Layout>

  );

}

