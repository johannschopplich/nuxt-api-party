import { defineEventHandler } from '#imports'

let hits = 0

export default defineEventHandler(() => ({ hits: ++hits }))
