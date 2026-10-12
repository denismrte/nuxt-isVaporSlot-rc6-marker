// Re-exports Nuxt's published <ClientOnly> (dist file of the installed `nuxt` package).
import { nuxtDist } from './nuxt-dist.mjs'
const mod = await import(new URL('app/components/client-only.js', nuxtDist).href)
export default mod.default
