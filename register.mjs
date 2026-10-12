// Installs the loader that lets Node import Nuxt's published runtime modules (dist/) outside a Nuxt build.
import { register } from 'node:module'
register('./loader.mjs', import.meta.url)
