"use client";

import { useState } from "react";

export function FilterDetails({
  defaultOpen,
  children,
}: {
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="group/details mt-2 border-t border-[var(--border)] pt-2"
    >
      {children}
    </details>
  );
}
