// frontend/pages/profile/[username].js — REPLACE existing file.

// CHANGES: Back button REMOVED (user wanted it gone). Profile page is one

// of the main destinations; sidebar nav is enough to navigate back.

// Also: better empty state, better loading state, cleaner error UI.


import { useEffect, useState } from "react";

import { useRouter } from "next/router";

import { Camera, Grid3x3, Film } from "lucide-react";

import api from "../../lib/api";

import ProfileHeader from "../../components/Profile/ProfileHeader";

import PostsGrid from "../../components/Profile/PostsGrid";

import ReelsGrid from "../../components/Profile/ReelsGrid";

import PostDetailModal from "../../components/Profile/PostDetailModal";

import EditProfileModal from "../../components/Profile/EditProfileModal";

import Layout from "../../components/Layout/Layout";


export default function ProfilePage() {

  const router = useRouter();

  const { username } = router.query;


  const [profile, setProfile] = useState(null);

  const [isFollowing, setIsFollowing] = useState(false);

  const [posts, setPosts] = useState([]);

  const [reels, setReels] = useState([]);

  const [activeTab, setActiveTab] = useState("posts");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [selectedPost, setSelectedPost] = useState(null);

  const [showEdit, setShowEdit] = useState(false);


  useEffect(() => {

    if (!username) return;

    setLoading(true);

    setError(null);


    Promise.all([

      api.get(`/users/${username}`).catch(() => ({ data: { user: null } })),

      api

        .get(`/posts/user/${username}`)

        .catch(() => ({ data: { posts: [] } })),

      api

        .get(`/reels/user/${username}`)

        .catch(() => ({ data: { reels: [] } })),

    ])

      .then(([u, p, r]) => {

        setProfile(u.data?.user || u.data);

        setIsFollowing(Boolean(u.data?.isFollowing));

        setPosts(p.data?.posts || []);

        setReels(r.data?.reels || []);

      })

      .catch(() => setError("Failed to load profile"))

      .finally(() => setLoading(false));

  }, [username, router.asPath]);


  if (loading) {

    return (

      <Layout>

        <div className="flex items-center justify-center min-h-[60vh]">

          <div className="w-10 h-10 border-4 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />

        </div>

      </Layout>

    );

  }


  if (error || !profile) {

    return (

      <Layout>

        <div className="text-center py-20">

          <div className="text-6xl mb-3">🤷</div>

          <h2 className="text-2xl font-bold mb-2 text-white">User not found</h2>

          <p className="text-zinc-400 mb-4">

            @{username} doesn't exist or has been removed.

          </p>

          <button

            onClick={() => router.push("/")}

            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"

          >

            Go to Home

          </button>

        </div>

      </Layout>

    );

  }


  return (

    <Layout>

      <div className="max-w-4xl mx-auto px-4 py-8">

        <ProfileHeader

          profile={profile}

          isFollowing={isFollowing}

          postsCount={posts.length}

          onFollowChange={setIsFollowing}

          onEditClick={() => setShowEdit(true)}

        />


        <div className="mt-8 border-t border-zinc-800">

          <div className="flex justify-center gap-12">

            <button

              onClick={() => setActiveTab("posts")}

              className={`flex items-center gap-1.5 py-3 text-xs font-semibold uppercase tracking-wide border-t -mt-px ${

                activeTab === "posts"

                  ? "border-white text-white"

                  : "border-transparent text-zinc-500 hover:text-zinc-300"

              }`}

            >

              <Grid3x3 size={14} /> Posts

            </button>

            <button

              onClick={() => setActiveTab("reels")}

              className={`flex items-center gap-1.5 py-3 text-xs font-semibold uppercase tracking-wide border-t -mt-px ${

                activeTab === "reels"

                  ? "border-white text-white"

                  : "border-transparent text-zinc-500 hover:text-zinc-300"

              }`}

            >

              <Film size={14} /> Reels

            </button>

          </div>

          <div className="pt-4">

            {activeTab === "posts" ? (

              posts.length === 0 ? (

                <div className="flex flex-col items-center justify-center py-16 text-zinc-400">

                  <Camera size={64} className="mb-3 opacity-50" />

                  <p className="text-lg font-medium">No posts yet</p>

                  <p className="text-sm mt-1">Posts will appear here when shared.</p>

                </div>

              ) : (

                <PostsGrid posts={posts} onPostClick={setSelectedPost} />

              )

            ) : (

              <ReelsGrid reels={reels} />

            )}

          </div>

        </div>

      </div>


      {selectedPost && (

        <PostDetailModal

          post={selectedPost}

          onClose={() => setSelectedPost(null)}

          onPostDeleted={(deletedId) =>
            setPosts((prev) => prev.filter((p) => p._id !== deletedId))
          }

        />

      )}

      {showEdit && (

        <EditProfileModal

          profile={profile}

          onClose={() => setShowEdit(false)}

          onUpdated={(updated) => setProfile(updated)}

        />

      )}

    </Layout>

  );

}