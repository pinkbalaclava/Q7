import { addMinutes } from "date-fns";
import type { Period, Service } from "./types";
import { laneForStatus, type LaneId } from "./lanes5";

export type CalEvent = {
  id: string;
  title: string;          // client name only
  start: Date;
  end: Date;
  lane: LaneId;           // TODO | INPROG | WITHCLIENT | READY | DONE
  service: Service;
  periodId: string;
  periodLabel: string;
  allDay?: boolean;       // NEW
};

function atLocalNoon(d: Date) {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0); // avoid timezone edge cases
  return x;
}

export function periodsToEvents(periods: Period[]): CalEvent[] {
  return periods.map((p) => {
    // normalize to local noon on the due date
    const start = atLocalNoon(new Date(p.dueDate));
    // keep end just after start so it renders as a one-day all-day event
    const end = addMinutes(start, 1);

    return {
      id: p.id,
      title: p.clientName,              // client name only
      start,
      end,
      allDay: true,                     // NEW: explicit all-day
      lane: laneForStatus(p.status),
      service: p.service,
      periodId: p.id,
      periodLabel: p.periodLabel,
    };
  });
}

// Colors for the 5-lane legend and events
export const LANE_COLORS: Record<LaneId, { bg: string; border: string; text: string }> = {
  TODO:       { bg: "#fde68a", border: "#f59e0b", text: "#7c2d12" }, // amber
  INPROG:     { bg: "#bfdbfe", border: "#3b82f6", text: "#1e3a8a" }, // blue
  WITHCLIENT: { bg: "#fbcfe8", border: "#db2777", text: "#831843" }, // pink/rose
  READY:      { bg: "#ddd6fe", border: "#6366f1", text: "#312e81" }, // indigo/violet
  DONE:       { bg: "#bbf7d0", border: "#10b981", text: "#064e3b" }, // emerald
};

export const LANE_LABELS: Record<LaneId, string> = {
  TODO: "To Do",
  INPROG: "In Progress",
  WITHCLIENT: "With Client",
  READY: "Ready for Review",
  DONE: "Completed",
};