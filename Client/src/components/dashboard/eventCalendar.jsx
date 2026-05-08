import { useState } from "react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CALENDAR_STATE_META = {
  all: {
    label: "All",
    dotClassName: "bg-[#1f4e79]",
    badgeClassName: "bg-slate-100 text-slate-700",
  },
  ongoing: {
    label: "Ongoing",
    dotClassName: "bg-emerald-500",
    badgeClassName: "bg-emerald-100 text-emerald-700",
  },
  coming: {
    label: "Coming",
    dotClassName: "bg-[#f36f21]",
    badgeClassName: "bg-orange-100 text-orange-700",
  },
  gone: {
    label: "Gone",
    dotClassName: "bg-slate-400",
    badgeClassName: "bg-slate-200 text-slate-700",
  },
};

const parseEventDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatDate = (date) =>
  date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const buildSummary = (events) =>
  events.reduce(
    (summary, event) => {
      if (event.calendarState === "ongoing") {
        summary.ongoing += 1;
      } else if (event.calendarState === "coming") {
        summary.coming += 1;
      } else if (event.calendarState === "gone") {
        summary.gone += 1;
      }

      summary.total += 1;
      return summary;
    },
    {
      ongoing: 0,
      coming: 0,
      gone: 0,
      total: 0,
    },
  );

const getCalendarStateMeta = (calendarState) =>
  CALENDAR_STATE_META[calendarState] ?? CALENDAR_STATE_META.all;

const EventCalendar = ({
  events = [],
  summary,
  onEventClick,
  title = "Event Calendar",
  emptyStateMessage = "Select another date or change the status filter.",
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [month, setMonth] = useState(new Date());
  const [activeState, setActiveState] = useState("all");

  const resolvedSummary = summary ?? buildSummary(events);
  const visibleEvents =
    activeState === "all"
      ? events
      : events.filter((event) => event.calendarState === activeState);

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDay = new Date(year, monthIndex, 1).getDay();

  const getEventsForDate = (date) =>
    visibleEvents.filter((event) => {
      const eventDate = parseEventDate(event.date);
      return eventDate && isSameDay(eventDate, date);
    });

  const prevMonth = () => {
    const nextMonth = new Date(month);
    nextMonth.setMonth(nextMonth.getMonth() - 1);
    setMonth(nextMonth);
  };

  const nextMonth = () => {
    const nextMonthDate = new Date(month);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    setMonth(nextMonthDate);
  };

  const calendarDays = [];
  for (let index = 0; index < firstDay; index += 1) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    calendarDays.push(day);
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const today = new Date();
  const stateFilters = [
    { key: "all", count: resolvedSummary.total },
    { key: "ongoing", count: resolvedSummary.ongoing },
    { key: "coming", count: resolvedSummary.coming },
    { key: "gone", count: resolvedSummary.gone },
  ];

  return (
    <div className="rounded-3xl bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <span aria-hidden="true">📅</span>
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Track ongoing, coming, and completed events from one calendar view.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {stateFilters.map(({ key, count }) => {
              const meta = getCalendarStateMeta(key);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveState(key)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    activeState === key
                      ? "border-[#1f4e79] bg-[#1f4e79] text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", meta.dotClassName)} />
                  {meta.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[11px]",
                      activeState === key
                        ? "bg-white/15 text-white"
                        : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="grid gap-3 py-4 sm:grid-cols-2 xl:grid-cols-4">
          {stateFilters.map(({ key, count }) => {
            const meta = getCalendarStateMeta(key);

            return (
              <div
                key={key}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-600">
                    {meta.label} Events
                  </span>
                  <span className={cn("h-2.5 w-2.5 rounded-full", meta.dotClassName)} />
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">{count}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors text-lg leading-none"
              >
                ‹
              </button>
              <span className="text-sm font-semibold text-gray-800">
                {MONTHS[monthIndex]} {year}
              </span>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors text-lg leading-none"
              >
                ›
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7">
              {DAYS.map((dayLabel) => (
                <div
                  key={dayLabel}
                  className="py-1 text-center text-xs font-medium text-gray-400"
                >
                  {dayLabel}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} />;
                }

                const date = new Date(year, monthIndex, day);
                const dayEvents = getEventsForDate(date);
                const hasEvents = dayEvents.length > 0;
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isToday = isSameDay(date, today);

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "relative mx-auto flex h-10 w-10 flex-col items-center justify-center rounded-full text-sm transition-colors",
                      isSelected
                        ? "bg-[#1f4e79] font-semibold text-white"
                        : isToday
                        ? "border border-[#1f4e79] font-semibold text-[#1f4e79]"
                        : "text-gray-700 hover:bg-gray-100",
                      hasEvents && !isSelected ? "font-bold" : "",
                    )}
                  >
                    <span>{day}</span>
                    {hasEvents ? (
                      <div className="absolute bottom-0.5 flex gap-0.5">
                        {dayEvents.slice(0, 3).map((event, markerIndex) => (
                          <div
                            key={`${event.id}-${markerIndex}`}
                            className={cn(
                              "h-1 w-1 rounded-full",
                              getCalendarStateMeta(event.calendarState).dotClassName,
                            )}
                          />
                        ))}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">
                {selectedDate ? formatDate(selectedDate) : "Select a date"}
              </h3>
              <span className="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-600">
                {selectedDateEvents.length} event
                {selectedDateEvents.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="max-h-[320px] space-y-2 overflow-y-auto pr-2">
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="group cursor-pointer rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                    onClick={() => onEventClick?.(event)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-medium text-gray-900">
                          {event.title}
                        </h4>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500">
                          <span>🕐 {event.time}</span>
                          <span>📍 {event.venue}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs",
                              getCalendarStateMeta(event.calendarState).badgeClassName,
                            )}
                          >
                            {getCalendarStateMeta(event.calendarState).label}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs",
                              event.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : event.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700",
                            )}
                          >
                            {event.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            👥 {event.registrations}/{event.capacity}
                          </span>
                        </div>
                      </div>
                      <span className="mt-1 flex-shrink-0 text-sm text-gray-400 transition-colors group-hover:text-gray-700">
                        ›
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-400">
                  <div className="mb-2 text-4xl opacity-50">📅</div>
                  <p className="text-sm">No events scheduled</p>
                  <p className="mt-1 text-xs">{emptyStateMessage}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 border-t pt-4 text-xs text-gray-500">
          {["ongoing", "coming", "gone"].map((calendarState) => {
            const meta = getCalendarStateMeta(calendarState);

            return (
              <span key={calendarState} className="flex items-center gap-1.5">
                <div className={cn("h-2 w-2 rounded-full", meta.dotClassName)} />
                {meta.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;
