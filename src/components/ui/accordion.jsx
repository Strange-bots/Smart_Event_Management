import { useState, createContext, useContext } from "react";
import { ChevronDown } from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// ── context ───────────────────────────────────────────────────────────────────
const AccordionContext = createContext({ value: null, onToggle: () => {} });

// ── Accordion (root) ──────────────────────────────────────────────────────────
const Accordion = ({
  children,
  type = "single",
  collapsible = false,
  className,
  defaultValue,
  ...props
}) => {
  const [value, setValue] = useState(defaultValue ?? null);

  const onToggle = (itemValue) => {
    if (type === "single") {
      setValue((prev) => (prev === itemValue && collapsible ? null : itemValue));
    }
  };

  return (
    <AccordionContext.Provider value={{ value, onToggle }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

// ── AccordionItem ─────────────────────────────────────────────────────────────
const ItemContext = createContext({ itemValue: null, isOpen: false, onToggle: () => {} });

const AccordionItem = ({ children, value: itemValue, className, ...props }) => {
  const { value, onToggle } = useContext(AccordionContext);
  const isOpen = value === itemValue;

  return (
    <ItemContext.Provider value={{ itemValue, isOpen, onToggle }}>
      <div className={cn("border-b", className)} {...props}>
        {children}
      </div>
    </ItemContext.Provider>
  );
};

// ── AccordionTrigger ──────────────────────────────────────────────────────────
const AccordionTrigger = ({ children, className, ...props }) => {
  const { itemValue, isOpen, onToggle } = useContext(ItemContext);

  return (
    <div className="flex">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => onToggle(itemValue)}
        className={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
    </div>
  );
};

// ── AccordionContent ──────────────────────────────────────────────────────────
const AccordionContent = ({ children, className, ...props }) => {
  const { isOpen } = useContext(ItemContext);

  if (!isOpen) return null;

  return (
    <div className={cn("overflow-hidden text-sm", className)} {...props}>
      <div className="pb-4 pt-0">{children}</div>
    </div>
  );
};

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
