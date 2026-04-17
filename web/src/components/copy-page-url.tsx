"use client";

import { useState } from "react";

export function CopyPageUrl() {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(window.location.href);
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
      className="min-h-[40px] text-[13px] text-[var(--muted-strong)] underline-offset-4 transition hover:text-[var(--foreground)] hover:underline"
    >
      {done ? "Copied" : "Copy page link"}
    </button>
  );
}
