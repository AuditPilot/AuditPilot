import { Shield } from "lucide-react";
import { Card } from "@/components/ui/card";

/**
 * _NON-DONE: workspace-linked audit history is an M4 deliverable
 * (findings pipeline + audit-to-repository linkage). Today's audit
 * history is account-scoped — see /app/history.
 */
export function RepoAuditsPage() {
  return (
    <Card className="p-12 text-center border-dashed">
      <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-slate-100">Audit history arrives in M4</h3>
      <p className="text-slate-500 mt-1 max-w-md mx-auto">
        Audits are currently account-scoped — see the Audits tab in the sidebar.
        This page will list every audit run against this repository once
        workspace-linked audit history lands.
      </p>
    </Card>
  );
}
