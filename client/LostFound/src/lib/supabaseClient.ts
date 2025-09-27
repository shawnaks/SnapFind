import { createClient, SupabaseClient } from '@supabase/supabase-js'

// read env safely for Vite (import.meta.env) or CRA (process.env)
function readClientEnv() {
  const metaEnv = (typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined)
  if (metaEnv?.VITE_SUPABASE_URL && metaEnv?.VITE_SUPABASE_ANON_KEY) {
    return { url: metaEnv.VITE_SUPABASE_URL as string, key: metaEnv.VITE_SUPABASE_ANON_KEY as string }
  }

  const proc = typeof process !== 'undefined' ? (process.env as any) : undefined
  if (proc?.REACT_APP_SUPABASE_URL && proc?.REACT_APP_SUPABASE_ANON_KEY) {
    return { url: proc.REACT_APP_SUPABASE_URL as string, key: proc.REACT_APP_SUPABASE_ANON_KEY as string }
  }

  return { url: undefined, key: undefined }
}

const { url: SUPABASE_URL, key: SUPABASE_ANON_KEY } = readClientEnv()

let supabaseClient: SupabaseClient

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
} else {
  // warn and create a harmless client so importing modules don't crash during dev
  // real calls will fail — ensure you add .env.local with correct values
  // eslint-disable-next-line no-console
  console.warn('Supabase env vars missing: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or REACT_APP_*)')
  supabaseClient = createClient('', '')
}

export const supabase = supabaseClient
export default supabase