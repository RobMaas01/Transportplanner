import { supabase, supabaseConfigured } from './supabaseClient'

const STATE_ID = 'main'

export { supabaseConfigured }

export function isLegeState(state) {
  return (
    (!state?.taken || state.taken.length === 0) &&
    (!state?.aanvragen || state.aanvragen.length === 0) &&
    (!state?.geblokt || state.geblokt.length === 0) &&
    (!state?.meld || state.meld.length === 0)
  )
}

export async function laadCentraleState() {
  if (!supabaseConfigured) return { data: null, error: null }

  const { data, error } = await supabase.from('transportplanner_state').select('data, updated_at').eq('id', STATE_ID).single()
  if (error) return { data: null, updatedAt: null, error }

  return { data: data?.data || null, updatedAt: data?.updated_at || null, error: null }
}

export async function bewaarCentraleState(state) {
  if (!supabaseConfigured) return { error: null }

  const updatedAt = new Date().toISOString()
  const { error } = await supabase.from('transportplanner_state').upsert({
    id: STATE_ID,
    data: state,
    updated_at: updatedAt,
  })

  return { updatedAt, error }
}
