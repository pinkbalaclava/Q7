import * as React from "react";
import { addDays, startOfWeek, format, isSameDay } from "date-fns";
import type { CalEvent } from "./calendarMap";
import { LANE_COLORS } from "./calendarMap";

export function WeekStrip({
  date,
  events,
  onSelect,
}: {
  date: Date;                 // any date within the week to show
  events: CalEvent[];         // already filtered
  onSelect(ev: any): void;    // matches CalendarView signature
}) {
  const start = React.useMemo(() => startOfWeek(date, { weekStartsOn: 1 }), [date]);
  const days = React.useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(start, i)), [start]);

  return (
    <div className="w-full">
      {/* Header (Mon–Sun) */}
      <div className="grid grid-cols-7 border rounded-t-md bg-gray-50 text-sm">
        {days.map((d, i) => (
          <div key={i} className="px-3 py-2 border-r last:border-r-0 font-medium text-gray-700">
            {format(d, "EE dd")}
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="grid grid-cols-7 border border-t-0 rounded-b-md min-h-[140px]">
        {days.map((d, i) => {
          const todays = events.filter(e => isSameDay(e.start, d));
          return (
            <div key={i} className="p-2 border-r last:border-r-0">
              <div className="flex flex-col gap-2">
                {todays.map(ev => {
                  const c = LANE_COLORS[ev.lane];
                  return (
                    <button
                      key={ev.id}
                      onClick={() => onSelect(ev)}
                      className="w-full text-left rounded-md px-2 py-1 text-xs hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: c.bg,
                        color: c.text,
                        border: `1px solid ${c.border}`,
                      }}
                      title={`${ev.title} - ${ev.periodLabel}`}
                    >
                      {ev.title}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}