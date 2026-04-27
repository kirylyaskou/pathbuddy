import { GlobalSearchModal } from '@/widgets/global-search-modal/ui'
import type { GlobalSearchResult } from '@/shared/api/global-search'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const handleSelect = (_result: GlobalSearchResult) => {
    // wiring to detail view handled in T03
  }

  return (
    <GlobalSearchModal
      open={open}
      onOpenChange={onOpenChange}
      onSelect={handleSelect}
    />
  )
}
