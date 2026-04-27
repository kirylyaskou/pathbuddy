import { GlobalSearchModal } from '@/widgets/global-search-modal/ui'
import type { GlobalSearchResult } from '@/shared/api/global-search'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (result: GlobalSearchResult) => void
}

export function CommandPalette({ open, onOpenChange, onSelect }: CommandPaletteProps) {
  return (
    <GlobalSearchModal
      open={open}
      onOpenChange={onOpenChange}
      onSelect={onSelect}
    />
  )
}
