import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default"
}) => {
  const variants = {
    default: "bg-card",
    primary: "bg-primary text-primary-foreground",
    accent: "bg-brand-orange text-primary-foreground",
    ai: "bg-brand-ai text-primary-foreground",
  };

  const iconBg = {
    default: "bg-secondary",
    primary: "bg-primary-foreground/20",
    accent: "bg-primary-foreground/20",
    ai: "bg-primary-foreground/20",
  };

  return (
    <Card className={cn("border-0 shadow-sm card-hover", variants[variant])}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "pr-3 text-sm font-medium",
            variant === "default" ? "text-muted-foreground" : "text-primary-foreground/80"
          )}>
            {title}
          </CardTitle>
          {Icon && (
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10", iconBg[variant])}>
              <Icon size={18} className={variant === "default" ? "text-primary" : "text-primary-foreground"} />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className={cn(
            "text-2xl font-heading font-bold sm:text-3xl",
            variant === "default" ? "text-foreground" : "text-primary-foreground"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              "text-sm",
              variant === "default" ? "text-muted-foreground" : "text-primary-foreground/70"
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <p className={cn(
              "text-sm flex items-center gap-1",
              trend.isPositive ? "text-green-500" : "text-red-500"
            )}>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              <span className="text-muted-foreground ml-1">vs last month</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
