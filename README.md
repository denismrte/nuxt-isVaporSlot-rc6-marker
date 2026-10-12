# Nuxt `isVaporSlot()` never matches on Vue 3.6.0-rc.6+

Reproduction for `nuxt-nightly@5.0.0-2610091554-2b103c9` and `nuxt@4.6.1` with `vue` 3.6.0-rc.10, in Node with happy-dom (no browser, no `nuxt build`).

```sh
pnpm install
pnpm repro            # nightly: exit 1 = defect present, 0 = absent
pnpm repro:stable     # nuxt 4.6.1: exit 1
pnpm repro:patched    # nightly with isVaporSlot testing rawVaporSlotKey: exit 0
```

The script mounts Nuxt's published `dist/` modules (`isVaporSlot`, `<Title>`, `<Style>`, `<Noscript>`, `<ClientOnly>`) under a VDOM root with `vaporInteropPlugin`; a Node loader stubs the virtual modules (`#build/*`, `useHead`). The same parent is compiled once with `<script setup vapor>` and once as a VDOM control. Exit `2` means the reproduction itself broke. Logs of two runs are in `results/`.
