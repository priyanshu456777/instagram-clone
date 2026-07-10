import Link from "next/link";
import { Play, Film } from "lucide-react";

export default function ReelsGrid({ reels }) {
  if (!reels || reels.length === 0) {
    return (
      <div className="text-center text-gray-500 py-16">
        <Film size={40} className="mx-auto mb-2 opacity-50" />
        <p>No reels yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-2">
      {reels.map((reel) => (
        <Link
          key={reel._id}
          href="/reels"
          className="relative aspect-square overflow-hidden group bg-black"
        >
          {reel.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={reel.thumbnailUrl}
              alt={reel.caption || "reel"}
              className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
            />
          ) : (
            <video
              src={reel.videoUrl}
              className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
              muted
              playsInline
              preload="metadata"
            />
          )}
          <div className="absolute top-1.5 right-1.5">
            <Play size={16} className="text-white drop-shadow" fill="white" />
          </div>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-sm font-medium">
            <span>❤️ {reel.likesCount ?? reel.likes?.length ?? 0}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}