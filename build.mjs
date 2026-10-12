// Compiles src/Parent.vue for the client twice: once as a Vapor SFC (`<script setup vapor>`)
// and once as a regular VDOM SFC (control). Writes out/Parent.vapor.mjs and out/Parent.vdom.mjs.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { parse, compileScript } from '@vue/compiler-sfc'
const source = readFileSync('src/Parent.vue', 'utf8')
mkdirSync('out', { recursive: true })
for (const [mode, sfc] of [['vapor', source.replace('<script setup>', '<script setup vapor>')], ['vdom', source]]) {
  const { descriptor } = parse(sfc, { filename: 'Parent.vue' })
  const { content } = compileScript(descriptor, { id: 'parent-' + mode, inlineTemplate: true, templateOptions: { ssr: false }, isProd: false })
  writeFileSync(`out/Parent.${mode}.mjs`, content)
}
console.log('compiled with @vue/compiler-sfc ' + JSON.parse(readFileSync('node_modules/@vue/compiler-sfc/package.json', 'utf8')).version)
