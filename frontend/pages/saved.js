import { useEffect, useState } from "react";
import Layout from "../components/Layout/Layout";
import Spinner from "../components/UI/Spinner";
import PostsGrid from "../components/Profile/PostsGrid";
import PostDetailModal from "../components/Profile/PostDetailModal";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Saved() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const { data } = await api.get("/users/saved");
        setPosts(data.posts);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-lg font-semibold mb-4">Saved Posts</h1>

        {!user ? (
          <p className="text-center text-gray-500 py-16">Please log in to view saved posts</p>
        ) : loading ? (
          <Spinner size={32} />
        ) : (
          <PostsGrid posts={posts} onPostClick={setSelectedPost} />
        )}
      </div>

      {selectedPost && <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
    </Layout>
  );
}
