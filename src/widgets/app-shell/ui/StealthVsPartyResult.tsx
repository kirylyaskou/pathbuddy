import type { StealthVsPartyRow } from '@/shared/lib/stealth-vs-party'

interface StealthVsPartyResultProps {
  rows: StealthVsPartyRow[]
  onClose: () => void
}

export function StealthVsPartyResult({ rows, onClose }: StealthVsPartyResultProps) {
  if (rows.length === 0) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-72 rounded-md border border-border bg-background shadow-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">Stealth vs Party</span>
          <button
            className="text-muted-foreground hover:text-foreground text-xs"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-muted-foreground">No NPCs in encounter.</p>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-md border border-border bg-background shadow-lg p-3 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">Stealth vs Party</span>
        <button
          className="text-muted-foreground hover:text-foreground text-xs leading-none"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.npcId} className="text-xs">
            <div className="font-medium text-foreground">
              {row.npcName}
              {row.stealthDc != null ? (
                <span className="ml-1 text-muted-foreground font-normal">
                  (DC {row.stealthDc})
                </span>
              ) : (
                <span className="ml-1 text-muted-foreground font-normal italic">(нет блока)</span>
              )}
            </div>

            {row.pcChecks.length === 0 && (
              <p className="mt-0.5 text-muted-foreground">No PCs in encounter.</p>
            )}

            <ul className="mt-1 space-y-0.5 pl-2">
              {row.pcChecks.map((check) => (
                <li key={check.pcId} className="flex items-center gap-1.5">
                  <span
                    className={
                      check.spots === true
                        ? 'text-green-600 dark:text-green-400'
                        : check.spots === false
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-muted-foreground'
                    }
                  >
                    {check.spots === true ? '●' : check.spots === false ? '○' : '?'}
                  </span>
                  <span className="text-foreground">{check.pcName}</span>
                  {check.perception != null && (
                    <span className="text-muted-foreground">
                      Perc {check.perception >= 0 ? '+' : ''}{check.perception}
                    </span>
                  )}
                  {check.perception == null && (
                    <span className="text-muted-foreground">no stat block</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
