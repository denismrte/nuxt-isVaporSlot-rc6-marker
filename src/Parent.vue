<script setup>
// Slot content authored here is handed to VDOM components: Nuxt's head components,
// <ClientOnly>, and a probe that records the slot function it receives.
import { Title, Style, NoScript } from '../nuxt-components.mjs'
import ClientOnly from '../nuxt-client-only.mjs'
import Probe from '../probe.mjs'
</script>

<template>
  <Probe><span>probe content</span></Probe>
  <Title>Expected title</Title>
  <Style>.expected { color: red }</Style>
  <NoScript>expected noscript</NoScript>
  <ClientOnly class="forwarded-class"><span id="client-only-child">client only</span></ClientOnly>
  <ClientOnly class="forwarded-class" v-slot="slotProps"><span id="client-only-slot-props">{{ JSON.stringify(slotProps) }}</span></ClientOnly>
</template>
