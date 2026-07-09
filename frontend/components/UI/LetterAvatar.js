// frontend/components/UI/LetterAvatar.js — NEW FILE.

// Renders a colored circle with the user's initial as base layer.

// If a valid avatar URL exists, the image is layered ON TOP.

// If image fails to load, it gets removed → colored letter stays visible.


const PALETTE = [

  "bg-rose-500",

  "bg-pink-500",

  "bg-fuchsia-500",

  "bg-violet-500",

  "bg-indigo-500",

  "bg-blue-500",

  "bg-sky-500",

  "bg-cyan-500",

  "bg-teal-500",

  "bg-emerald-500",

  "bg-lime-500",

  "bg-amber-500",

  "bg-orange-500",

];


function pickColor(seed = "") {

  let hash = 0;

  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i)) % 9973;

  return PALETTE[hash % PALETTE.length];

}


const FALLBACK_AVATARS = new Set([

  "",

  "undefined",

  "null",

  "https://example.com/avatar.png",

  "/default-avatar.png",

]);


export default function LetterAvatar({

  username = "",

  avatar,

  size = 36,

  className = "",

}) {

  const initial = (username?.[0] || "?").toUpperCase();

  const bg = pickColor(username);

  const fontSize = Math.max(10, Math.round(size * 0.42));

  const hasValidAvatar = avatar && !FALLBACK_AVATARS.has(avatar);


  return (

    <div

      className={`relative rounded-full overflow-hidden border border-zinc-700 ${className}`}

      style={{ width: size, height: size, flexShrink: 0 }}

      aria-label={username || "avatar"}

    >

      {/* Base layer: always visible colored letter */}

      <div

        className={`absolute inset-0 rounded-full ${bg} flex items-center justify-center text-white font-semibold`}

        style={{ fontSize }}

      >

        {initial}

      </div>


      {/* Top layer: real image if URL is valid */}

      {hasValidAvatar && (

        // eslint-disable-next-line @next/next/no-img-element

        <img

          src={avatar}

          alt={username || "avatar"}

          className="absolute inset-0 w-full h-full object-cover"

          onError={(e) => {

            e.currentTarget.style.display = "none";

          }}

        />

      )}

    </div>

  );

}

