import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../lib/api";

export default function CreatePostModal({ onClose, onCreated }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(selected.type)) {
      toast.error("Only JPG, PNG or WEBP images are allowed");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please select an image first");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("caption", caption);

      const { data } = await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Post shared!");
      onCreated?.(data.post);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-surface border border-border rounded-xl2 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-semibold">Create new post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="preview" className="w-full h-64 object-cover rounded-lg" />
          ) : (
            <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent transition-colors">
              <span className="text-3xl mb-2">🖼️</span>
              <span className="text-sm text-gray-400">Click to select an image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          )}

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            maxLength={2200}
            rows={3}
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-accent"
          />

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-accent hover:bg-accentSoft disabled:opacity-50 transition-colors text-white rounded-lg py-2.5 font-medium"
          >
            {submitting ? "Sharing..." : "Share"}
          </button>
        </div>
      </div>
    </div>
  );
}
