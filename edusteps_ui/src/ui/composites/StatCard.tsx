import React from "react"
import { Card, CardContent } from "@/ui/primitives/shadcn"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, icon, trend, className }, ref) => {
    return (
      <Card ref={ref} className={cn("", className)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <p className="text-3xl font-bold tracking-tight mt-2">{value}</p>
              {trend && (
                <p
                  className={cn(
                    "text-sm font-medium mt-2",
                    trend.isPositive
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {trend.isPositive ? "+" : "-"}{trend.value}%
                </p>
              )}
            </div>
            {icon && (
              <div className="text-2xl text-muted-foreground ml-2">{icon}</div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)
StatCard.displayName = "StatCard"

export { StatCard }
