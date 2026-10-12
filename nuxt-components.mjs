// Re-exports Nuxt's published head components (dist file of the installed `nuxt` package).
import { nuxtDist } from './nuxt-dist.mjs'
export const { Title, Style, NoScript } = await import(new URL('head/runtime/components.js', nuxtDist).href)
