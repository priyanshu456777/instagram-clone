export default function Spinner({ size = 24 }) {
  return (
    <div className="flex items-center justify-center w-full py-6">
      <div
        style={{ width: size, height: size }}
        className="border-2 border-border border-t-accent rounded-full animate-spin"
      />
    </div>
  );
}
