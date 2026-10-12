// A plain VDOM component that records the default slot function it receives.
import { defineComponent, h } from 'vue'
export const seen = []
export default defineComponent({
  name: 'Probe',
  setup (_, { slots }) {
    return () => {
      seen.push(slots.default)
      return h('div', { id: 'probe' }, slots.default?.())
    }
  },
})
