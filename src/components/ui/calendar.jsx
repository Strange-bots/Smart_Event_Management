import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const isSameDay = (a, b) =>
  a && b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isToday = (date) => isSameDay(date, new Date());

function Calendar({
  className,
  selected,
  onSelect,
  disabled,
  showOutsideDays = true,
  defaultMonth,
  ...props
}) {
  const initial = defaultMonth ?? (selected instanceof Date ? selected : new Date());
  const [viewDate, setViewDate] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const handleSelect = (date) => {
    if (disabled?.(date)) return;
    onSelect?.(date);
  };

  // Build grid cells
  const cells = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), outside: true });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), outside: false });
  }
  // Next month leading days
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), outside: true });
  }

  return (
    <div className={cn("p-3 select-none", className)} {...props}>
      {/* Header */}
      <div className="flex justify-center pt-1 relative items-center mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="absolute left-1 h-7 w-7 bg-transparent border border-input rounded-md p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">
          {MONTHS[month]} {year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="absolute right-1 h-7 w-7 bg-transparent border border-input rounded-md p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="flex">
        {DAYS.map((d) => (
          <div key={d} className="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div>
        {Array.from({ length: 6 }, (_, row) => (
          <div key={row} className="flex w-full mt-2">
            {cells.slice(row * 7, row * 7 + 7).map(({ date, outside }, i) => {
              if (outside && !showOutsideDays) {
                return <div key={i} className="h-9 w-9" />;
              }
              const sel = isSameDay(date, selected);
              const today = isToday(date);
              const isDisabled = disabled?.(date);

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(date)}
                  disabled={isDisabled}
                  className={cn(
                    "h-9 w-9 p-0 text-sm font-normal rounded-md inline-flex items-center justify-center transition-colors",
                    outside && "text-muted-foreground opacity-50",
                    !outside && !sel && !today && "hover:bg-accent hover:text-accent-foreground",
                    today && !sel && "bg-accent text-accent-foreground",
                    sel && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                    isDisabled && "text-muted-foreground opacity-50 pointer-events-none"
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
