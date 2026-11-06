import { defineEventHandler, getQuery } from '#imports'

export default defineEventHandler(event => getQuery(event))
