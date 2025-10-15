export default function Spinner({ size = 20, className = "border-white border-2" }: { size?: number; className?: string }) {
  return (
    <div
      className={`border-t-transparent rounded-full animate-spin ${className}`}
      style={{
        width: size,
        height: size,
        borderTopColor: "transparent",
      }}
    />
  );
}
