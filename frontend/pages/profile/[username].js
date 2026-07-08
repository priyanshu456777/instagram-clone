import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";
import api from "../../lib/api";
import { useUser } from "@clerk/nextjs";
import ProfileHeader from "../../components/Profile/ProfileHeader";
import PostsGrid from "../../components/Profile/PostsGrid";
import PostDetailModal from "../../components/Post/PostDetailModal";
import EditProfileModal from "../../components/Profile/EditProfileModal";
import Layout from "../../components/Layout/Layout";

export default function ProfilePage() {
  const router = useRouter();
  const { username } = router.query;
  const { user: currentUser } = useUser();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
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
        .catch((err) => {
          // some backend routes use userId not username — try lookup fallback
          if (err.response?.status === 404) return { data: { posts: [] } };
          return { data: { posts: [] } };
        }),
    ])
      .then(([u, p]) => {
        setProfile(u.data?.user || u.data);
        setPosts(p.data?.posts || []);
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [username, router.asPath]);

  const isOwner = currentUser?.username === username;

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
          <h2 className="text-2xl font-bold mb-2">User not found</h2>
          <button
            onClick={() => router.back()}
            className="text-blue-500 hover:underline mt-4"
          >
            Go back
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Back button — KEY FIX */}
      <button
        onClick={() => router.back()}
        className="fixed top-4 left-4 z-40 flex items-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 backdrop-blur text-white px-3 py-2 rounded-lg border border-zinc-700 transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Back</span>
      </button>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <ProfileHeader
          profile={profile}
          isOwner={isOwner}
          onEditClick={() => setShowEdit(true)}
        />

        <div className="mt-8 border-t border-zinc-800 pt-6">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <div className="text-6xl mb-3">📷</div>
              <p>No posts yet</p>
            </div>
          ) : (
            <PostsGrid posts={posts} onPostClick={setSelectedPost} />
          )}
        </div>
      </div>

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
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
