// Stand-in for Nuxt's `useHead`: records every input object the head components patch in.
export const headLog = []
export function useHead (input) {
  const entry = { patch: (next) => { headLog.push(JSON.parse(JSON.stringify(next))) } }
  return entry
}
