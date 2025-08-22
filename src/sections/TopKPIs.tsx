import React from 'react';
import { Users, TrendingUp, AlertTriangle, FileWarning, CheckCircle2 } from 'lucide-react';
import { CardKpi } from '@/components/ui/CardKpi';
import type { Period, Service } from '@/pages/DashboardV2/types';
import {
  kpiActiveClients,
  kpiJobsAtRisk,
  kpiAwaitingDocs,
  kpiAwaitingApproval,
  kpiOnTimeRateMTD
} from '@/pages/DashboardV2/metrics';

interface TopKPIsProps {
  periods: Period[];
  serviceFilter?: Service;
}

export function TopKPIs({ periods, serviceFilter }: TopKPIsProps) {
  const activeClients = kpiActiveClients(periods, serviceFilter);
  const jobsAtRisk = kpiJobsAtRisk(periods, serviceFilter);
  const awaitingDocs = kpiAwaitingDocs(periods, serviceFilter);
  const awaitingApproval = kpiAwaitingApproval(periods, serviceFilter);
  const onTimeRate = kpiOnTimeRateMTD(periods, serviceFilter);

  // Determine status for on-time rate
  const getOnTimeStatus = (rate: number) => {
    if (rate >= 90) return "good";
    if (rate >= 70) return "warn";
    return "bad";
  };

  return (
    <div className="kpi-grid mb-8">
      <CardKpi
        title="Active Clients"
        value={activeClients}
        subtitle="With action needed"
        icon={<Users className="w-5 h-5" />}
        status="neutral"
      />
      
      <CardKpi
        title="Jobs at Risk"
        value={jobsAtRisk}
        subtitle="≤7d or overdue"
        icon={<AlertTriangle className="w-5 h-5" />}
        status={jobsAtRisk > 0 ? "bad" : "good"}
      />
      
      <CardKpi
        title="Awaiting Docs"
        value={awaitingDocs}
        subtitle="Client action"
        icon={<FileWarning className="w-5 h-5" />}
        status={awaitingDocs > 5 ? "warn" : "neutral"}
      />
      
      <CardKpi
        title="Awaiting Approval"
        value={awaitingApproval}
        subtitle="Client decision"
        icon={<CheckCircle2 className="w-5 h-5" />}
        status={awaitingApproval > 3 ? "warn" : "neutral"}
      />
      
      <CardKpi
        title="On-Time Rate"
        value={`${onTimeRate}%`}
        subtitle="MTD completion"
        icon={<TrendingUp className="w-5 h-5" />}
        status={getOnTimeStatus(onTimeRate)}
      />
    </div>
  );
}