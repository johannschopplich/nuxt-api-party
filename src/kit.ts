import { useLogger } from '@nuxt/kit'
import { name } from '../package.json'

export const logger = useLogger(name)
