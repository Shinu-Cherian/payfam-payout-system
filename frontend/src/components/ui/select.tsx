import { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 rounded-md border border-[#D9D4C8] bg-white px-3 text-sm text-[#102A27] outline-none transition focus:border-cyprus focus:ring-2 focus:ring-[#D6E4DD]",
        className,
      )}
      {...props}
    />
  );
}
