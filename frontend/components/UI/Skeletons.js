// Skeleton loader components — used while content is fetching.
// Gives the app a much snappier, more polished feel than spinners.

/**
 * PostCardSkeleton — shimmer placeholder matching PostCard's layout.
 * Use inside the feed while initial posts load.
 */
export function PostCardSkeleton() {
  return (
    <div className="bg-white border rounded-lg mb-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center p-4">
        <div className="w-10 h-10 rounded-full skeleton-shimmer" />
        <div className="ml-3 flex-1 space-y-2">
          <div className="h-3 w-24 skeleton-shimmer rounded" />
          <div className="h-2 w-16 skeleton-shimmer rounded" />
        </div>
      </div>
      {/* Image */}
      <div className="w-full aspect-square skeleton-shimmer" />
      {/* Action bar */}
      <div className="p-4 space-y-3">
        <div className="flex gap-3">
          <div className="w-6 h-6 rounded skeleton-shimmer" />
          <div className="w-6 h-6 rounded skeleton-shimmer" />
          <div className="w-6 h-6 rounded skeleton-shimmer" />
        </div>
        <div className="h-3 w-20 skeleton-shimmer rounded" />
        <div className="h-3 w-full skeleton-shimmer rounded" />
        <div className="h-3 w-2/3 skeleton-shimmer rounded" />
      </div>
    </div>
  );
}

/**
 * StoryBarSkeleton — shimmer version of the story avatars row.
 */
export function StoryBarSkeleton({ count = 5 }) {
  return (
    <div className="flex gap-3 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-16 h-16 rounded-full skeleton-shimmer" />
      ))}
    </div>
  );
}

/**
 * ProfileSkeleton — used on /profile/[username] while loading.
 */
export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center gap-8 mb-8">
        <div className="w-32 h-32 rounded-full skeleton-shimmer" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-32 skeleton-shimmer rounded" />
          <div className="flex gap-6">
            <div className="h-4 w-20 skeleton-shimmer rounded" />
            <div className="h-4 w-20 skeleton-shimmer rounded" />
            <div className="h-4 w-20 skeleton-shimmer rounded" />
          </div>
          <div className="h-4 w-48 skeleton-shimmer rounded" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square skeleton-shimmer" />
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonGroup — wrap any set of skeletons; toggles a shimmer animation class.
 * The actual shimmer keyframes need to be defined once globally (see globals.css).
 */
export function SkeletonGroup({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}