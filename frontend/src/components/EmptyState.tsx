import { Inbox } from "lucide-react";

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-[#D9D4C8] bg-sand text-center">
      <Inbox className="h-8 w-8 text-[#7C8A85]" />
      <p className="text-sm font-medium text-[#65736F]">{label}</p>
    </div>
  );
}
