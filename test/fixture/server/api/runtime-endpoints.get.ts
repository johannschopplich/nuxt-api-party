import { defineEventHandler, useRuntimeConfig } from '#imports'

export default defineEventHandler(event => useRuntimeConfig(event).apiParty.endpoints)
