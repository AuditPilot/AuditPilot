import React from "react";

export function NavItem({ active, icon, label, onClick }: { active: boolean, icon: any, label: string, onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${active ? 'bg-indigo-500/15 text-indigo-300 ring-1 ring-inset ring-indigo-500/25' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}`}
    >
      {icon}
      {label}
    </div>
  );
}
