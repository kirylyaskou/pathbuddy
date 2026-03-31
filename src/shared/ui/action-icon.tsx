import { cn } from "@/shared/lib/utils"

type ActionCost = 0 | 1 | 2 | 3 | "reaction" | "free"

interface ActionIconProps {
  cost: ActionCost
  className?: string
}

export function ActionIcon({ cost, className }: ActionIconProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-semibold text-primary",
        className
      )}
      title={getActionLabel(cost)}
    >
      {getActionSymbol(cost)}
    </span>
  )
}

function getActionSymbol(cost: ActionCost): string {
  switch (cost) {
    case 0:
    case "free":
      return "◇"
    case 1:
      return "◆"
    case 2:
      return "◆◆"
    case 3:
      return "◆◆◆"
    case "reaction":
      return "↩"
    default:
      return "◆"
  }
}

function getActionLabel(cost: ActionCost): string {
  switch (cost) {
    case 0:
    case "free":
      return "Free Action"
    case 1:
      return "1 Action"
    case 2:
      return "2 Actions"
    case 3:
      return "3 Actions"
    case "reaction":
      return "Reaction"
    default:
      return "Action"
  }
}

interface ActionCostDisplayProps {
  cost: ActionCost
  className?: string
}

export function ActionCostDisplay({ cost, className }: ActionCostDisplayProps) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", className)}>
      <ActionIcon cost={cost} className="text-base" />
      <span className="text-muted-foreground">{getActionLabel(cost)}</span>
    </span>
  )
}
