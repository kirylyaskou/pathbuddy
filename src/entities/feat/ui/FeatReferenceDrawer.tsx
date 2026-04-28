import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetFooter } from '@/shared/ui/sheet'
import { Button } from '@/shared/ui/button'
import { FeatInlineCard } from './FeatInlineCard'

interface FeatReferenceDrawerProps {
  featName: string | null
  onClose: () => void
}

export function FeatReferenceDrawer({ featName, onClose }: FeatReferenceDrawerProps) {
  return (
    <Sheet open={featName !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{featName ?? ''}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          {featName && <FeatInlineCard featName={featName} />}
        </div>
        <SheetFooter className="mt-6">
          <SheetClose asChild>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
