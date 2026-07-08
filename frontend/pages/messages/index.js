import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "timeago.js";
import toast from "react-hot-toast";
import Layout from "../../components/Layout/Layout";
import Spinner from "../../components/UI/Spinner";
import Avatar from "../../components/UI/Avatar";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { getSocket } from "../../lib/socket";

export default function MessagesInbox() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get("/messages/conversations");
      setConversations(data.conversations);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user]);

  // Live-refresh the inbox order/unread state when a new message arrives
  // for any conversation while sitting on this page.
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    const handleNewMessage = () => fetchConversations();
    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [user]);

  if (!user) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-500">
          Please log in to view messages.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-6">
        <h1 className="text-lg font-semibold mb-4">Messages</h1>

        {loading ? (
          <Spinner size={32} />
        ) : conversations.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <p>No messages yet.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((c) => {
              const isOwnReply =
                c.lastMessage?.storyReply &&
                String(c.lastMessage.sender) === String(user._id);
              const previewText = c.lastMessage?.storyReply
                ? isOwnReply
                  ? "You replied to their story"
                  : "Replied to your story"
                : c.lastMessage?.text || "Say hi 👋";

              return (
                <Link
                  key={c._id}
                  href={`/messages/${c._id}`}
                  className="flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-surface2 transition-colors"
                >
                  <Avatar
                    src={c.otherUser?.avatar?.url}
                    name={c.otherUser?.name}
                    size={48}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {c.otherUser?.username}
                    </p>
                    <p
                      className={`text-xs truncate ${
                        c.isUnread ? "text-white font-medium" : "text-gray-500"
                      }`}
                    >
                      {previewText}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {c.lastMessage && (
                      <span className="text-[10px] text-gray-600">
                        {format(c.lastMessage.createdAt)}
                      </span>
                    )}
                    {c.isUnread && (
                      <span className="w-2 h-2 rounded-full bg-accent" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}