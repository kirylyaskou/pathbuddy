import { defineConfig } from 'steiger'
import fsd from '@feature-sliced/steiger-plugin'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    files: ['src/shared/hooks/**'],
    rules: {
      // shared/hooks is a conventional segment name for React hooks;
      // FSD recommends purpose-based names but hooks is widely accepted
      'fsd/segments-by-purpose': 'off',
    },
  },
  {
    files: ['src/entities/**', 'src/features/**'],
    rules: {
      // New slices created before their upper-layer consumers;
      // will be referenced once widgets/ and pages/ wire them
      'fsd/insignificant-slice': 'off',
    },
  },
  {
    // Phase 67 (SPELLCAST-U-01..02): SpellcastingBlock lives in entities/ for
    // historic reasons (consumed by CreatureStatBlock) but must plug into the
    // shared `features/spellcasting-editor` — CONTEXT.md D-67-01/03 sanctions
    // this entities → features edge. Custom creature builder is the second
    // caller; FSD cross-slice rule fires for intentional feature composition.
    files: [
      'src/entities/creature/ui/SpellcastingBlock.tsx',
      'src/features/custom-creature-builder/ui/tabs/SpellcastingTab.tsx',
    ],
    rules: {
      'fsd/forbidden-imports': 'off',
    },
  },
])
