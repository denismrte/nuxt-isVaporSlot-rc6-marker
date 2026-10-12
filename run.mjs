// Mounts the same parent template twice in happy-dom: compiled as a Vapor SFC under `vaporInteropPlugin`
// (the setup `vue: { vapor: true }` gives a Nuxt client), and compiled as a VDOM SFC (control).
// Nuxt's published `isVaporSlot`, <Title>, <Style>, <NoScript> and <ClientOnly> run from the installed dist.
// Exit 0: Nuxt's `isVaporSlot` recognises the Vapor slot. Exit 1: it does not (defect present).
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { Window } from 'happy-dom'

// Vue esm-bundler compile-time flags, as a bundler defines them.
Object.assign(globalThis, { __VUE_OPTIONS_API__: true, __VUE_PROD_DEVTOOLS__: false, __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false })
const window = new Window({ url: 'http://localhost/' })
for (const key of ['window', 'document', 'navigator', 'Node', 'Element', 'HTMLElement', 'SVGElement', 'Text', 'Comment',
  'DocumentFragment', 'MutationObserver', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'CustomEvent', 'Event']) {
  const value = key === 'window' ? window : (typeof window[key] === 'function' && !/^[A-Z]/.test(key) ? window[key].bind(window) : window[key])
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
}
// Any crash of the rig itself exits 2, never 1.
process.on('uncaughtException', (e) => { console.error(e); process.exit(2) })
process.on('unhandledRejection', (e) => { console.error(e); process.exit(2) })

const diagnostics = []
for (const method of ['warn', 'error']) {
  const original = console[method]
  console[method] = (...args) => {
    const text = args.map(String).join(' ')
    const code = text.match(/NUXT_E\d+/)?.[0]
    if (code) diagnostics.push(code)
    else original(...args)
  }
}

const require = createRequire(import.meta.url)
const vue = await import('vue')
const { createApp, h, nextTick, vaporInteropPlugin, rawVaporSlotKey, version } = vue
const { isVaporSlot } = await import('#app/components/utils')
const { headLog } = await import('#app/composables/head')
const { seen } = await import('./probe.mjs')

const nuxtPkg = require((process.env.NUXT_PKG || 'nuxt') + '/package.json')
const nuxtVersion = `${nuxtPkg.name}@${nuxtPkg.version}`
console.log(`vue ${version} · ${nuxtVersion}${process.env.PATCH_IS_VAPOR_SLOT === '1' ? ' (isVaporSlot patched to rawVaporSlotKey)' : ''} · happy-dom ${require('happy-dom/package.json').version} · node ${process.version}`)

async function mountArm (mode) {
  seen.length = 0
  headLog.length = 0
  diagnostics.length = 0
  const { default: Parent } = await import(`./out/Parent.${mode}.mjs`)
  const el = document.createElement('div')
  document.body.appendChild(el)
  const app = createApp({ render: () => h(Parent) })
  if (mode === 'vapor') app.use(vaporInteropPlugin)
  app.mount(el)
  await nextTick()
  await nextTick()
  const slot = seen[0]
  const last = (key) => headLog.filter(e => key in e).at(-1)?.[key]
  const clientOnlyChild = el.querySelector('#client-only-child')
  const result = {
    mode,
    'slot carries Vue rawVaporSlotKey': !!(slot && slot[rawVaporSlotKey]),
    'slot carries __vapor / __vs': !!(slot && (slot.__vapor || slot.__vs)),
    'nuxt isVaporSlot(slot)': isVaporSlot(slot),
    '<Title> title passed to useHead': last('title') ?? null,
    '<Style> textContent passed to useHead': last('style')?.find(Boolean)?.textContent ?? null,
    '<NoScript> textContent passed to useHead': last('noscript')?.find(Boolean)?.textContent ?? null,
    '<ClientOnly> child rendered': !!clientOnlyChild,
    '<ClientOnly> child class': clientOnlyChild?.getAttribute('class') ?? null,
    '<ClientOnly> scoped slot props received': el.querySelector('#client-only-slot-props')?.textContent ?? null,
    'Nuxt dev diagnostics emitted': [...new Set(diagnostics)].sort(),
  }
  app.unmount()
  el.remove()
  return result
}

const vapor = await mountArm('vapor')
const vdom = await mountArm('vdom')
for (const r of [vapor, vdom]) {
  console.log(`\n[${r.mode}]`)
  for (const [k, v] of Object.entries(r)) if (k !== 'mode') console.log(`  ${k}: ${JSON.stringify(v)}`)
}

const defect = vapor['slot carries Vue rawVaporSlotKey'] && !vapor['nuxt isVaporSlot(slot)']
const controlOk = !vdom['slot carries Vue rawVaporSlotKey'] && !vdom['nuxt isVaporSlot(slot)'] && vdom['<Title> title passed to useHead'] === 'Expected title'
console.log(`\ncontrol (vdom) arm as expected: ${controlOk}`)
console.log(defect
  ? 'DEFECT PRESENT: Vue marks the slot as a Vapor slot (rawVaporSlotKey) but Nuxt isVaporSlot() returns false'
  : 'defect absent: Nuxt isVaporSlot() recognises the Vapor slot')
await window.happyDOM.close()
process.exit(!controlOk ? 2 : defect ? 1 : 0)
