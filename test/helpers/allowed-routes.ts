import type { AllowedRoute } from '../../src/runtime/types'

export const ALLOWED_ROUTES: AllowedRoute[] = [
  { path: '/articles/**', methods: ['GET'] },
  { path: '/comments/*' },
  { path: '/café' },
]

export const ALLOWED_REQUESTS = [
  ['GET', 'articles?admin=1'],
  ['POST', 'comments/a%2Fb'],
  ['GET', 'caf%C3%A9'],
]

export const REFUSED_REQUESTS = [
  ['DELETE', 'articles/1'],
  ['GET', 'admin?/articles/1'],
  ['GET', 'admin#/articles/1'],
]
