// Location of the installed `nuxt` package's published dist/ directory (its exports map hides deep paths).
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
const require = createRequire(import.meta.url)
export const nuxtDist = new URL('dist/', pathToFileURL(require.resolve((process.env.NUXT_PKG || 'nuxt') + '/package.json')))
