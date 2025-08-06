export default function Spinner({ size = 20, className = "border-white" }: { size?: number; className?: string }) {
  return (
    <div
      className={`border-2 border-t-transparent rounded-full animate-spin ${className}`}
      style={{
        width: size,
        height: size,
        borderTopColor: "transparent",
      }}
    />
  );
}
