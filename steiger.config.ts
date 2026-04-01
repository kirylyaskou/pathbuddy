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
    files: ['src/entities/**'],
    rules: {
      // Entity slices are created before their feature-layer consumers;
      // they will be referenced once features/ and widgets/ are wired
      'fsd/insignificant-slice': 'off',
    },
  },
])
