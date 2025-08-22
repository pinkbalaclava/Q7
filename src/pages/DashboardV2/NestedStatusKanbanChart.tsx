import * as React from "react";
import Chart from "chart.js/auto";
import BodyPortal from "@/components/charts/BodyPortal";
import { laneForStatus, type LaneId } from "./lanes5";
import { LANE_LABELS } from "./calendarMap";
import type { Period } from "./types";

// Lane colors (hex) to match your theme (amber, blue, rose, indigo, emerald)
const LANE_COLORS: Record<LaneId, { bg: string; border: string; text: string }> = {
  TODO:       { bg: "#f59e0b", border: "#d97706", text: "#7c2d12" },   // amber
  INPROG:     { bg: "#3b82f6", border: "#2563eb", text: "#1e3a8a" },   // blue
  WITHCLIENT: { bg: "#db2777", border: "#be185d", text: "#831843" },   // rose
  READY:      { bg: "#6366f1", border: "#4f46e5", text: "#312e81" },   // indigo
  DONE:       { bg: "#10b981", border: "#059669", text: "#064e3b" },   // emerald
};

// Lighter shade for outer wedges
function lighten(hex: string, amt = 0.35) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const f = (x: number) => Math.min(255, Math.round(x + (255 - x) * amt));
  const toHex = (x: number) => x.toString(16).padStart(2, "0");
  return `#${toHex(f(r))}${toHex(f(g))}${toHex(f(b))}`;
}

// Order detailed statuses around the ring
const STATUS_ORDER = [
  "Awaiting Docs","Awaiting Questionnaire","Reminders Sent",
  "In Progress","Draft Sent",
  "Awaiting Approval",
  "Ready to Submit","Ready to File","Submitted",
  "Filed","Paid","Done","Closed"
];

type Props = { periods: Period[] };

