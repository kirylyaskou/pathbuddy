import { useState, useEffect } from 'react'
import { Search, AlertTriangle } from 'lucide-react'
import { Input } from '@/shared/ui/input'
import { searchHazards } from '@/shared/api'
import type { HazardRow } from '@/shared/api'
import { useDraggable } from '@dnd-kit/core'

function DraggableHazardRow({ row, children }: { row: HazardRow; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `hazard-${row.id}`,
    data: { type: 'hazard-add', hazardRow: row },
  })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.4 : 1, cursor: 'grab' }}
    >
      {children}
    </div>
  )
}

export function HazardSearchPanel() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<HazardRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const rows = await searchHazards(query, 50)
        if (!cancelled) setResults(rows)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    const timer = setTimeout(run, 200)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [query])

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hazards..."
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1.5">
          {loading && results.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Searching...</p>
          )}
          {!loading && results.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No hazards found</p>
          )}
          {results.map((row) => (
            <DraggableHazardRow key={row.id} row={row}>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/30 border border-amber-800/20 bg-amber-950/10">
                <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="flex-1 text-sm truncate text-amber-200/90">{row.name}</span>
                <span className="text-xs font-mono text-muted-foreground shrink-0">
                  Lv{row.level}
                </span>
                {row.stealth_dc != null && (
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    DC{row.stealth_dc}
                  </span>
                )}
              </div>
            </DraggableHazardRow>
          ))}
        </div>
      </div>
    </div>
  )
}
