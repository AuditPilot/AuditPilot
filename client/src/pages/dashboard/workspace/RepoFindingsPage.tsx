import { Bug } from "lucide-react";
import { Card } from "@/components/ui/card";

/**
 * _NON-DONE: the findings pipeline (persistent findings with lifecycle
 * statuses) is the M4 deliverable. Pull-request audit results remain
 * attached to each PR until then.
 */
export function RepoFindingsPage() {
  return (
    <Card className="p-12 text-center border-dashed">
      <Bug className="w-12 h-12 text-slate-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-slate-100">Findings pipeline arrives in M4</h3>
      <p className="text-slate-500 mt-1 max-w-md mx-auto">
        Persistent, lifecycle-managed findings (open → fixed → dismissed) per
        repository ship with the M4 findings pipeline. For now, PR audit results
        stay attached to each pull request.
      </p>
    </Card>
  );
}
