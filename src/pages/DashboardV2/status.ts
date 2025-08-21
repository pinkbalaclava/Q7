import type { Service, PeriodStatus, VATStatus, AccountsStatus, SAStatus } from './types';

export const TERMINAL = new Set([
  "Submitted", "Filed", "Paid", "Done", "Closed"
]);

export const AWAITING_DOCS = new Set([
  "Awaiting Docs", "Awaiting Questionnaire", "Reminders Sent"
]);

export function isTerminal(status: string): boolean {
  return TERMINAL.has(status);
}

export function isAwaitingDocs(status: string): boolean {
  return AWAITING_DOCS.has(status);
}

export function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(isoDate);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Forward transitions (canonical source)
export const NEXT: Record<"VAT"|"ACCOUNTS"|"SA", Record<string, string[]>> = {
  VAT: {
    "Awaiting Docs": ["In Progress"],
    "In Progress": ["Awaiting Approval"],
    "Awaiting Approval": ["Ready to Submit"],
    "Ready to Submit": ["Submitted"],
    "Submitted": ["Paid", "Closed"],
    "Paid": ["Closed"],
    "Closed": []
  },
  ACCOUNTS: {
    "Awaiting Docs": ["In Progress"],
    "In Progress": ["Draft Sent", "Awaiting Approval"],
    "Draft Sent": ["Awaiting Approval"],
    "Awaiting Approval": ["Ready to File"],
    "Ready to File": ["Filed"],
    "Filed": ["Closed"],
    "Closed": []
  },
  SA: {
    "Awaiting Questionnaire": ["Reminders Sent", "In Progress"],
    "Reminders Sent": ["In Progress"],
    "In Progress": ["Awaiting Approval"],
    "Awaiting Approval": ["Submitted"],
    "Submitted": ["Done"],
    "Done": []
  }
};

export function nextAllowedTransitions(service: Service, status: PeriodStatus): PeriodStatus[] {
  return (NEXT[service as "VAT"|"ACCOUNTS"|"SA"]?.[status] ?? []) as PeriodStatus[];
}

// Build reverse edges once
const PREV: Record<"VAT"|"ACCOUNTS"|"SA", Record<string, string[]>> = { VAT:{}, ACCOUNTS:{}, SA:{} };
(["VAT","ACCOUNTS","SA"] as const).forEach(svc=>{
  const map = NEXT[svc];
  Object.keys(map).forEach(from=>{
    map[from].forEach(to=>{
      PREV[svc][to] = [...(PREV[svc][to] || []), from];
    });
  });
  // Ensure all keys exist
  Object.keys(map).forEach(k=>{ 
    PREV[svc][k] = PREV[svc][k] || []; 
  });
});

export function prevAllowedTransitions(service: Service, status: PeriodStatus): PeriodStatus[] {
  return (PREV[service as "VAT"|"ACCOUNTS"|"SA"]?.[status] ?? []) as PeriodStatus[];
}