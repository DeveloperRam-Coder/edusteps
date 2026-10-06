import { cn } from "@/lib/utils";

export type SkeletonProps = {
  className?: string;
  variant?: "rect" | "circle" | "text";
};

export function Skeleton({ className, variant = "rect" }: SkeletonProps) {
  const base =
    "animate-pulse rounded-xl bg-muted/70 dark:bg-muted/40";

  const variantClasses =
    variant === "circle"
      ? "rounded-full"
      : variant === "text"
        ? "h-4"
        : "h-6";

  return <div className={cn(base, variantClasses, className)} aria-hidden="true" />;
}

export default Skeleton;

