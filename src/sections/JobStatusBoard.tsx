import React from 'react';
import { CardKpi } from '@/components/ui/CardKpi';

interface JobStatusItem {
  label: string;
  count: number;
}

interface JobStatusGroup {
  key: string;
  name: string;
  total: number;
  items: JobStatusItem[];
}

interface JobStatusBoardProps {
  groups: JobStatusGroup[];
  donut: React.ReactNode;
}

export function JobStatusBoard({ groups, donut }: JobStatusBoardProps) {
  return (
    <div className="jobstatus">
      {/* Left: Donut Chart */}
      <div className="jobstatus__donut">
        {donut}
      </div>

      {/* Right: Status Cards Grid */}
      <div className="jobstatus__grid">
        {groups.map((group) => (
          <CardKpi
            key={group.key}
            title={group.name}
            value={group.total}
            className={`kpi-card`}
            data-group={group.key}
            subtitle={
              group.items.length > 0 ? (
                <div className="space-y-1">
                  {group.items.map((item, index) => (
                    <div key={index} className="text-xs text-gray-500">
                      {item.label}: {item.count}
                    </div>
                  ))}
                </div>
              ) : undefined
            }
            status="neutral"
          />
        ))}
      </div>
    </div>
  );
}