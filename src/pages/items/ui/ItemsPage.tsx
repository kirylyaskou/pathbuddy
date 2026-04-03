import { useState, useEffect } from 'react'
import { Package } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { searchItems } from '@/shared/api'
import type { ItemRow } from '@/shared/api'
import { useItemsCatalogStore, ItemFilterPanel, ItemsTable } from '@/features/items-catalog'
import { ItemReferenceDrawer } from '@/entities/item'
import { useShallow } from 'zustand/react/shallow'

export function ItemsPage() {
  const {
    query, selectedType, minLevel, maxLevel, selectedRarity,
    selectedTraits, selectedSource, selectedSubcategory,
    sortField, sortDir, toggleSort, hasActiveFilters, clearFilters,
  } = useItemsCatalogStore(useShallow((s) => ({
    query: s.query,
    selectedType: s.selectedType,
    minLevel: s.minLevel,
    maxLevel: s.maxLevel,
    selectedRarity: s.selectedRarity,
    selectedTraits: s.selectedTraits,
    selectedSource: s.selectedSource,
    selectedSubcategory: s.selectedSubcategory,
    sortField: s.sortField,
    sortDir: s.sortDir,
    toggleSort: s.toggleSort,
    hasActiveFilters: s.hasActiveFilters,
    clearFilters: s.clearFilters,
  })))

  const [items, setItems] = useState<ItemRow[]>([])
  const [loading, setLoading] = useState(false)
  const [drawerItemId, setDrawerItemId] = useState<string | null>(null)

  useEffect(() => {
    setItems([])
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const results = await searchItems(
          query,
          selectedType ?? undefined,
          minLevel ? parseInt(minLevel) : undefined,
          maxLevel ? parseInt(maxLevel) : undefined,
          selectedRarity ?? undefined,
          selectedTraits.length > 0 ? selectedTraits : undefined,
          selectedSource ?? undefined,
          selectedSubcategory ?? undefined,
        )
        setItems(results)
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [query, selectedType, minLevel, maxLevel, selectedRarity, selectedTraits, selectedSource, selectedSubcategory])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Tabs defaultValue="all" className="flex flex-col h-full overflow-hidden">
        <TabsList className="shrink-0 mx-3 mt-2">
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex flex-col flex-1 overflow-hidden mt-0 min-h-0">
          <ItemFilterPanel />

          {/* Count row */}
          <div className="px-3 py-1.5 shrink-0 border-b border-border/30">
            <p className="text-xs text-muted-foreground">
              {loading ? 'Searching\u2026' : `${items.length} item${items.length !== 1 ? 's' : ''}`}
              {hasActiveFilters() && (
                <button onClick={clearFilters} className="ml-2 text-primary hover:underline">
                  clear filters
                </button>
              )}
            </p>
          </div>

          {/* Table or empty state */}
          {items.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Package className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">
                {query || hasActiveFilters()
                  ? 'No items match the current filters.'
                  : 'Run sync to import equipment from Foundry VTT.'}
              </p>
              {hasActiveFilters() && (
                <button onClick={clearFilters} className="text-xs text-primary hover:underline mt-1">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <ItemsTable
              items={items}
              sortField={sortField}
              sortDir={sortDir}
              onToggleSort={toggleSort}
              onItemClick={setDrawerItemId}
            />
          )}
        </TabsContent>

        <TabsContent value="favorites" className="flex flex-col flex-1 overflow-hidden mt-0">
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">No favorites yet</p>
            <p className="text-xs mt-1">Star an item from the All Items tab to save it here.</p>
          </div>
        </TabsContent>
      </Tabs>

      <ItemReferenceDrawer itemId={drawerItemId} onClose={() => setDrawerItemId(null)} />
    </div>
  )
}
