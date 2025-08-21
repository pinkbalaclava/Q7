import * as React from "react";
import { Calendar, Views, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addDays } from "date-fns";
import { enGB } from "date-fns/locale";
import { periodsToEvents, LANE_COLORS, LANE_LABELS, CalEvent } from "./calendarMap";
import type { Period } from "./types";
import PeriodModal from "./PeriodModal";
import { WeekStrip } from "./WeekStrip";
import { Button } from "@/components/ui/button";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "en-GB": enGB };
const localizer = dateFnsLocalizer({ 
  format, 
  parse, 
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), 
  getDay, 
  locales 
});

export default function CalendarView({
  periods,
  onUpdate,
}: {
  periods: Period[];              // filtered periods (respecting Service, Status, Assignee, Search)
  onUpdate(next: Period): void;   // updater to keep KPIs in sync
}) {
  const events = React.useMemo(() => periodsToEvents(periods), [periods]);
  const [view, setView] = React.useState<"month"|"week">("month");
  const [date, setDate] = React.useState<Date>(new Date());
  const [opened, setOpened] = React.useState<Period|null>(null);

  const eventStyleGetter = (event: CalEvent) => {
    const c = LANE_COLORS[event.lane];
    return {
      style: {
        backgroundColor: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        borderRadius: "8px",
        padding: "0 6px",
      },
    };
  };

  function onSelectEvent(ev: any) {
    const id = ev.id ?? ev?.event?.id ?? ev?.resourceId ?? ev?.periodId;
    const p = periods.find(x => x.id === ev.id);
    if (p) setOpened(p);
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm w-full">
      <div className="flex flex-row items-center justify-between gap-2 p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Deadline Calendar</h3>
        <div className="flex items-center gap-4">
          <div className="inline-flex rounded-md border overflow-hidden">
            <button
              onClick={() => setView("month")}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                view === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                view === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Week
            </button>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {(["TODO","INPROG","WITHCLIENT","READY","DONE"] as const).map(k => (
              <div key={k} className="flex items-center gap-1">
                <span 
                  style={{
                    display: "inline-block", 
                    width: 10, 
                    height: 10, 
                    borderRadius: 9999,
                    backgroundColor: LANE_COLORS[k].bg, 
                    border: `1px solid ${LANE_COLORS[k].border}`
                  }} 
                />
                <span className="text-gray-600">{LANE_LABELS[k]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {view === "month" ? (
          <div className="h-[72vh]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              allDayAccessor="allDay"
              titleAccessor="title"
              views={[Views.MONTH]}
              view={Views.MONTH}
              date={date}
              onNavigate={setDate}
              popup
              showAllEvents
              eventPropGetter={eventStyleGetter}
              onSelectEvent={onSelectEvent}
              tooltipAccessor={(e: CalEvent) => `${e.title} — ${LANE_LABELS[e.lane]} (${e.periodLabel})`}
              components={{
                event: ({ event }: { event: CalEvent }) => <span>{event.title}</span>,
              }}
              style={{ height: '100%' }}
            />
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Week navigation */}
            <div className="flex items-center gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>
                Today
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDate(d => addDays(d, -7))}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDate(d => addDays(d, 7))}
              >
                Next
              </Button>
              <div className="ml-3 text-sm text-gray-600">
                Week of {format(startOfWeek(date, { weekStartsOn: 1 }), "MMMM d, yyyy")}
              </div>
            </div>
            <WeekStrip
              date={date}
              events={events}
              onSelect={onSelectEvent}
            />
          </div>
        )}
      </div>

      {/* Period modal reuse */}
      <PeriodModal
        open={!!opened}
        period={opened}
        onClose={() => setOpened(null)}
        onUpdate={(next) => { 
          onUpdate(next); 
          if (opened?.id === next.id) setOpened(next); 
        }}
      />
    </div>
  );
}