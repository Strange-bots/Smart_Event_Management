import * as React from "react";

import { cn } from "@/lib/utils";
import { toggleVariants } from "@/components/ui/toggle";

const ToggleGroupContext = React.createContext({
  type: "single",
  value: undefined,
  onItemToggle: () => {},
  disabled: false,
  size: "default",
  variant: "default",
});

const ToggleGroup = React.forwardRef(
  (
    {
      className,
      variant,
      size,
      children,
      type = "single",
      value,
      defaultValue,
      onValueChange,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(
      defaultValue ?? (type === "multiple" ? [] : "")
    );
    const currentValue = isControlled ? value : internalValue;

    const handleItemToggle = React.useCallback(
      (itemValue) => {
        if (disabled) {
          return;
        }

        let nextValue;

        if (type === "multiple") {
          const selectedValues = Array.isArray(currentValue) ? currentValue : [];
          nextValue = selectedValues.includes(itemValue)
            ? selectedValues.filter((entry) => entry !== itemValue)
            : [...selectedValues, itemValue];
        } else {
          nextValue = currentValue === itemValue ? "" : itemValue;
        }

        if (!isControlled) {
          setInternalValue(nextValue);
        }

        onValueChange?.(nextValue);
      },
      [currentValue, disabled, isControlled, onValueChange, type]
    );

    const contextValue = React.useMemo(
      () => ({
        type,
        value: currentValue,
        onItemToggle: handleItemToggle,
        disabled,
        size: size ?? "default",
        variant: variant ?? "default",
      }),
      [type, currentValue, handleItemToggle, disabled, size, variant]
    );

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center gap-1", className)}
        role="group"
        {...props}
      >
        <ToggleGroupContext.Provider value={contextValue}>
          {children}
        </ToggleGroupContext.Provider>
      </div>
    );
  }
);

ToggleGroup.displayName = "ToggleGroup";

const ToggleGroupItem = React.forwardRef(
  ({ className, children, variant, size, value, disabled, onClick, ...props }, ref) => {
    const context = React.useContext(ToggleGroupContext);

    const isPressed = Array.isArray(context.value)
      ? context.value.includes(value)
      : context.value === value;

    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={isPressed}
        data-state={isPressed ? "on" : "off"}
        disabled={context.disabled || disabled}
        className={cn(
          toggleVariants({
            variant: context.variant || variant,
            size: context.size || size,
          }),
          className
        )}
        onClick={(event) => {
          onClick?.(event);

          if (event.defaultPrevented) {
            return;
          }

          context.onItemToggle(value);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

ToggleGroupItem.displayName = "ToggleGroupItem";

export { ToggleGroup, ToggleGroupItem };
