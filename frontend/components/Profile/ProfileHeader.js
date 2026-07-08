import { useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { MessageCircle } from "lucide-react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../UI/Avatar";

export default function ProfileHeader({ profile, isFollowing, postsCount, onFollowChange, onEditClick }) {
  const { user } = useAuth();
  const router = useRouter();
  const [following, setFollowing] = useState(isFollowing);
  const [followersCount, setFollowersCount] = useState(profile.followers?.length || 0);
  const [busy, setBusy] = useState(false);
  const isOwnProfile = user && user._id === profile._id;

  const handleFollowToggle = async () => {
    if (!user) {
      toast.error("Please log in to follow users");
      return;
    }
    setBusy(true);
    const prev = following;
    setFollowing(!prev);
    setFollowersCount((c) => (prev ? c - 1 : c + 1));
    try {
      const { data } = await api.put(`/users/${profile._id}/follow`);
      setFollowing(data.isFollowing);
      setFollowersCount(data.followersCount);
      onFollowChange?.(data.isFollowing);
    } catch (err) {
      setFollowing(prev);
      setFollowersCount((c) => (prev ? c + 1 : c - 1));
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleMessage = async () => {
    if (!user) {
      toast.error("Please log in to send messages");
      return;
    }
    try {
      const { data } = await api.post("/messages/send", {
        recipientId: profile._id,
        text: "👋",
      });
      router.push(`/messages/${data.conversationId}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 py-8 border-b border-border">
      <Avatar src={profile.avatar?.url} name={profile.name} size={100} />
      <div className="flex-1 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
          <h1 className="text-xl font-semibold">{profile.username}</h1>
          {isOwnProfile ? (
            <button
              onClick={onEditClick}
              className="border border-border rounded-lg px-4 py-1.5 text-sm hover:bg-surface2"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleFollowToggle}
                disabled={busy}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                  following
                    ? "border border-border hover:bg-surface2"
                    : "bg-accent hover:bg-accentSoft text-white"
                }`}
              >
                {following ? "Following" : "Follow"}
              </button>
              <button
                onClick={handleMessage}
                className="flex items-center gap-1 border border-border rounded-lg px-4 py-1.5 text-sm hover:bg-surface2"
              >
                <MessageCircle size={16} />
                Message
              </button>
            </div>
          )}
        </div>
        <div className="flex justify-center sm:justify-start gap-6 text-sm mb-3">
          <span>
            <strong>{postsCount}</strong> Posts
          </span>
          <span>
            <strong>{followersCount}</strong> Followers
          </span>
          <span>
            <strong>{profile.following?.length || 0}</strong> Following
          </span>
        </div>
        <div className="text-sm space-y-0.5">
          <p className="font-medium">{profile.name}</p>
          {profile.profession && <p className="text-gray-400">{profile.profession}</p>}
          {profile.bio && <p className="text-gray-300">{profile.bio}</p>}
          {profile.location && <p className="text-gray-500 text-xs mt-1">📍 {profile.location}</p>}
        </div>
      </div>
    </div>
  );
}