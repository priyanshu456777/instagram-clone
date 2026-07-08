import { useEffect, useState, useRef } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../UI/Avatar";
import { Plus } from "lucide-react";
import StoryViewer from "./StoryViewer";

export default function StoryBar() {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerIndex, setViewerIndex] = useState(null); // index into storyGroups, or null
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const fetchStories = async () => {
    try {
      const { data } = await api.get("/stories");
      setStoryGroups(data.storyGroups);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchStories();
    else setLoading(false);
  }, [user]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    try {
      await api.post("/stories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Story added!");
      fetchStories();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      e.target.value = ""; // allow re-selecting the same file later
    }
  };

  if (!user || loading) return null;

  const ownGroupIndex = storyGroups.findIndex((g) => g.user._id === user._id);
  const hasOwnStory = ownGroupIndex !== -1;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 mb-6 border-b border-border scrollbar-hide">
      {/* Your own avatar — shows "+" if no story yet, opens viewer if you have one */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <button
          onClick={() => {
            if (hasOwnStory) setViewerIndex(ownGroupIndex);
            else fileInputRef.current?.click();
          }}
          disabled={uploading}
          className="relative w-16 h-16 rounded-full flex items-center justify-center"
        >
          <div
            className={`absolute inset-0 rounded-full ${
              hasOwnStory ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" : ""
            }`}
          />
          <div className="absolute inset-[2px] rounded-full bg-surface flex items-center justify-center">
            <Avatar src={user.avatar?.url} name={user.name} size={56} />
          </div>
          {/* Always-visible "+" button — opens the file picker directly,
              even if you already have an active story, so you can add more. */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="absolute bottom-0 right-0 bg-accent rounded-full p-0.5 border-2 border-surface cursor-pointer"
          >
            <Plus size={14} className="text-white" />
          </div>
        </button>
        <span className="text-xs text-gray-400 truncate w-16 text-center">
          {uploading ? "Uploading..." : "Your story"}
        </span>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
        />
      </div>

      {/* Other users' stories */}
      {storyGroups
        .filter((g) => g.user._id !== user._id)
        .map((group) => {
          const allViewed = group.stories.every((s) => s.isViewed);
          const realIndex = storyGroups.findIndex((g) => g.user._id === group.user._id);
          return (
            <div key={group.user._id} className="flex flex-col items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setViewerIndex(realIndex)}
                className="relative w-16 h-16 rounded-full flex items-center justify-center"
              >
                <div
                  className={`absolute inset-0 rounded-full ${
                    allViewed
                      ? "bg-gray-600"
                      : "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
                  }`}
                />
                <div className="absolute inset-[2px] rounded-full bg-surface flex items-center justify-center">
                  <Avatar src={group.user.avatar?.url} name={group.user.name} size={56} />
                </div>
              </button>
              <span className="text-xs text-gray-400 truncate w-16 text-center">
                {group.user.username}
              </span>
            </div>
          );
        })}

      {viewerIndex !== null && (
        <StoryViewer
          storyGroups={storyGroups}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
}