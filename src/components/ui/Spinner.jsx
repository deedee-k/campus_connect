export function Spinner({ size = 24 }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-violet-200 border-t-violet-600"
      style={{ width: size, height: size }}
    />
  );
}