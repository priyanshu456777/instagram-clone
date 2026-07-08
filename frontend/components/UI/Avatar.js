export default function Avatar({ src, name, size = 40 }) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const style = { width: size, height: size };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name || "avatar"}
        style={style}
        className="rounded-full object-cover border border-border flex-shrink-0"
      />
    );
  }

  return (
    <div
      style={style}
      className="rounded-full bg-gradient-to-br from-accent to-accentSoft flex items-center justify-center text-white font-semibold flex-shrink-0"
    >
      <span style={{ fontSize: size * 0.35 }}>{initials}</span>
    </div>
  );
}
