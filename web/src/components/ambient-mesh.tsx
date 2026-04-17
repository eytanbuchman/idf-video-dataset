export function AmbientMesh() {
  return (
    <div className="ambient-mesh" aria-hidden>
      <div
        className="pointer-events-none absolute -left-1/4 top-1/3 h-[min(80vw,520px)] w-[min(80vw,520px)] rounded-full opacity-30 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(55,130,115,0.18) 0%, transparent 65%)",
          animation: "pulse-soft 14s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute -right-1/4 bottom-0 h-[min(70vw,480px)] w-[min(70vw,480px)] rounded-full opacity-28 blur-[90px]"
        style={{
          background:
            "radial-gradient(circle, rgba(100,95,145,0.14) 0%, transparent 65%)",
          animation: "pulse-soft 16s ease-in-out infinite 2s",
        }}
      />
    </div>
  );
}
