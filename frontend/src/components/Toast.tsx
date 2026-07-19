import { cn } from "@/lib/utils";

export function Toast({ message, tone = "success" }: { message: string; tone?: "success" | "error" }) {
  if (!message) return null;
  return (
    <div
      className={cn(
        "fixed bottom-5 right-5 z-50 rounded-md px-4 py-3 text-sm font-medium shadow-soft",
        tone === "success" ? "bg-cyprus text-white" : "bg-rose-600 text-white",
      )}
    >
      {message}
    </div>
  );
}
