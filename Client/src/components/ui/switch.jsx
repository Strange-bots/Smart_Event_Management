import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-[#d1dbe8] bg-[#dbe4ef] p-[3px] shadow-[0_0_0_2px_rgba(209,219,232,0.9)] transition-all data-[state=checked]:border-[#1f4e79] data-[state=checked]:bg-[#1f4e79] data-[state=checked]:shadow-[0_0_0_2px_rgba(31,78,121,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f4e79]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-6 w-6 rounded-full bg-white shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
