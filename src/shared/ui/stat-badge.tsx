import { cn } from "@/shared/lib/utils"

interface StatBadgeProps {
  label: string
  value: number | string
  variant?: "default" | "hp" | "ac" | "save" | "perception"
  className?: string
}

export function StatBadge({ label, value, variant = "default", className }: StatBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
        variant === "default" && "bg-secondary text-secondary-foreground",
        variant === "hp" && "bg-pf-threat-extreme/20 text-pf-threat-extreme",
        variant === "ac" && "bg-primary/20 text-primary",
        variant === "save" && "bg-pf-threat-low/20 text-pf-threat-low",
        variant === "perception" && "bg-pf-rarity-rare/20 text-pf-rarity-rare",
        className
      )}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold">
        {typeof value === "number" && value > 0 ? `+${value}` : value}
      </span>
    </div>
  )
}

interface StatBlockProps {
  hp: number
  ac: number
  fort: number
  ref: number
  will: number
  perception: number
  className?: string
  compact?: boolean
}

export function StatBlock({ hp, ac, fort, ref, will, perception, className, compact }: StatBlockProps) {
  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-1.5", className)}>
        <StatBadge label="HP" value={hp} variant="hp" />
        <StatBadge label="AC" value={ac} variant="ac" />
      </div>
    )
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <StatBadge label="HP" value={hp} variant="hp" />
      <StatBadge label="AC" value={ac} variant="ac" />
      <StatBadge label="Fort" value={fort} variant="save" />
      <StatBadge label="Ref" value={ref} variant="save" />
      <StatBadge label="Will" value={will} variant="save" />
      <StatBadge label="Per" value={perception} variant="perception" />
    </div>
  )
}