export default function NestedStatusKanbanChart({ periods }: Props) {
  const [hoveredLane, setHoveredLane] = React.useState<LaneId | null>(null);
  const [tooltip, setTooltip] = React.useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({ visible: false, x: 0, y: 0, content: '' });
  
  // Build counts from periods
  const chartData = React.useMemo(() => {
      // group -> status -> count
      const map: Record<LaneId, Record<string, number>> = {
        TODO: {}, INPROG: {}, WITHCLIENT: {}, READY: {}, DONE: {}
      };
      for (const p of periods) {
        const lane = laneForStatus(p.status);
        map[lane][p.status] = (map[lane][p.status] || 0) + 1;
      }
      const groups: LaneId[] = ["TODO","INPROG","WITHCLIENT","READY","DONE"];
      const innerValues = groups.map(g => Object.values(map[g]).reduce((a,b)=>a+b,0));
      const innerColors = groups.map(g => LANE_COLORS[g].bg);

      const outerLabels: string[] = [];
      const outerValues: number[] = [];
      const outerColors: string[] = [];
      const statusToGroup: Record<string, LaneId> = {};

      // Push statuses in a stable order so colors/legend are consistent
      for (const status of STATUS_ORDER) {
        // figure its lane
        const lane = laneForStatus(status);
        const v = map[lane][status] || 0;
        if (v === 0) continue; // hide zeros
        outerLabels.push(status);
        outerValues.push(v);
        outerColors.push(lighten(LANE_COLORS[lane].bg, 0.35));
        statusToGroup[status] = lane;
      }
      const total = outerValues.reduce((a,b)=>a+b,0);
      return { groups, innerValues, innerColors, outerLabels, outerValues, outerColors, statusToGroup, total };
  }, [periods]);

  // Destructure for easier access
  const { groups, innerValues, innerColors, outerLabels, outerValues, outerColors, statusToGroup, total } = chartData;

  // Chart refs
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const chartRef = React.useRef<Chart | null>(null);

  // Initialize / update chart
  React.useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    
    // Destroy previous
    chartRef.current?.destroy();

    chartRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: [...groups.map(g => LANE_LABELS[g]), ...outerLabels],
        datasets: [
          {
            label: "Kanban Group",
            data: innerValues,
            backgroundColor: innerColors,
            borderColor: "#ffffff",
            borderWidth: 2,
            radius: "60%",
            cutout: "35%",
            hoverOffset: 6,
          },
          {
            label: "Detailed Status",
            data: outerValues,
            backgroundColor: outerColors,
            borderColor: "#ffffff",
            borderWidth: 2,
            radius: "95%",
            cutout: "62%",
            hoverOffset: 6,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                if (ctx.datasetIndex === 0) {
                  const g = LANE_LABELS[groups[ctx.dataIndex]];
                  return `${g}: ${innerValues[ctx.dataIndex]}`;
                } else {
                  const s = outerLabels[ctx.dataIndex];
                  const g = LANE_LABELS[statusToGroup[s]];
                  return `${s} → ${g}: ${outerValues[ctx.dataIndex]}`;
                }
              }
            }
          }
        },
        onHover: (_e, els) => {
          if (!els.length) {
            setHoveredLane(null);
            setTooltip({ visible: false, x: 0, y: 0, content: '' });
            // Clear all highlights
            document.querySelectorAll('.kpi-link').forEach(el => {
              el.classList.remove('is-hot');
            });
            return;
          }
          const el = els[0];
          
          // Get mouse position for tooltip
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltip({
              visible: true,
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
              content: el.datasetIndex === 0 
                ? `${LANE_LABELS[groups[el.index]]}: ${innerValues[el.index]}`
                : `${outerLabels[el.index]}: ${outerValues[el.index]}`
            });
          }
          
          if (el.datasetIndex === 0) {
            const g = groups[el.index];
            setHoveredLane(g);
            // Highlight matching card
            document.querySelectorAll('.kpi-link').forEach(card => {
              card.classList.remove('is-hot');
            });
            const matchingCard = document.querySelector(`.area--${g.toLowerCase()}`);
            if (matchingCard) {
              matchingCard.classList.add('is-hot');
            }
          } else {
            const s = outerLabels[el.index];
            const g = statusToGroup[s];
            setHoveredLane(g);
            // Highlight matching card
            document.querySelectorAll('.kpi-link').forEach(card => {
              card.classList.remove('is-hot');
            });
            const matchingCard = document.querySelector(`.area--${g.toLowerCase()}`);
            if (matchingCard) {
              matchingCard.classList.add('is-hot');
            }
          }
        },
        // Click inner ring to filter outer
        onClick: (_evt, els) => {
          if (!chartRef.current || !els.length) return;
          const el = els[0];
          if (el.datasetIndex !== 0) return;
          const g = groups[el.index];
          const filtered = outerLabels.map((s, i) => (statusToGroup[s] === g ? outerValues[i] : 0));
          chartRef.current.data.datasets[1].data = filtered as any;
          chartRef.current.update();
        }
      }
    });

    return () => chartRef.current?.destroy();
  }, [groups, innerValues, innerColors, outerLabels, outerValues, outerColors, statusToGroup]);

  // Build legend groups with counts
  const legendGroups = React.useMemo(() => {
    const gTotals: Record<LaneId, number> = { TODO:0, INPROG:0, WITHCLIENT:0, READY:0, DONE:0 };
    const byGroup: Record<LaneId, { status: string; count: number }[]> = { TODO:[], INPROG:[], WITHCLIENT:[], READY:[], DONE:[] };
    outerLabels.forEach((s, i) => {
      const lane = statusToGroup[s];
      const v = outerValues[i];
      gTotals[lane] += v;
      byGroup[lane].push({ status: s, count: v });
    });
    return { gTotals, byGroup };
  }, [outerLabels, outerValues, statusToGroup]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm w-full">
      <div className="p-6">
        <div className="flex justify-center">
          {/* Chart */}
          <div className="relative mx-auto" style={{ width: 400, height: 400 }}>
            <canvas ref={canvasRef} />
            {/* Center label */}
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="text-center">
                <div className="text-3xl font-extrabold leading-none text-gray-900">{total}</div>
                <div className="text-xs text-gray-600">Total jobs</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Portal tooltip */}
      {tooltip.visible && (
        <BodyPortal>
          <div 
            className="chart-tooltip"
            style={{
              '--tx': `${tooltip.x}px`,
              '--ty': `${tooltip.y - 40}px`
            } as React.CSSProperties}
          >
            {tooltip.content}
          </div>
        </BodyPortal>
      )}
    </div>
  );
}