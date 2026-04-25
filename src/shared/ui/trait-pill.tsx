import { cn } from "@/shared/lib/utils"
import { useCurrentLocale } from "@/shared/i18n"
import {
  getTraitLabel,
  getTraitDescription,
  getSizeLabel,
} from "@/shared/i18n/pf2e-content"
import { unmapSize } from "@/shared/lib/size-map"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./tooltip"

type Rarity = "common" | "uncommon" | "rare" | "unique"
type Size = "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan"

interface TraitPillProps {
  trait: string
  rarity?: Rarity
  size?: Size
  className?: string
  /**
   * When the parent component already supplies a localized display string
   * (e.g. parser-derived `traitsLoc`), set `localized` to skip the dict
   * lookup. The pill renders `trait` verbatim and shows no tooltip.
   */
  localized?: boolean
}

const rarityColors: Record<Rarity, string> = {
  common: "bg-secondary text-secondary-foreground",
  uncommon: "bg-pf-rarity-uncommon/20 text-pf-rarity-uncommon border-pf-rarity-uncommon",
  rare: "bg-pf-rarity-rare/20 text-pf-rarity-rare border-pf-rarity-rare",
  unique: "bg-pf-rarity-unique/20 text-pf-rarity-unique border-pf-rarity-unique",
}

const sizeColors: Record<Size, string> = {
  Tiny: "bg-pf-threat-low/20 text-pf-threat-low",
  Small: "bg-pf-threat-low/20 text-pf-threat-low",
  Medium: "bg-secondary text-secondary-foreground",
  Large: "bg-pf-threat-moderate/20 text-pf-threat-moderate",
  Huge: "bg-pf-threat-severe/20 text-pf-threat-severe",
  Gargantuan: "bg-pf-threat-extreme/20 text-pf-threat-extreme",
}

export function TraitPill({ trait, rarity, size, className, localized }: TraitPillProps) {
  const locale = useCurrentLocale()
  const isSize = size !== undefined
  const isRarity = rarity !== undefined && rarity !== "common"

  // localized=true: parent already translated; render verbatim, no tooltip.
  // size pill: route through getSizeLabel (engine slug via unmapSize).
  // rarity / generic trait: route through getTraitLabel (slug lowercased).
  let displayLabel: string
  let description: string | null = null

  if (localized) {
    displayLabel = trait
  } else if (isSize) {
    displayLabel = getSizeLabel(unmapSize(size), locale)
  } else if (isRarity) {
    displayLabel = getTraitLabel(rarity, locale)
    description = getTraitDescription(rarity, locale)
  } else {
    const slug = trait.toLowerCase()
    displayLabel = getTraitLabel(slug, locale)
    description = getTraitDescription(slug, locale)
  }

  const pill = (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
        isRarity && rarityColors[rarity],
        isSize && sizeColors[size],
        !isRarity && !isSize && "bg-secondary/80 text-secondary-foreground",
        isRarity && "border",
        className
      )}
    >
      {displayLabel}
    </span>
  )

  if (description === null) return pill

  return (
    <TooltipProvider delayDuration={250}>
      <Tooltip>
        <TooltipTrigger asChild>{pill}</TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs whitespace-pre-wrap">
          {description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface TraitListProps {
  traits: string[]
  rarity?: Rarity
  size?: Size
  className?: string
  showRarity?: boolean
  showSize?: boolean
  /** Pass-through to underlying TraitPill — see TraitPillProps. */
  localized?: boolean
}

export function TraitList({
  traits,
  rarity,
  size,
  className,
  showRarity = true,
  showSize = true,
  localized,
}: TraitListProps) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {showRarity && rarity && rarity !== "common" && (
        <TraitPill trait={rarity} rarity={rarity} localized={localized} />
      )}
      {showSize && size && (
        <TraitPill trait={size} size={size} localized={localized} />
      )}
      {traits.map((trait) => (
        <TraitPill key={trait} trait={trait} localized={localized} />
      ))}
    </div>
  )
}
