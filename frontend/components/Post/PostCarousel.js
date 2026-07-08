import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PostCarousel({ images = [], onDoubleTap }) {
  const [idx, setIdx] = useState(0);

  // Normalize: accept both array of {url,publicId} and array of strings
  const imageList = (images || [])
    .map((img) => (typeof img === "string" ? { url: img } : img))
    .filter((img) => img?.url);

  if (imageList.length === 0) {
    return (
      <div className="w-full aspect-square bg-zinc-800 flex items-center justify-center text-zinc-500">
        No image
      </div>
    );
  }

  const next = () => setIdx((i) => (i + 1) % imageList.length);
  const prev = () => setIdx((i) => (i - 1 + imageList.length) % imageList.length);

  return (
    <div className="relative w-full bg-black select-none">
      {/* Image container — KEY FIX: aspect-square + max-h bound */}
      <div
        className="relative w-full aspect-square max-h-[600px] overflow-hidden flex items-center justify-center"
        onDoubleClick={onDoubleTap}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageList[idx].url}
          alt={`Post ${idx + 1}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Counter (Instagram-style top-right) */}
        {imageList.length > 1 && (
          <span className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            {idx + 1}/{imageList.length}
          </span>
        )}

        {/* Left/right arrows */}
        {imageList.length > 1 && idx > 0 && (
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-opacity"
            aria-label="Previous image"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {imageList.length > 1 && idx < imageList.length - 1 && (
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-opacity"
            aria-label="Next image"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* Dots indicator */}
      {imageList.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {imageList.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Go to image ${i + 1}`}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === idx ? "bg-white scale-125" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
