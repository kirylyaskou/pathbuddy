import { useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import type { BuilderTabsProps } from '../BuilderTabs'
import { BenchmarkHint } from '../BenchmarkHint'

export function PerceptionSkillsTab({ state, dispatch }: BuilderTabsProps) {
  const { t } = useTranslation('common')
  const { form } = state
  const [skillNameInput, setSkillNameInput] = useState('')
  const [skillModInput, setSkillModInput] = useState(0)

  function addSkill() {
    const name = skillNameInput.trim()
    if (!name) return
    dispatch({ type: 'ADD_SKILL', entry: { name, modifier: skillModInput } })
    setSkillNameInput('')
    setSkillModInput(0)
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-base font-semibold">{t('customCreatureBuilder.perceptionSkillsTab.heading')}</h2>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="perc">{t('customCreatureBuilder.perceptionSkillsTab.perception')}</Label>
          <BenchmarkHint
            stat="perception"
            level={form.level}
            value={form.perception}
            onSelectTier={(v) =>
              dispatch({ type: 'SET_FIELD', path: 'perception', value: v })
            }
          />
        </div>
        <Input
          id="perc"
          type="number"
          className="font-mono"
          value={form.perception}
          onChange={(e) =>
            dispatch({ type: 'SET_FIELD', path: 'perception', value: Number(e.target.value) })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>{t('customCreatureBuilder.perceptionSkillsTab.skills')}</Label>
        <div className="flex items-center gap-2">
          <Input
            value={skillNameInput}
            onChange={(e) => setSkillNameInput(e.target.value)}
            placeholder={t('customCreatureBuilder.perceptionSkillsTab.skillNamePlaceholder')}
          />
          <Input
            type="number"
            className="font-mono w-20"
            value={skillModInput}
            onChange={(e) => setSkillModInput(Number(e.target.value))}
          />
          <Button size="sm" variant="outline" onClick={addSkill}>
            {t('customCreatureBuilder.conceptTab.addTraitButton')}
          </Button>
        </div>
        <div className="space-y-1 pt-2">
          {form.skills.length === 0 && (
            <p className="text-xs text-muted-foreground">{t('customCreatureBuilder.perceptionSkillsTab.noSkillsAdded')}</p>
          )}
          {form.skills.map((s, i) => (
            <div
              key={`${s.name}-${i}`}
              className="flex items-center gap-2 bg-secondary/30 rounded-md px-2 py-1.5"
            >
              <span className="flex-1 text-sm font-medium truncate">{s.name}</span>
              <Input
                type="number"
                className="font-mono w-20"
                value={s.modifier}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_SKILL',
                    index: i,
                    entry: { ...s, modifier: Number(e.target.value) },
                  })
                }
              />
              <BenchmarkHint
                stat="skill"
                level={form.level}
                value={s.modifier}
                compact
                onSelectTier={(v) =>
                  dispatch({
                    type: 'UPDATE_SKILL',
                    index: i,
                    entry: { ...s, modifier: v },
                  })
                }
              />
              <button
                type="button"
                aria-label={t('customCreatureBuilder.perceptionSkillsTab.removeSkillAriaLabel', { name: s.name })}
                onClick={() => dispatch({ type: 'REMOVE_SKILL', index: i })}
                className="p-1 text-muted-foreground hover:text-destructive"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
