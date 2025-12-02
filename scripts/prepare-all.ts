#!/usr/bin/env zx
/*
* Prepare all Nuxt projects in the repository using glob patterns.
*/
/// <reference types="zx/globals" />

import { dirname } from 'node:path'

$ = $({
  verbose: true,
  stdio: 'inherit',
})

const configFiles = await globby('**/nuxt.config.ts', {
  deep: 3,
  ignore: ['**/node_modules/**'],
})

await $`nuxt-build-module build --stub`
await $`nuxt-build-module prepare`

for (const file of configFiles) {
  await $`nuxt prepare ${dirname(file)}`
}
