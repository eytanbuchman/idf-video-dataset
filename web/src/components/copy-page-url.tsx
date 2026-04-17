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
      className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
    >
      {done ? "Copied" : "Copy page link"}
    </button>
  );
}
