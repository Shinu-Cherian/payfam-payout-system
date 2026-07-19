import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "slate" | "blue" | "green" | "rose" | "amber";
};

export function Badge({ className, tone = "slate", ...props }: BadgeProps) {
  const tones = {
    slate: "bg-sand text-[#48625D]",
    blue: "bg-[#E3EFEA] text-cyprus",
    green: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", tones[tone], className)} {...props} />
  );
}
