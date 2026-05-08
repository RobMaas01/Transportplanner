import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

async function readEnvFile(path) {
  try {
    const text = await readFile(path, 'utf8')
    return Object.fromEntries(
      text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => {
          const [key, ...value] = line.split('=')
          return [key.trim(), value.join('=').trim()]
        }),
    )
  } catch {
    return {}
  }
}

const env = {
  ...(await readEnvFile(resolve(root, '.env'))),
  ...process.env,
}

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY ontbreken in .env.')
}

const apiUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/transportplanner_state?id=eq.main&select=data`
const response = await fetch(apiUrl, {
  headers: {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  },
})

if (!response.ok) {
  throw new Error(`Supabase export mislukt: ${response.status} ${response.statusText}`)
}

const rows = await response.json()
const state = rows?.[0]?.data

if (!state) {
  throw new Error('Geen data gevonden in transportplanner_state/main.')
}

const safeState = {
  taken: Array.isArray(state.taken) ? state.taken : [],
  aanvragen: Array.isArray(state.aanvragen) ? state.aanvragen : [],
  geblokt: Array.isArray(state.geblokt) ? state.geblokt : [],
  meld: Array.isArray(state.meld) ? state.meld : [],
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const publicPath = resolve(root, 'public', 'local-test-state.json')
const backupPath = resolve(root, 'backups', `local-test-state-${stamp}.json`)
const output = `${JSON.stringify(safeState, null, 2)}\n`

await mkdir(dirname(publicPath), { recursive: true })
await mkdir(dirname(backupPath), { recursive: true })
await writeFile(publicPath, output, 'utf8')
await writeFile(backupPath, output, 'utf8')

console.log(`Lokale testkopie gemaakt met ${safeState.aanvragen.length} aanvragen en ${safeState.taken.length} taken.`)
console.log('Bestand: public/local-test-state.json')
console.log(`Backup: ${backupPath}`)
