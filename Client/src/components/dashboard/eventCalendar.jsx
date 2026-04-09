import { useState } from "react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const parseEventDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
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

const EventCalendar = ({ events = [], onEventClick }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [month, setMonth] = useState(new Date());

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDay = new Date(year, monthIndex, 1).getDay();

  const getEventsForDate = (date) =>
    events.filter((event) => {
      const eventDate = parseEventDate(event.date);
      return eventDate && isSameDay(eventDate, date);
    });

  const prevMonth = () => {
    const d = new Date(month);
    d.setMonth(d.getMonth() - 1);
    setMonth(d);
  };

  const nextMonth = () => {
    const d = new Date(month);
    d.setMonth(d.getMonth() + 1);
    setMonth(d);
  };

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const today = new Date();

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="px-6 pt-5 pb-2">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
          📅 Event Calendar
        </h2>
      </div>

      <div className="px-6 pb-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendar */}
          <div>
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors text-lg leading-none"
              >
                ‹
              </button>
              <span className="font-semibold text-gray-800 text-sm">
                {MONTHS[monthIndex]} {year}
              </span>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors text-lg leading-none"
              >
                ›
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs text-gray-400 font-medium py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-1">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} />;
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
                      "relative flex flex-col items-center justify-center w-8 h-8 mx-auto rounded-full text-sm transition-colors",
                      isSelected
                        ? "bg-[#1f4e79] text-white font-semibold"
                        : isToday
                        ? "border border-[#1f4e79] text-[#1f4e79] font-semibold"
                        : "hover:bg-gray-100 text-gray-700",
                      hasEvents && !isSelected ? "font-bold" : ""
                    )}
                  >
                    <span>{day}</span>
                    {hasEvents && (
                      <div className="absolute bottom-0.5 flex gap-0.5">
                        {dayEvents.slice(0, 3).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-1 h-1 rounded-full",
                              i === 0
                                ? "bg-[#f36f21]"
                                : i === 1
                                ? "bg-purple-500"
                                : "bg-[#1f4e79]"
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Events */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-gray-500">
                {selectedDate ? formatDate(selectedDate) : "Select a date"}
              </h3>
              <span className="border border-gray-200 text-xs text-gray-600 px-2 py-0.5 rounded-full">
                {selectedDateEvents.length} event
                {selectedDateEvents.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
                    onClick={() => onEventClick?.(event)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span>🕐 {event.time}</span>
                          <span>📍 {event.venue}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              event.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : event.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            )}
                          >
                            {event.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            👥 {event.registrations}/{event.capacity}
                          </span>
                        </div>
                      </div>
                      <span className="text-gray-400 group-hover:text-gray-700 transition-colors flex-shrink-0 mt-1 text-sm">
                        ›
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2 opacity-50">📅</div>
                  <p className="text-sm">No events scheduled</p>
                  <p className="text-xs mt-1">
                    Select a different date or create a new event
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#f36f21]" />
            Event 1
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            Event 2
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#1f4e79]" />
            Event 3+
          </span>
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;
