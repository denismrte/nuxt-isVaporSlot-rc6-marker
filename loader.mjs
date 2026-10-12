// Node module hooks standing in for the Nuxt client build:
//  - `vue` and `@vue/*` resolve to their esm-bundler builds (the Node entry of `vue` has no Vapor runtime);
//  - Nuxt's virtual `#build/*` and `#app/*` modules resolve to the stubs in ./stubs or to the real dist file;
//  - in Nuxt's dist files `import.meta.dev` / `import.meta.client` are replaced as the Vite client dev build does;
//  - with PATCH_IS_VAPOR_SLOT=1, Nuxt's isVaporSlot() is rewritten to test Vue's `rawVaporSlotKey` (the suggested fix).
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const here = new URL('./', import.meta.url)
const require = createRequire(import.meta.url)
const nuxtDist = new URL('dist/', pathToFileURL(require.resolve((process.env.NUXT_PKG || 'nuxt') + '/package.json')))

const esmBundler = {
  'vue': 'vue/dist/vue.runtime.esm-bundler.js',
}
const aliases = {
  '#build/nuxt.config.mjs': new URL('stubs/nuxt.config.mjs', here).href,
  '#build/pages': new URL('stubs/pages.mjs', here).href,
  '#app/composables/head': new URL('stubs/head.mjs', here).href,
  '#app/components/utils': new URL('app/components/utils.js', nuxtDist).href,
}

export async function resolve(specifier, context, next) {
  if (aliases[specifier]) return { url: aliases[specifier], shortCircuit: true }
  if (specifier in esmBundler) return next(esmBundler[specifier], { ...context, conditions: ['import', 'default'] })
  if (/^@vue\/(runtime-core|runtime-dom|runtime-vapor|reactivity|shared)$/.test(specifier)) {
    const pkg = specifier.split('/').slice(0, 2).join('/')
    const base = context.parentURL ? fileURLToPath(context.parentURL) : process.cwd()
    const pkgJsonPath = createRequire(base).resolve(pkg + '/package.json')
    const pj = require(pkgJsonPath)
    return { url: new URL(pj.module, pathToFileURL(pkgJsonPath)).href, shortCircuit: true, format: 'module' }
  }
  const r = await next(specifier, context)
  // client-only.js imports ../nuxt.js only for a dev-time bookkeeping flag; stub it.
  if (r.url === new URL('app/nuxt.js', nuxtDist).href) return { url: new URL('stubs/nuxt-app.mjs', here).href, shortCircuit: true }
  return r
}

export async function load(url, context, next) {
  const r = await next(url, context)
  if (url.startsWith(nuxtDist.href) && r.source) {
    const src = String(r.source)
      .replaceAll('import.meta.dev', 'true')
      .replaceAll('import.meta.client', 'true')
      .replaceAll('import.meta.server', 'false')
      .replaceAll('import.meta.test', 'true')
    if (process.env.PATCH_IS_VAPOR_SLOT === '1' && url.endsWith('/app/components/utils.js')) {
      const patched = src
        .replace('import { Transition, createStaticVNode, h } from "vue";', 'import { Transition, createStaticVNode, h, rawVaporSlotKey } from "vue";')
        .replace('return !!slot && (!!slot.__vapor || !!slot.__vs);', 'return !!slot && !!slot[rawVaporSlotKey];')
      if (patched.split('rawVaporSlotKey').length !== 3) throw new Error('patch did not apply')
      return { ...r, source: patched, format: 'module' }
    }
    return { ...r, source: src, format: 'module' }
  }
  return r
}
