import { cn } from "@/shared/lib/utils"

type Rarity = "common" | "uncommon" | "rare" | "unique"
type Size = "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan"

interface TraitPillProps {
  trait: string
  rarity?: Rarity
  size?: Size
  className?: string
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

export function TraitPill({ trait, rarity, size, className }: TraitPillProps) {
  const isSize = size !== undefined
  const isRarity = rarity !== undefined && rarity !== "common"

  return (
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
      {trait}
    </span>
  )
}

interface TraitListProps {
  traits: string[]
  rarity?: Rarity
  size?: Size
  className?: string
  showRarity?: boolean
  showSize?: boolean
}

export function TraitList({ traits, rarity, size, className, showRarity = true, showSize = true }: TraitListProps) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {showRarity && rarity && rarity !== "common" && (
        <TraitPill trait={rarity} rarity={rarity} />
      )}
      {showSize && size && (
        <TraitPill trait={size} size={size} />
      )}
      {traits.map((trait) => (
        <TraitPill key={trait} trait={trait} />
      ))}
    </div>
  )
}
