import React from 'react';
import { Inbox, Wrench, Clock8, Rocket, FileCheck, CheckCircle2 } from 'lucide-react';

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { icon: any; className: string }> = {
    "Awaiting Docs":        { icon: Inbox,       className: "bg-slate-100 text-slate-700" },
    "Awaiting Questionnaire":{ icon: Inbox,      className: "bg-slate-100 text-slate-700" },
    "Reminders Sent":       { icon: Inbox,       className: "bg-amber-100 text-amber-800" },
    "In Progress":          { icon: Wrench,      className: "bg-blue-100 text-blue-800" },
    "Draft Sent":           { icon: Wrench,      className: "bg-blue-100 text-blue-800" },
    "Awaiting Approval":    { icon: Clock8,      className: "bg-violet-100 text-violet-800" },
    "Ready to Submit":      { icon: Rocket,      className: "bg-teal-100 text-teal-800" },
    "Ready to File":        { icon: Rocket,      className: "bg-teal-100 text-teal-800" },
    "Submitted":            { icon: FileCheck,   className: "bg-emerald-100 text-emerald-800" },
    "Filed":                { icon: FileCheck,   className: "bg-emerald-100 text-emerald-800" },
    "Paid":                 { icon: CheckCircle2,className: "bg-emerald-100 text-emerald-800" },
    "Done":                 { icon: CheckCircle2,className: "bg-emerald-100 text-emerald-800" },
    "Closed":               { icon: CheckCircle2,className: "bg-rose-100 text-rose-800" },
  };
  
  const m = map[status] || { icon: Wrench, className: "bg-slate-100 text-slate-700" };
  const Icon = m.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${m.className}`}>
      <Icon size={12} /> {status}
    </span>
  );
}