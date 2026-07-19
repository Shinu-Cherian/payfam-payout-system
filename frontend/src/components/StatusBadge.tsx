import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "APPROVED"
      ? "green"
      : status === "REJECTED" || status === "FAILED" || status === "CANCELLED"
        ? "rose"
        : status === "PENDING"
          ? "amber"
          : "slate";
  return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>;
}

