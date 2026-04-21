import { Grid3X3, List } from "lucide-react";
import { cn } from "@/lib/utils";

const viewModes = [
  { value: "grid", label: "Grid view", Icon: Grid3X3 },
  { value: "list", label: "List view", Icon: List },
];

function ViewModeToggle({
  value = "grid",
  onValueChange,
  className,
  activeClassName = "bg-[#1f4e79] text-white",
  inactiveClassName = "bg-white text-[#0f1e33] hover:bg-slate-50",
}) {
  return (
    <div
      className={cn(
        "inline-flex h-10 shrink-0 overflow-hidden rounded-lg border border-slate-300 bg-white",
        className
      )}
      role="radiogroup"
      aria-label="Event view mode"
    >
      {viewModes.map(({ value: mode, label, Icon }) => {
        const isActive = value === mode;

        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            onClick={() => onValueChange?.(mode)}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f36f21] focus-visible:ring-offset-2",
              isActive ? activeClassName : inactiveClassName
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

export { ViewModeToggle };
