import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Swords, BookOpen, Sparkles, Package,
  Activity, Map, Settings,
} from 'lucide-react'
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList,
} from '@/shared/ui/command'

const pages = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Combat Tracker', href: '/combat', icon: Swords },
  { name: 'Encounters', href: '/encounters', icon: Map },
  { name: 'Bestiary', href: '/bestiary', icon: BookOpen },
  { name: 'Spells', href: '/spells', icon: Sparkles },
  { name: 'Items', href: '/items', icon: Package },
  { name: 'Conditions', href: '/conditions', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  const runCommand = (command: () => void) => {
    onOpenChange(false)
    command()
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, creatures, spells..." />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages.map((page) => (
            <CommandItem
              key={page.href}
              onSelect={() => runCommand(() => navigate(page.href))}
            >
              <page.icon className="mr-2 h-4 w-4" />
              {page.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
