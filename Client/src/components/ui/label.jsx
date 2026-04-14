import { forwardRef } from "react";

import { cn } from "@/lib/utils";

// Shared label class names for form labels.
const labelClass = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";

// Reusable label component with forwarded ref support.
const Label = forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(labelClass, className)}
    {...props}
  />
));

Label.displayName = "Label";

export { Label };
