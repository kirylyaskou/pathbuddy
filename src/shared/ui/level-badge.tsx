import { cn } from "@/shared/lib/utils"

interface LevelBadgeProps {
  level: number
  className?: string
  size?: "sm" | "md" | "lg"
}

export function LevelBadge({ level, className, size = "md" }: LevelBadgeProps) {
  // High level creatures get more ominous styling
  const isHighLevel = level >= 10
  const isExtremeLevel = level >= 15
  
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded font-mono font-bold transition-colors",
        "bg-primary text-primary-foreground",
        isHighLevel && "bg-pf-threat-severe text-background",
        isExtremeLevel && "bg-pf-threat-extreme text-background grimdark-glow",
        size === "sm" && "w-6 h-6 text-xs",
        size === "md" && "w-8 h-8 text-sm",
        size === "lg" && "w-10 h-10 text-base",
        className
      )}
    >
      {level}
    </div>
  )
}
