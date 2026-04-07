import { forwardRef } from "react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const variantClasses = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
  brand: "bg-brand-orange text-primary-foreground hover:bg-brand-orange-hover shadow-md hover:shadow-lg",
  brandOutline: "border-2 border-brand-orange text-brand-orange bg-transparent hover:bg-brand-orange hover:text-primary-foreground",
  navPrimary: "bg-brand-orange text-primary-foreground hover:bg-brand-orange-hover",
  ai: "bg-brand-ai text-primary-foreground hover:bg-brand-ai/90 shadow-md",
  hero: "bg-brand-orange text-primary-foreground hover:bg-brand-orange-hover shadow-lg hover:shadow-xl text-base font-semibold px-8 py-3 h-auto",
  heroOutline: "border-2 border-primary-foreground text-primary-foreground bg-transparent hover:bg-primary-foreground/10 text-base font-semibold px-8 py-3 h-auto",
};

const sizeClasses = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  xl: "h-12 rounded-lg px-10 text-base",
  icon: "h-10 w-10",
};

const buttonVariants = ({ variant = "default", size = "default", className } = {}) =>
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    variantClasses[variant] ?? variantClasses.default,
    sizeClasses[size] ?? sizeClasses.default,
    className
  );

const Button = forwardRef(({ className, variant = "default", size = "default", asChild = false, children, ...props }, ref) => {
  if (asChild && children) {
    return (
      <span className={buttonVariants({ variant, size, className })} ref={ref} {...props}>
        {children}
      </span>
    );
  }
  return (
    <button
      className={buttonVariants({ variant, size, className })}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
