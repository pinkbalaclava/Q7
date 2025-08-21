import * as React from "react";
import Chart from "chart.js/auto";
import { Badge } from "@/components/ui/badge";
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

  // Center label/chips
  const [centerTitle, setCenterTitle] = React.useState(String(total));
  const [centerSubtitle, setCenterSubtitle] = React.useState("Total jobs");
  const [chips, setChips] = React.useState<{ text: string; color: string }[]>(
    Object.keys(LANE_LABELS).map(k => ({ text: LANE_LABELS[k as LaneId], color: LANE_COLORS[k as LaneId].bg }))
  );

  // Initialize / update chart
  React.useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    
    // Reset center display when data changes
    setCenterTitle(String(total));
    setCenterSubtitle("Total jobs");
    setChips(Object.keys(LANE_LABELS).map(k => ({ 
      text: LANE_LABELS[k as LaneId], 
      color: LANE_COLORS[k as LaneId].bg 
    })));
    
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
            setCenterTitle(String(total));
            setCenterSubtitle("Total jobs");
            setChips(Object.keys(LANE_LABELS).map(k => ({ text: LANE_LABELS[k as LaneId], color: LANE_COLORS[k as LaneId].bg })));
            return;
          }
          const el = els[0];
          if (el.datasetIndex === 0) {
            const g = groups[el.index];
            const tot = innerValues[el.index];
            const statuses = outerLabels.filter(s => statusToGroup[s] === g);
            setCenterTitle(String(tot));
            setCenterSubtitle(LANE_LABELS[g]);
            setChips(statuses.map(s => ({ text: s, color: lighten(LANE_COLORS[g].bg, 0.25) })));
          } else {
            const s = outerLabels[el.index];
            const v = outerValues[el.index];
            const g = statusToGroup[s];
            setCenterTitle(String(v));
            setCenterSubtitle(s);
            setChips([{ text: LANE_LABELS[g], color: LANE_COLORS[g].bg }]);
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
          const tot = filtered.reduce((a,b)=>a+b,0);
          setCenterTitle(String(tot));
          setCenterSubtitle(LANE_LABELS[g]);
          setChips(outerLabels.filter(s => statusToGroup[s] === g).map(s => ({ text: s, color: lighten(LANE_COLORS[g].bg, 0.25) })));
        }
      }
    });
      
      // Set initial center display
      setCenterTitle(String(total));
      setCenterSubtitle("Total jobs");
      setChips(Object.keys(LANE_LABELS).map(k => ({ 
        text: LANE_LABELS[k as LaneId], 
        color: LANE_COLORS[k as LaneId].bg 
      })));

    return () => chartRef.current?.destroy();
  }, [chartData, groups, innerValues, innerColors, outerLabels, outerValues, outerColors, statusToGroup, total]);

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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm w-full">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Job Status</h3>
        <p className="text-sm text-gray-600">Inner ring = Kanban groups • Outer ring = detailed statuses. Click a group to filter.</p>
      </div>
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-[520px_1fr]">
          {/* Chart */}
          <div className="relative mx-auto" style={{ width: 520, height: 520 }}>
            {/* Legend chips at top */}
            <div className="absolute top-0 left-0 right-0 z-10">
              <div className="flex gap-2 justify-center items-center w-full">
                {chips.map((c, i) => (
                  <span 
                    key={i} 
                    className="inline-flex px-2 py-1 text-xs font-medium rounded-full border"
                    style={{ borderColor: c.color, color: c.color, backgroundColor: `${c.color}20` }}
                  >
                    {c.text}
                  </span>
                ))}
              </div>
            </div>
            <canvas ref={canvasRef} />
            {/* Center label/chips */}
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="text-center">
                <div className="text-3xl font-extrabold leading-none text-gray-900">{centerTitle}</div>
                <div className="text-xs text-gray-600">{centerSubtitle}</div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(["TODO","INPROG","WITHCLIENT","READY","DONE"] as LaneId[]).map((lane) => (
              <div key={lane} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: LANE_COLORS[lane].bg, border: `1px solid ${LANE_COLORS[lane].border}` }} 
                  />
                  <div className="text-sm font-medium text-gray-900">{LANE_LABELS[lane]}</div>
                  <div className="ml-auto text-sm font-semibold text-gray-900">{legendGroups.gTotals[lane] ?? 0}</div>
                </div>
                <ul className="space-y-1">
                  {(legendGroups.byGroup[lane] || []).map((row) => (
                    <li key={row.status} className="flex items-center justify-between text-sm text-gray-600">
                      <span>{row.status}</span>
                      <span className="tabular-nums">{row.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}