import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-[#D9D4C8] bg-white px-3 text-sm text-[#102A27] outline-none transition placeholder:text-[#8A958F] focus:border-cyprus focus:ring-2 focus:ring-[#D6E4DD]",
        className,
      )}
      {...props}
    />
  );
}
