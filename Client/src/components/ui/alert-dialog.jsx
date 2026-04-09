import { useState, createContext, useContext, useEffect } from "react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// ── context ───────────────────────────────────────────────────────────────────
const AlertDialogContext = createContext({ open: false, setOpen: () => {} });

// ── AlertDialog (root) ────────────────────────────────────────────────────────
const AlertDialog = ({ children, open: controlledOpen, onOpenChange, defaultOpen = false }) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setOpen = (val) => {
    setInternalOpen(val);
    onOpenChange?.(val);
  };

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
};

// ── AlertDialogTrigger ────────────────────────────────────────────────────────
const AlertDialogTrigger = ({ children, asChild, className, ...props }) => {
  const { setOpen } = useContext(AlertDialogContext);
  if (asChild && children) {
    return <span onClick={() => setOpen(true)} className={className}>{children}</span>;
  }
  return (
    <button
      type="button"
      className={className}
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
    </button>
  );
};

// ── AlertDialogOverlay ────────────────────────────────────────────────────────
const AlertDialogOverlay = ({ className, ...props }) => (
  <div
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
);

// ── AlertDialogPortal (wrapper — no actual portal needed here) ────────────────
const AlertDialogPortal = ({ children }) => <>{children}</>;

// ── AlertDialogContent ────────────────────────────────────────────────────────
const AlertDialogContent = ({ children, className, ...props }) => {
  const { open } = useContext(AlertDialogContext);
  if (!open) return null;

  return (
    <>
      <AlertDialogOverlay />
      <div
        role="alertdialog"
        aria-modal="true"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-white p-6 shadow-lg sm:rounded-lg",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </>
  );
};

// ── AlertDialogHeader ─────────────────────────────────────────────────────────
const AlertDialogHeader = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
    {...props}
  />
);

// ── AlertDialogFooter ─────────────────────────────────────────────────────────
const AlertDialogFooter = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  />
);

// ── AlertDialogTitle ──────────────────────────────────────────────────────────
const AlertDialogTitle = ({ className, ...props }) => (
  <h2 className={cn("text-lg font-semibold", className)} {...props} />
);

// ── AlertDialogDescription ────────────────────────────────────────────────────
const AlertDialogDescription = ({ className, ...props }) => (
  <p className={cn("text-sm text-gray-500", className)} {...props} />
);

// ── AlertDialogAction (confirm button) ───────────────────────────────────────
const AlertDialogAction = ({ className, onClick, children, ...props }) => {
  const { setOpen } = useContext(AlertDialogContext);
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-[#1f4e79] px-4 py-2 text-sm font-medium text-white hover:bg-[#163a5a] transition-colors focus:outline-none",
        className
      )}
      onClick={(e) => { onClick?.(e); setOpen(false); }}
      {...props}
    >
      {children}
    </button>
  );
};

// ── AlertDialogCancel (cancel button) ────────────────────────────────────────
const AlertDialogCancel = ({ className, onClick, children, ...props }) => {
  const { setOpen } = useContext(AlertDialogContext);
  return (
    <button
      type="button"
      className={cn(
        "mt-2 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none sm:mt-0",
        className
      )}
      onClick={(e) => { onClick?.(e); setOpen(false); }}
      {...props}
    >
      {children}
    </button>
  );
};

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
