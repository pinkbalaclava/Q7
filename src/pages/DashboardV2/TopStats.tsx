import React from 'react';
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
  statusBreakdown,
  workloadTimeline
} from './metrics';
import NestedStatusKanbanChart from './NestedStatusKanbanChart';
import OnTimeBurnupCard from '../../components/charts/OnTimeBurnupCard';
import { JobStatusBoard } from '../../sections/JobStatusBoard';
import { laneForStatus, LANES } from './lanes5';

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
  const statusData = statusBreakdown(periods, serviceFilter);
  const timelineData = workloadTimeline(periods, serviceFilter);
  
  // Force re-render key when periods or serviceFilter changes
  const chartKey = React.useMemo(() => 
    `${periods.length}-${serviceFilter || 'all'}-${Date.now()}`, 
    [periods, serviceFilter]
  );

  // Prepare data for JobStatusBoard
  const jobStatusGroups = React.useMemo(() => {
    // Group periods by lane
    const laneGroups = LANES.map(lane => {
      const lanePeriods = periods.filter(p => laneForStatus(p.status) === lane.id);
      
      // Get status breakdown for this lane
      const statusCounts = new Map<string, number>();
      lanePeriods.forEach(period => {
        const count = statusCounts.get(period.status) || 0;
        statusCounts.set(period.status, count + 1);
      });
      
      const items = Array.from(statusCounts.entries())
        .map(([status, count]) => ({ label: status, count }))
        .sort((a, b) => b.count - a.count);
      
      return {
        key: lane.id,
        name: lane.title,
        total: lanePeriods.length,
        items
      };
    });
    
    return laneGroups;
  }, [periods]);
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6">
        {/* Job Status Board */}
        <JobStatusBoard 
          groups={jobStatusGroups}
          donut={<NestedStatusKanbanChart periods={periods} />}
        />
      </div>
    </div>
  );
};

export default TopStats;