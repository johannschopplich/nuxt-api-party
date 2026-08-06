import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    typecheck: {
      enabled: true,
      // Nitro's route-matching types blow the instantiation depth when `src` is compiled
      // without the generated route registry. `test:types` checks the sources properly.
      ignoreSourceErrors: true,
    },
  },
})
