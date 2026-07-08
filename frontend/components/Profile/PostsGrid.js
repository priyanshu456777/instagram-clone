export default function PostsGrid({ posts, onPostClick }) {
  if (posts.length === 0) {
    return (
      <div className="text-center text-gray-500 py-16">
        <p className="text-3xl mb-2">📷</p>
        <p>No posts yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-2">
      {posts.map((post) => (
        <button
          key={post._id}
          onClick={() => onPostClick(post)}
          className="relative aspect-square overflow-hidden group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image?.url}
            alt={post.caption || "post"}
            className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-sm font-medium">
            <span>❤️ {post.likesCount ?? post.likes?.length ?? 0}</span>
            <span>💬 {post.commentsCount || 0}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
