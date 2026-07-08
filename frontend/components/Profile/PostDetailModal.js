import PostCard from "../Post/PostCard";

export default function PostDetailModal({ post, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto"
      onClick={onClose}
    >
      <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="text-gray-300 hover:text-white text-2xl leading-none">
            ✕
          </button>
        </div>
        <PostCard post={post} />
      </div>
    </div>
  );
}
