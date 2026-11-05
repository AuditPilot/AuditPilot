import React from "react";
import { motion } from "framer-motion";
import { Shield, Loader2, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAudits } from "@/hooks/use-audits";
import { useLocation } from "wouter";
import DashboardLayout from "./DashboardLayout";

export default function AuditHistoryPage() {
  const { data: audits, isLoading } = useAudits();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {!audits || audits.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-100">No Audits Found</h3>
            <p className="text-slate-500 mb-6">Run your first security audit to see results here.</p>
            <Button onClick={() => setLocation('/app/repos')} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 transition-opacity">
              Select a Repository
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {audits.map((audit: any) => (
              <Card key={audit._id} className="p-6 hover:shadow-lg hover:shadow-indigo-950/40 transition-shadow cursor-pointer border border-white/10 bg-slate-900/60 hover:border-indigo-500/30">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${audit.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100">{audit.title}</h3>
                      <p className="text-sm text-slate-500">{audit.description || 'No description'}</p>
                    </div>
                  </div>
                  <Badge variant={audit.status === 'completed' ? 'default' : 'secondary'} className="capitalize">
                    {audit.status}
                  </Badge>
                </div>
                <div className="mt-6 flex items-center justify-between border-t pt-4 border-white/5">
                  <div className="flex gap-6 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5"><Zap className="w-4 h-4" /> {audit.priority} Priority</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> {audit.items?.length || 0} Items</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(audit.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
