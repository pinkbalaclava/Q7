import React from 'react';
import { 
  Users, 
  AlertTriangle, 
  FileWarning, 
  CheckCircle2, 
  TrendingUp 
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import type { Period, Service } from './types';
import {
  kpiActiveClients,
  kpiJobsAtRisk,
  kpiAwaitingDocs,
  kpiAwaitingApproval,
  kpiOnTimeRateMTD,
  statusBreakdown,
  workloadTimeline
} from './metrics';
import NestedStatusKanbanChart from './NestedStatusKanbanChart';
import OnTimeBurnupCard from '../../components/charts/OnTimeBurnupCard';

interface TopStatsProps {
  periods: Period[];
  serviceFilter?: Service;
}

const COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // emerald
  '#8B5CF6', // violet
  '#F97316', // orange
  '#06B6D4', // cyan
  '#84CC16', // lime
];

const TopStats: React.FC<TopStatsProps> = ({ periods, serviceFilter }) => {
  const activeClients = kpiActiveClients(periods, serviceFilter);
  const jobsAtRisk = kpiJobsAtRisk(periods, serviceFilter);
  const awaitingDocs = kpiAwaitingDocs(periods, serviceFilter);
  const awaitingApproval = kpiAwaitingApproval(periods, serviceFilter);
  const onTimeRate = kpiOnTimeRateMTD(periods, serviceFilter);
  
  const statusData = statusBreakdown(periods, serviceFilter);
  const timelineData = workloadTimeline(periods, serviceFilter);
  
  // Force re-render key when periods or serviceFilter changes
  const chartKey = React.useMemo(() => 
    `${periods.length}-${serviceFilter || 'all'}-${Date.now()}`, 
    [periods, serviceFilter]
  );

  const KpiCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'text-gray-600',
    bgColor = 'bg-white',
    badge,
    ariaLabel
  }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    color?: string;
    bgColor?: string;
    badge?: string;
    ariaLabel: string;
  }) => (
    <div 
      className={`${bgColor} rounded-lg border border-gray-200 p-6 shadow-sm`}
      aria-label={ariaLabel}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-center space-x-2 mt-2">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            {badge && (
              <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                {badge}
              </span>
            )}
          </div>
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-gray-600">
            {data.overdue} / {data.total} overdue
          </p>
        </div>
      );
    }
    return null;
  };

  const WorkloadTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const bucketLabel = 
        data.bucket === "overdue" ? "overdue" :
        data.bucket === "dueSoon" ? "due soon" : "not started";
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-gray-600">
            Total due: {data.total}
          </p>
          <p className="text-sm text-gray-600">
            Risk: {data.overlay} {bucketLabel}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 mb-8">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard
          title="Active Clients"
          value={activeClients}
          icon={Users}
          color="text-blue-600"
          ariaLabel={`${activeClients} active clients with action needed`}
          badge="Action Needed"
        />
        
        <KpiCard
          title="Jobs at Risk"
          value={jobsAtRisk}
          icon={AlertTriangle}
          color="text-red-600"
          ariaLabel={`${jobsAtRisk} jobs at risk, due within 7 days or overdue`}
          badge="≤7d or overdue"
        />
        
        <KpiCard
          title="Awaiting Docs"
          value={awaitingDocs}
          icon={FileWarning}
          color="text-amber-600"
          ariaLabel={`${awaitingDocs} jobs awaiting client documentation`}
          badge="Client Action"
        />
        
        <KpiCard
          title="Awaiting Approval"
          value={awaitingApproval}
          icon={CheckCircle2}
          color="text-purple-600"
          ariaLabel={`${awaitingApproval} jobs awaiting client approval`}
          badge="Client Decision"
        />
        
        <KpiCard
          title="On-Time Rate"
          value={`${onTimeRate}%`}
          icon={TrendingUp}
          color={onTimeRate >= 80 ? "text-green-600" : onTimeRate >= 60 ? "text-amber-600" : "text-red-600"}
          ariaLabel={`${onTimeRate}% on-time completion rate for month to date`}
          badge="MTD"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6">
        {/* Nested Status Kanban Chart */}
        <NestedStatusKanbanChart periods={periods} />
      </div>
    </div>
  );
};

export default TopStats;