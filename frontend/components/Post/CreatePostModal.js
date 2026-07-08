import { useState } from "react";
import { useRef } from "react";
import toast from "react-hot-toast";
import { X, MapPin, Hash, AtSign } from "lucide-react";
import api from "../../lib/api";

export default function CreatePostModal({ onClose, onCreated }) {
  const [files, setFiles] = useState([]); // array for multi-image (carousel)
  const [previews, setPreviews] = useState([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  const MAX_FILES = 10;
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB per file

  const addFiles = (newFiles) => {
    const fileArr = Array.from(newFiles).filter((f) => {
      if (!ALLOWED_TYPES.includes(f.type)) {
        toast.error(`${f.name}: only JPG/PNG/WEBP allowed`);
        return false;
      }
      if (f.size > MAX_SIZE) {
        toast.error(`${f.name}: must be under 5MB`);
        return false;
      }
      return true;
    });

    const combined = [...files, ...fileArr].slice(0, MAX_FILES);
    setFiles(combined);
    setPreviews(combined.map((f) => URL.createObjectURL(f)));
  };

  const handleFileChange = (e) => {
    addFiles(e.target.files);
    e.target.value = ""; // allow same file again
  };

  const handleDrop = (e) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  const removeAt = (idx) => {
    const nf = files.filter((_, i) => i !== idx);
    const np = previews.filter((_, i) => i !== idx);
    setFiles(nf);
    setPreviews(np);
  };

  const handleSort = () => {
    // touch the indexes to trigger reorder via mouseup handlers below
  };

  const reorderItem = (fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    const nf = [...files];
    const np = [...previews];
    const [movedFile] = nf.splice(fromIdx, 1);
    const [movedPrev] = np.splice(fromIdx, 1);
    nf.splice(toIdx, 0, movedFile);
    np.splice(toIdx, 0, movedPrev);
    setFiles(nf);
    setPreviews(np);
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error("Please select at least one image");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("images", f));
      formData.append("caption", caption);
      if (location) formData.append("location", location);

      const { data } = await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Post shared!");
      onCreated?.(data.post);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to share post");
    } finally {
      setSubmitting(false);
    }
  };

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape key
  useState(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 sticky top-0 bg-zinc-900 z-10">
          <h2 className="font-semibold text-white">Create new post</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Preview area */}
          {previews.length > 0 ? (
            <div className="space-y-2">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {previews.map((p, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={(e) => (dragItem.current = i)}
                    onDragEnter={(e) => (dragOverItem.current = i)}
                    onDragEnd={() => {
                      if (dragItem.current !== null && dragOverItem.current !== null) {
                        reorderItem(dragItem.current, dragOverItem.current);
                      }
                      dragItem.current = null;
                      dragOverItem.current = null;
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    className="relative flex-shrink-0 w-24 h-24 rounded-md overflow-hidden border border-zinc-700 cursor-move"
                    title="Drag to reorder"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeAt(i)}
                      type="button"
                      className="absolute top-1 right-1 bg-black/70 hover:bg-red-500 text-white rounded-full p-1 transition-colors"
                      aria-label="Remove"
                    >
                      <X size={12} />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-500 text-center">
                {files.length}/{MAX_FILES} images · Drag to reorder · First image is cover
              </p>
            </div>
          ) : (
            <label
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
            >
              <span className="text-4xl mb-2">🖼️</span>
              <span className="text-sm text-zinc-400">Drag photos here</span>
              <span className="text-xs text-zinc-500 mt-1">
                or click to upload · up to {MAX_FILES} · JPG/PNG/WEBP
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          )}

          {/* Caption */}
          <div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption... use #hashtags and @mentions"
              maxLength={2200}
              rows={4}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-between items-center mt-1 text-xs text-zinc-500">
              <div className="flex gap-3">
                <span className="flex items-center gap-1">
                  <Hash size={12} /> Hashtags
                </span>
                <span className="flex items-center gap-1">
                  <AtSign size={12} /> Mentions
                </span>
              </div>
              <span>{caption.length}/2200</span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2">
            <MapPin size={16} className="text-zinc-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location (optional)"
              maxLength={100}
              className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-zinc-500"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || files.length === 0}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white rounded-lg py-2.5 font-medium"
          >
            {submitting
              ? "Sharing..."
              : `Share${files.length > 1 ? ` (${files.length} photos)` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
