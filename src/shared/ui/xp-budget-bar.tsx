
import { cn } from "@/shared/lib/utils"

// TODO: Replace with real engine imports when available (Phase 7+)
// These are stub functions matching the engine's encounter module API
type ThreatLevel = 'trivial' | 'low' | 'moderate' | 'severe' | 'extreme'

function getXPThresholds(partySize: number) {
  // Standard PF2e XP thresholds scaled by party size factor
  const factor = partySize / 4
  return {
    trivial: Math.round(40 * factor),
    low: Math.round(60 * factor),
    moderate: Math.round(80 * factor),
    severe: Math.round(120 * factor),
    extreme: Math.round(160 * factor),
  }
}

function getThreatLevel(xp: number, partySize: number): ThreatLevel {
  const thresholds = getXPThresholds(partySize)
  if (xp >= thresholds.extreme) return 'extreme'
  if (xp >= thresholds.severe) return 'severe'
  if (xp >= thresholds.moderate) return 'moderate'
  if (xp >= thresholds.low) return 'low'
  return 'trivial'
}

interface XPBudgetBarProps {
  currentXP: number
  partySize: number
  className?: string
}

const threatColors = {
  trivial: "bg-pf-threat-trivial",
  low: "bg-pf-threat-low",
  moderate: "bg-pf-threat-moderate",
  severe: "bg-pf-threat-severe",
  extreme: "bg-pf-threat-extreme",
}

const threatTextColors = {
  trivial: "text-pf-threat-trivial",
  low: "text-pf-threat-low",
  moderate: "text-pf-threat-moderate",
  severe: "text-pf-threat-severe",
  extreme: "text-pf-threat-extreme",
}

export function XPBudgetBar({ currentXP, partySize, className }: XPBudgetBarProps) {
  const thresholds = getXPThresholds(partySize)
  const threatLevel = getThreatLevel(currentXP, partySize)
  const maxXP = thresholds.extreme * 1.5 // extend bar beyond extreme for visual

  // Calculate segment widths as percentages
  const trivialWidth = (thresholds.trivial / maxXP) * 100
  const lowWidth = ((thresholds.low - thresholds.trivial) / maxXP) * 100
  const moderateWidth = ((thresholds.moderate - thresholds.low) / maxXP) * 100
  const severeWidth = ((thresholds.severe - thresholds.moderate) / maxXP) * 100
  const extremeWidth = ((thresholds.extreme - thresholds.severe) / maxXP) * 100
  const beyondWidth = 100 - trivialWidth - lowWidth - moderateWidth - severeWidth - extremeWidth

  // Current XP indicator position
  const indicatorPosition = Math.min((currentXP / maxXP) * 100, 100)

  return (
    <div className={cn("space-y-2", className)}>
      {/* Threat Level Display - Grimdark */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Threat Assessment</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold">{currentXP} XP</span>
          <span
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
              threatColors[threatLevel],
              "text-background"
            )}
          >
            {threatLevel}
          </span>
        </div>
      </div>

      {/* Progress Bar - Grimdark */}
      <div className="relative">
        <div className="flex h-2 rounded overflow-hidden bg-secondary/50 border border-border/50">
          <div
            className="bg-pf-threat-trivial/80"
            style={{ width: `${trivialWidth}%` }}
          />
          <div
            className="bg-pf-threat-low/80"
            style={{ width: `${lowWidth}%` }}
          />
          <div
            className="bg-pf-threat-moderate/80"
            style={{ width: `${moderateWidth}%` }}
          />
          <div
            className="bg-pf-threat-severe/80"
            style={{ width: `${severeWidth}%` }}
          />
          <div
            className="bg-pf-threat-extreme/80"
            style={{ width: `${extremeWidth}%` }}
          />
          <div
            className="bg-pf-threat-extreme/30"
            style={{ width: `${beyondWidth}%` }}
          />
        </div>

        {/* Current XP Indicator */}
        <div
          className="absolute top-0 w-0.5 h-4 -mt-1 bg-foreground shadow-lg transform -translate-x-1/2 transition-all duration-300"
          style={{ left: `${indicatorPosition}%` }}
        />
      </div>

      {/* Threshold Labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
        <span>0</span>
        <span className={threatTextColors.trivial}>Trivial: {thresholds.trivial}</span>
        <span className={threatTextColors.low}>Low: {thresholds.low}</span>
        <span className={threatTextColors.moderate}>Mod: {thresholds.moderate}</span>
        <span className={threatTextColors.severe}>Sev: {thresholds.severe}</span>
        <span className={threatTextColors.extreme}>Ext: {thresholds.extreme}</span>
      </div>
    </div>
  )
}
