"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type DialogProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export function Dialog({ open, title, children, onClose }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-cyprus/35 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-[#E6E1D6] p-5">
          <h2 className="text-base font-semibold text-cyprus">{title}</h2>
          <Button aria-label="Close dialog" variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
