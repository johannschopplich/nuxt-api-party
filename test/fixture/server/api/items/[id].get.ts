import { defineEventHandler, getRouterParam } from '#imports'

export default defineEventHandler(event => ({ id: getRouterParam(event, 'id') }))
