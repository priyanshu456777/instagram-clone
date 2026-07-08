import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "timeago.js";
import toast from "react-hot-toast";
import Layout from "../components/Layout/Layout";
import Spinner from "../components/UI/Spinner";
import Avatar from "../components/UI/Avatar";
import api from "../lib/api";
import { getSocket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";

const messages = {
  like: "liked your post",
  comment: "commented on your post",
  follow: "started following you",
  story_like: "liked your story",
  story_reply: "replied to your story",
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/notifications");
        setNotifications(data.notifications);
        await api.put("/notifications/read");
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
    else setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    const handleNew = (payload) => {
      setNotifications((prev) => [
        {
          _id: Date.now().toString(),
          type: payload.type,
          sender: payload.from,
          post: payload.postId ? { _id: payload.postId } : undefined,
          createdAt: payload.createdAt,
          read: false,
        },
        ...prev,
      ]);
      toast(`${payload.from.username} ${messages[payload.type] || "sent a notification"}`, {
        icon: "🔔",
      });
    };
    socket.on("newNotification", handleNew);
    return () => socket.off("newNotification", handleNew);
  }, [user]);

  const getIcon = (type) => {
    if (type === "like" || type === "story_like") return "❤️";
    if (type === "comment") return "💬";
    if (type === "story_reply") return "↩️";
    return null;
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-6">
        <h1 className="text-lg font-semibold mb-4">Notifications</h1>
        {!user ? (
          <p className="text-center text-gray-500 py-16">Please log in to see your notifications</p>
        ) : loading ? (
          <Spinner size={32} />
        ) : notifications.length === 0 ? (
          <p className="text-center text-gray-500 py-16">No notifications yet</p>
        ) : (
          <div className="space-y-1">
            {notifications.map((n) => (
              <Link
                key={n._id}
                href={`/profile/${n.sender?.username}`}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-surface2"
              >
                <Avatar src={n.sender?.avatar?.url} name={n.sender?.name} size={40} />
                <div className="flex-1 text-sm">
                  <span className="font-medium">{n.sender?.username}</span>{" "}
                  <span className="text-gray-300">
                    {messages[n.type] || "sent you a notification"}
                  </span>
                  <div className="text-xs text-gray-500">{format(n.createdAt)}</div>
                </div>
                {getIcon(n.type) && (
                  <span className="text-xs text-accent">{getIcon(n.type)}</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}