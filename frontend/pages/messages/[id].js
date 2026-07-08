import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Send } from "lucide-react";
import { format } from "timeago.js";
import Layout from "../../components/Layout/Layout";
import Spinner from "../../components/UI/Spinner";
import Avatar from "../../components/UI/Avatar";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { getSocket } from "../../lib/socket";

export default function ChatThread() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Reliable source of truth for "who am I talking to" â€” comes from the
  // conversation's participants list, not from message senders (which can
  // all be the current user if they started the conversation, e.g. via the
  // profile "Message" button).
  const fetchOtherUser = useCallback(async () => {
    try {
      const { data } = await api.get("/messages/conversations");
      const conversation = data.conversations.find((c) => c._id === id);
      if (conversation) setOtherUser(conversation.otherUser);
    } catch (err) {
      // non-fatal, message thread can still render without header info
    }
  }, [id]);

  const fetchMessages = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await api.get(`/messages/conversations/${id}`);
      setMessages(data.messages);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMessages();
    fetchOtherUser();
  }, [fetchMessages, fetchOtherUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for real-time incoming messages for this conversation
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    const handleNewMessage = (payload) => {
      if (payload.conversationId === id) {
        setMessages((prev) => [...prev, payload.message]);
      }
    };
    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [id, user]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending || !otherUser) return;
    setSending(true);
    const messageText = text.trim();
    setText("");
    try {
      const { data } = await api.post("/messages/send", {
        recipientId: otherUser._id,
        text: messageText,
      });
      setMessages((prev) => [...prev, data.message]);
    } catch (err) {
      toast.error(err.message);
      setText(messageText);
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto flex flex-col h-[calc(100vh-2rem)] px-4 py-4">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <button onClick={() => router.push("/messages")}>
            <ArrowLeft size={20} />
          </button>
          {otherUser && (
            <>
              <Avatar src={otherUser.avatar?.url} name={otherUser.name} size={36} />
              <Link
                href={`/profile/${otherUser.username}`}
                className="font-medium text-sm hover:underline"
              >
                {otherUser.username}
              </Link>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {loading ? (
            <Spinner size={32} />
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-8">
              Start the conversation 👋
            </p>
          ) : (
            messages.map((m) => {
              const isMine = m.sender._id === user?._id;
              return (
                <div
                  key={m._id}
                  className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                >
                  {m.storyReply && (
                    <div className="mb-1 flex items-center gap-2 bg-surface2 rounded-lg p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.storyReply.imageUrl}
                        alt="story"
                        className="w-10 h-14 object-cover rounded"
                      />
                      <span className="text-[10px] text-gray-500">
                        Replied to story
                      </span>
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                      isMine
                        ? "bg-accent text-white rounded-br-sm"
                        : "bg-surface2 text-gray-100 rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10px] text-gray-600 mt-0.5 px-1">
                    {format(m.createdAt)}
                  </span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-2 pt-3 border-t border-border">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message..."
            className="flex-1 bg-surface2 rounded-full px-4 py-2 text-sm focus:outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="text-accent disabled:text-gray-600"
          >
            <Send size={22} />
          </button>
        </form>
      </div>
    </Layout>
  );
}