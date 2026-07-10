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
  reply: "replied to your comment",
  follow: "started following you",
  mention: "mentioned you in a post",
  story_like: "liked your story",
  story_reply: "replied to your story",
};

function getMessage(n) {
  if (n.reel && (n.type === "like" || n.type === "comment" || n.type === "reply")) {
    if (n.type === "like") return "liked your reel";
    if (n.type === "reply") return "replied to your comment";
    return "commented on your reel";
  }
  return messages[n.type] || "sent you a notification";
}

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
      setNotifications((prev) => [payload, ...prev]);
      toast(`${payload.sender?.username || "Someone"} ${getMessage(payload)}`, {
        icon: "🔔",
      });
    };
    socket.on("newNotification", handleNew);
    return () => socket.off("newNotification", handleNew);
  }, [user]);

  const getIcon = (type) => {
    if (type === "like" || type === "story_like") return "❤️";
    if (type === "comment" || type === "reply") return "💬";
    if (type === "story_reply") return "↩️";
    if (type === "mention") return "📣";
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
                    {getMessage(n)}
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