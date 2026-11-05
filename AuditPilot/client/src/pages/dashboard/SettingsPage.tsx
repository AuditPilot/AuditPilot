import React from "react";
import { motion } from "framer-motion";
import { useAuthStatus } from "@/hooks/use-repos";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import DashboardLayout from "./DashboardLayout";

export default function SettingsPage() {
  const { data: authStatus } = useAuthStatus();
  const user = authStatus?.user;

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 space-y-1">
            <Button variant="ghost" className="w-full justify-start bg-white/5 text-slate-100 font-medium">General</Button>
            <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-slate-100">Notifications</Button>
            <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-slate-100">Security</Button>
            <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-slate-100">Advanced</Button>
          </aside>

          <div className="lg:col-span-3 space-y-8">
            <Card>
              <CardHeader className="border-b border-white/5 py-4 px-6">
                <CardTitle className="text-base font-bold">Public Profile</CardTitle>
                <CardDescription>Your public information on AuditPilot.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-6">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} className="w-20 h-20 rounded-full border-2 border-white/10 shadow-sm" alt="Profile" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-slate-700"></div>
                  )}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Change Photo</Button>
                      <Button size="sm" variant="ghost" className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300">Remove</Button>
                    </div>
                    <p className="text-xs text-slate-500">JPG, GIF or PNG. 1MB max.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">Display Name</label>
                    <input
                      type="text"
                      defaultValue={user?.displayName}
                      className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">GitHub Username</label>
                    <input
                      type="text"
                      defaultValue={user?.username}
                      disabled
                      className="w-full h-10 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-500"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-white/5 py-4 px-6 flex justify-end">
                <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 transition-opacity">Update Profile</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="border-b border-white/5 py-4 px-6">
                <CardTitle className="text-base font-bold text-rose-400">Danger Zone</CardTitle>
                <CardDescription>Permanent account actions.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">Delete Account</h4>
                  <p className="text-xs text-slate-500 mt-1">Once you delete your account, there is no going back. Please be certain.</p>
                </div>
                <Button variant="outline" className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 hover:border-rose-500/50">
                  Delete My Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
