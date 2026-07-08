import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../lib/api";

export default function EditProfileModal({ profile, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name: profile.name || "",
    bio: profile.bio || "",
    location: profile.location || "",
    profession: profile.profession || "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar?.url || null);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/users/profile", form);
      let updatedUser = data.user;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        const avatarRes = await api.put("/users/avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        updatedUser = { ...updatedUser, avatar: avatarRes.data.avatar };
      }

      toast.success("Profile updated!");
      onUpdated?.(updatedUser);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-surface border border-border rounded-xl2 w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-surface">
          <h2 className="font-semibold">Edit Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex flex-col items-center gap-2">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-surface2" />
            )}
            <label className="text-accent text-sm cursor-pointer hover:underline">
              Change photo
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>

          {["name", "profession", "location"].map((field) => (
            <div key={field}>
              <label className="text-xs text-gray-400 capitalize">{field}</label>
              <input
                name={field}
                value={form[field]}
                onChange={handleChange}
                className="w-full mt-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
            </div>
          ))}

          <div>
            <label className="text-xs text-gray-400">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              maxLength={150}
              rows={3}
              className="w-full mt-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-accent"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-accent hover:bg-accentSoft disabled:opacity-50 transition-colors text-white rounded-lg py-2.5 font-medium"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
