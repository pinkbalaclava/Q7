import type { Period, Service, PeriodStatus } from './types';
import { isTerminal, isAwaitingDocs, daysUntil } from './status';

export type WorkloadPoint = {
  month: string; // "Mar", "Apr", ...
  total: number;
  overlay: number;   // overdue/dueSoon/notStarted count
  bucket: "overdue" | "dueSoon" | "notStarted";
};

export function filterByService(periods: Period[], service?: Service): Period[] {
  if (!service) return periods;
  return periods.filter(p => p.service === service);
}

export function kpiActiveClients(periods: Period[], service?: Service): number {
  const filtered = filterByService(periods, service);
  const activeClients = new Set<string>();
  
  filtered.forEach(period => {
    if (!isTerminal(period.status)) {
      activeClients.add(period.clientName);
    }
  });
  
  return activeClients.size;
}

export function kpiJobsAtRisk(periods: Period[], service?: Service): number {
  const filtered = filterByService(periods, service);
  
  return filtered.filter(period => {
    if (isTerminal(period.status)) return false;
    const daysLeft = daysUntil(period.dueDate);
    return daysLeft <= 7; // Due within 7 days or overdue
  }).length;
}

export function kpiAwaitingDocs(periods: Period[], service?: Service): number {
  const filtered = filterByService(periods, service);
  
  return filtered.filter(period => {
    if (isTerminal(period.status)) return false;
    return isAwaitingDocs(period.status);
  }).length;
}

export function kpiAwaitingApproval(periods: Period[], service?: Service): number {
  const filtered = filterByService(periods, service);
  
  return filtered.filter(period => {
    if (isTerminal(period.status)) return false;
    return period.status.includes('Awaiting Approval');
  }).length;
}

export function kpiOnTimeRateMTD(periods: Period[], service?: Service): number {
  const filtered = filterByService(periods, service);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Get periods due this month
  const periodsDueThisMonth = filtered.filter(period => {
    const dueDate = new Date(period.dueDate);
    return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
  });
  
  if (periodsDueThisMonth.length === 0) return 100;
  
  // Count those that were submitted/filed on time
  const onTimePeriods = periodsDueThisMonth.filter(period => {
    if (!period.submittedAt && !period.filedAt) return false;
    
    const completedAt = new Date(period.submittedAt || period.filedAt!);
    const dueDate = new Date(period.dueDate);
    
    return completedAt <= dueDate;
  });
  
  return Math.round((onTimePeriods.length / periodsDueThisMonth.length) * 100);
}

export function statusBreakdown(periods: Period[], service?: Service): Array<{status: string, value: number}> {
  const filtered = filterByService(periods, service);
  const statusCounts = new Map<string, number>();
  
  filtered.forEach(period => {
    const count = statusCounts.get(period.status) || 0;
    statusCounts.set(period.status, count + 1);
  });
  
  return Array.from(statusCounts.entries())
    .map(([status, value]) => ({ status, value }))
    .sort((a, b) => b.value - a.value);
}

export function sixMonthDeadlineTrend(periods: Period[], service?: Service): Array<{month: string, total: number, overdue: number}> {
  const filtered = filterByService(periods, service);
  const now = new Date();
  const trends: Array<{month: string, total: number, overdue: number}> = [];
  
  // Generate last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    
    const monthPeriods = filtered.filter(period => {
      const dueDate = new Date(period.dueDate);
      return dueDate.getMonth() === date.getMonth() && 
             dueDate.getFullYear() === date.getFullYear();
    });
    
    const overduePeriods = monthPeriods.filter(period => {
      const dueDate = new Date(period.dueDate);
      const completedAt = period.submittedAt || period.filedAt;
      
      if (!completedAt) {
        // Not completed yet - check if overdue
        return dueDate < now && !isTerminal(period.status);
      }
      
      // Completed - check if it was late
      return new Date(completedAt) > dueDate;
    });
    
    trends.push({
      month: monthStr,
      total: monthPeriods.length,
      overdue: overduePeriods.length
    });
  }
  
  return trends;
}

// Previous 3 months, current month, next 3 months (7 points total)
export function workloadTimeline(periods: Period[], service?: Service, lookback = 3, lookahead = 3): WorkloadPoint[] {
  const now = new Date();
  const startOfCurrent = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const pts: WorkloadPoint[] = [];
  const source = filterByService(periods, service);

  for (let i = -lookback; i <= lookahead; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    const label = d.toLocaleString(undefined, { month: "short" });
    const rows = source.filter(p => {
      const due = new Date(p.dueDate);
      return due.getUTCFullYear() === d.getUTCFullYear() && due.getUTCMonth() === d.getUTCMonth();
    });
    const total = rows.length;
    const isPast = d < startOfCurrent;
    const isCurrent = d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth();

    let overlay = 0;
    let bucket: WorkloadPoint["bucket"] = "notStarted";

    if (isPast) {
      // Past: items due in that month that are still not terminal and are late as of today
      overlay = rows.filter(p => !isTerminal(p.status) && new Date(p.dueDate) < now).length;
      bucket = "overdue";
    } else if (isCurrent) {
      // Current: due this month that are not terminal and due within 7 days OR still waiting on docs/questionnaire
      overlay = rows.filter(p => !isTerminal(p.status) && (daysUntil(p.dueDate) <= 7 || isAwaitingDocs(p.status))).length;
      bucket = "dueSoon";
    } else {
      // Future: due in this month that haven't started (awaiting docs/questionnaire or unassigned)
      overlay = rows.filter(p => !isTerminal(p.status) && (isAwaitingDocs(p.status) || !p.assignee)).length;
      bucket = "notStarted";
    }
    pts.push({ month: label, total, overlay, bucket });
  }
  return pts;
}