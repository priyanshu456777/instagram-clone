import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import Layout from "../../components/Layout/Layout";
import Spinner from "../../components/UI/Spinner";
import ProfileHeader from "../../components/Profile/ProfileHeader";
import PostsGrid from "../../components/Profile/PostsGrid";
import PostDetailModal from "../../components/Profile/PostDetailModal";
import EditProfileModal from "../../components/Profile/EditProfileModal";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function ProfilePage() {
  const router = useRouter();
  const { username } = router.query;
  const { setUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!username) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/users/${username}`);
      setProfile(data.user);
      setPosts(data.posts);
      setIsFollowing(data.isFollowing);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleProfileUpdated = (updatedUser) => {
    setProfile((prev) => ({ ...prev, ...updatedUser }));
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : prev));
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <Spinner size={32} />
        ) : !profile ? (
          <p className="text-center text-gray-500 py-16">User not found</p>
        ) : (
          <>
            <ProfileHeader
              profile={profile}
              isFollowing={isFollowing}
              postsCount={posts.length}
              onFollowChange={setIsFollowing}
              onEditClick={() => setShowEdit(true)}
            />
            <PostsGrid posts={posts} onPostClick={setSelectedPost} />
          </>
        )}
      </div>

      {selectedPost && (
        <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}

      {showEdit && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onUpdated={handleProfileUpdated}
        />
      )}
    </Layout>
  );
}
