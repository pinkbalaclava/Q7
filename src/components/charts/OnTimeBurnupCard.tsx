'use client';

import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend
} from 'chart.js';
import type { Period } from '../../pages/DashboardV2/types';
import { statusToLane } from '../../lib/tokens';
import { Card } from '../ui/card';
import { TrendingUp } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend);

type Props = {
  periods: Period[];      // pass visiblePeriods (the same array the board/list uses)
  month?: Date;           // optional: selected month; defaults to current month
  heightPx?: number;      // default 420 to visually match the left card height
};

function monthFrame(base?: Date) {
  const d = base ? new Date(base) : new Date();
  const y = d.getFullYear(), m = d.getMonth();
  const end = new Date(y, m + 1, 0).getDate();
  const labels = Array.from({ length: end }, (_, i) => new Date(y, m, i + 1));
  return { y, m, end, labels };
}

export default function OnTimeBurnupCard({ periods, month, heightPx = 420 }: Props) {
  const { y, m, end, labels } = monthFrame(month);

  const { dueCum, doneCum, forecast } = useMemo(() => {
    const dueDaily = Array(end).fill(0);
    const doneDaily = Array(end).fill(0);

    for (const p of periods) {
      const d = new Date(p.dueDate);
      if (d.getFullYear() !== y || d.getMonth() !== m) continue;
      const i = d.getDate() - 1;
      dueDaily[i] += 1;
      if (statusToLane(p.status) === 'Completed') doneDaily[i] += 1; // later: swap to completed_at when available
    }

    const dueCum: number[] = [];
    const doneCum: number[] = [];
    let a = 0, b = 0;
    for (let i = 0; i < end; i++) { a += dueDaily[i]; b += doneDaily[i]; dueCum.push(a); doneCum.push(b); }

    // simple forecast from trailing 7-day throughput
    const today = new Date();
    const todayIdx = (today.getFullYear() === y && today.getMonth() === m) ? Math.min(end - 1, today.getDate() - 1) : end - 1;
    const winStart = Math.max(0, todayIdx - 6);
    const rate = (doneDaily.slice(winStart, todayIdx + 1).reduce((x, y) => x + y, 0)) / Math.max(1, (todayIdx - winStart + 1));
    const forecast = doneCum.slice();
    for (let i = todayIdx + 1; i < end; i++) forecast[i] = Math.max(forecast[i - 1], forecast[i - 1] + rate);

    return { dueCum, doneCum, forecast };
  }, [periods, y, m, end]);

  const empty = !periods?.length;

  return (
    <Card className="rounded-xl border bg-white">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">On‑Time Burn‑up</h3>
        <p className="text-sm text-gray-600">Daily timeline for the selected month (both charts aligned).</p>
      </div>
      
      <div className="p-6">
        <div className="relative" style={{ height: heightPx }}>
          {empty ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">
              No data for this month
            </div>
          ) : (
            <Line
              data={{
                labels: labels.map(d => String(d.getDate())),
                datasets: [
                  { label: 'Due (cumulative)', data: dueCum, borderColor: '#f59e0b', pointRadius: 0, tension: 0.25, borderWidth: 2 },
                  { label: 'Completed (cumulative)', data: doneCum, borderColor: '#10b981', pointRadius: 0, tension: 0.25, borderWidth: 2 },
                  { label: 'Forecast (cumulative)', data: forecast, borderColor: '#3b82f6', borderDash: [4,4], pointRadius: 0, tension: 0.25, borderWidth: 2 },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: 0 },
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, padding: 14, font: { size: 14 } }
                  },
                  tooltip: {
                    callbacks: {
                      title: (items) => labels[items[0].dataIndex].toLocaleDateString()
                    }
                  }
                },
                scales: {
                  x: { grid: { color: 'rgba(148,163,184,0.2)' } },
                  y: { beginAtZero: true, grace: '3%', grid: { color: 'rgba(148,163,184,0.2)' } }
                }
              }}
            />
          )}
        </div>
      </div>
    </Card>
  );
}