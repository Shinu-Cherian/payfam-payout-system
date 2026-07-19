"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { RequireAuth } from "@/components/RequireAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, type AuditLog, type Page } from "@/lib/api";
import { shortDate } from "@/lib/utils";

export default function AuditLogsPage() {
  return (
    <RequireAuth role="ADMIN">
      {() => (
        <AppShell>
          <AuditLogsContent />
        </AppShell>
      )}
    </RequireAuth>
  );
}

function AuditLogsContent() {
  const [logs, setLogs] = useState<Page<AuditLog> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Page<AuditLog>>("/audit-logs?page=1&page_size=20")
      .then(setLogs)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load audit logs"));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-cyprus">Audit Logs</h1>
        <p className="mt-1 text-sm text-[#65736F]">Administrative and payout events captured for review.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <div className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
          {logs?.items.length ? (
            <DataTable columns={["Action", "Actor", "Entity", "Details", "Created"]}>
              {logs.items.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 font-medium text-[#102A27]">{log.action.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3 text-[#65736F]">
                    <span className="inline-flex items-center rounded-md bg-[#F4F5F4] px-2 py-1 text-xs font-medium text-[#102A27] ring-1 ring-inset ring-[#E1E4E2]">
                      {log.actor_user_id ? `User #${log.actor_user_id}` : "System"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#65736F]">
                    <span className="inline-flex items-center rounded-md bg-[#F4F5F4] px-2 py-1 text-xs font-medium text-[#102A27] ring-1 ring-inset ring-[#E1E4E2]">
                      {log.entity_type}
                      {log.entity_id ? ` #${log.entity_id}` : ""}
                    </span>
                  </td>
                  <td className="max-w-md px-4 py-3 text-[#65736F]">
                    {(() => {
                      if (!log.details) return "-";
                      try {
                        const parsed = JSON.parse(log.details);
                        if (typeof parsed !== "object" || parsed === null) return log.details;
                        return (
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(parsed).map(([key, value]) => (
                              <span
                                key={key}
                                className="inline-flex items-center rounded-md bg-[#F4F5F4] px-2 py-1 text-xs font-medium text-[#102A27] ring-1 ring-inset ring-[#E1E4E2]"
                              >
                                <span className="mr-1 capitalize text-[#65736F]">{key.replace(/_/g, " ")}:</span>
                                {String(value) || "-"}
                              </span>
                            ))}
                          </div>
                        );
                      } catch (e) {
                        return log.details;
                      }
                    })()}
                  </td>
                  <td className="px-4 py-3 text-[#65736F]">{shortDate(log.created_at)}</td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptyState label="No audit logs found" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
