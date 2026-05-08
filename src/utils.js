import { DAGEN, SCHOOLVAKANTIES_NOORD, STATUS } from './constants'

export function getWeekKey(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const y = d.getFullYear()
  const w = Math.ceil(((d - new Date(y, 0, 1)) / 86400000 + 1) / 7)
  return `${y}-W${String(w).padStart(2, '0')}`
}

export function getMaandag(wk) {
  const parts = wk.split('-W')
  const y = Number(parts[0])
  const w = Number(parts[1])
  const d = new Date(y, 0, 1 + (w - 1) * 7)
  const day = d.getDay()
  d.setDate(d.getDate() + (day <= 4 ? 1 - day : 8 - day))
  return d
}

export function fmt(d) {
  return d.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function fmtS(d) {
  return d.toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })
}

export function isoDag(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function weekDagen(wk) {
  const ma = getMaandag(wk)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(ma)
    d.setDate(ma.getDate() + i)
    return d
  })
}

export function weekWerkdagen(wk) {
  return weekDagen(wk).slice(0, 5)
}

export function verschuifWeek(wk, stap) {
  const d = getMaandag(wk)
  d.setDate(d.getDate() + stap * 7)
  return getWeekKey(d)
}

export function taakDatum(taak) {
  const d = getMaandag(taak.week)
  d.setDate(d.getDate() + Number(taak.dag || 0))
  return d
}

export function weekNr(wk) {
  return `Week ${wk.split('-W')[1]}`
}

export function weekRange(wk) {
  const ma = getMaandag(wk)
  const vr = new Date(ma)
  vr.setDate(ma.getDate() + 4)
  return `${fmt(ma)} - ${fmt(vr)}`
}

export function weekOptieLabel(wk) {
  const blokkade = automatischeBlokkade(wk)
  const suffix = blokkade ? ` - let op: ${blokkade.reden.replace('Automatisch: ', '')}` : ''
  return `${weekNr(wk)} - ${weekRange(wk)}${suffix}`
}

export function aanvraagWeekLabel(wk) {
  if (wk === 'zsm') return 'Zo snel mogelijk'
  return weekOptieLabel(wk)
}

export function aanvraagMomentLabel(item) {
  if (!item || item.week === 'zsm') return 'Zo snel mogelijk'
  if (Number(item.dag) < 0) return `${aanvraagWeekLabel(item.week)}, dag flexibel`
  return `${aanvraagWeekLabel(item.week)}, ${dagLabel(item.dag)}`
}

export function dagLabel(dag) {
  const index = Number(dag)
  if (index < 0) return 'Maakt niet uit'
  return DAGEN[index] || 'Nog niet gekozen'
}

export function routeLabel(van, naar) {
  if (!van && !naar) return 'Geen route gekozen'
  if (van && naar) return `Van ${van} | Naar ${naar}`
  if (van) return `Van ${van}`
  return `Naar ${naar}`
}

export function wekenTussen(start, eind) {
  if (!start) return []
  const weken = []
  const cursor = getMaandag(start)
  const laatste = getMaandag(eind || start)

  while (cursor <= laatste) {
    weken.push(getWeekKey(cursor))
    cursor.setDate(cursor.getDate() + 7)
  }

  return weken
}

export function datum(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function weekVoorVakantie(iso) {
  const d = datum(iso)
  d.setDate(d.getDate() - 1)
  return getWeekKey(d)
}

export function weekNaVakantie(iso) {
  const d = datum(iso)
  d.setDate(d.getDate() + 1)
  return getWeekKey(d)
}

export function automatischeBlokkade(wk) {
  for (const vakantie of SCHOOLVAKANTIES_NOORD) {
    if (weekVoorVakantie(vakantie.start) === wk) {
      return {
        week: wk,
        reden: `Automatisch: drukte rond ${vakantie.naam} regio Noord`,
        automatisch: true,
      }
    }
    if (weekNaVakantie(vakantie.eind) === wk) {
      return {
        week: wk,
        reden: `Automatisch: drukte rond ${vakantie.naam} regio Noord`,
        automatisch: true,
      }
    }
  }
  return null
}

export function automatischeBlokkades() {
  const map = new Map()
  SCHOOLVAKANTIES_NOORD.forEach((vakantie) => {
    const voor = weekVoorVakantie(vakantie.start)
    const na = weekNaVakantie(vakantie.eind)
    map.set(voor, {
      week: voor,
      reden: `Week voor ${vakantie.naam} regio Noord`,
    })
    map.set(na, {
      week: na,
      reden: `Week na ${vakantie.naam} regio Noord`,
    })
  })
  return Array.from(map.values()).sort((a, b) => getMaandag(a.week) - getMaandag(b.week))
}

export function bronLabel(bron) {
  if (bron === 'aanvraag') return 'Aanvraag'
  if (bron === 'leidinggevende') return 'Opdracht'
  return 'Bert'
}

function laadLokaal(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch (error) {
    console.error('Lokale opslag kon niet worden geladen.', error)
    return fallback
  }
}

export const LOKALE_KEYS = {
  taken: 't5',
  aanvragen: 'a5',
  geblokt: 'g5',
  meld: 'm5',
}

export function laadLokaleState() {
  return {
    taken: laadLokaal(LOKALE_KEYS.taken, []),
    aanvragen: laadLokaal(LOKALE_KEYS.aanvragen, []),
    geblokt: laadLokaal(LOKALE_KEYS.geblokt, []),
    meld: laadLokaal(LOKALE_KEYS.meld, []),
  }
}

export function vandaag() {
  return getWeekKey(new Date())
}

export function vandaagWerkdagIndex() {
  const dag = new Date().getDay()
  if (dag === 0 || dag === 6) return 0
  return dag - 1
}

export function vandaagDagIndex() {
  return (new Date().getDay() + 6) % 7
}

export function standaardAanvraag() {
  return {
    aanvrager: '',
    titel: '',
    omschrijving: '',
    van: '',
    naar: '',
    week: 'zsm',
    dag: -1,
    prioriteit: 'normaal',
    prive: false,
  }
}

export function maakWeken(start, n) {
  const r = []
  const d = getMaandag(start)
  for (let i = 0; i < n; i += 1) {
    r.push(getWeekKey(d))
    d.setDate(d.getDate() + 7)
  }
  return r
}

export function maandLabel(value) {
  const [jaar, maand] = value.split('-').map(Number)
  return new Date(jaar, maand - 1, 1).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
}

export function verschuifMaand(value, stap) {
  const [jaar, maand] = value.split('-').map(Number)
  const d = new Date(jaar, maand - 1 + stap, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function jaarMaanden(jaar) {
  return Array.from({ length: 12 }, (_, index) => `${jaar}-${String(index + 1).padStart(2, '0')}`)
}

export function isVerledenDatum(date) {
  return isoDag(date) < isoDag(new Date())
}

export function maandDagen(value) {
  const [jaar, maand] = value.split('-').map(Number)
  const start = new Date(jaar, maand - 1, 1)
  const cursor = new Date(start)
  const offset = (cursor.getDay() + 6) % 7
  cursor.setDate(cursor.getDate() - offset)
  const dagen = []

  while (dagen.length < 42) {
    const d = new Date(cursor)
    dagen.push({
      date: d,
      iso: isoDag(d),
      inMaand: d.getMonth() === start.getMonth(),
      isWerkdag: d.getDay() >= 1 && d.getDay() <= 5,
      week: getWeekKey(d),
      dagIndex: (d.getDay() + 6) % 7,
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  const lastWeek = dagen.slice(-7)
  if (!lastWeek.some((dag) => dag.inMaand)) return dagen.slice(0, -7)
  return dagen
}

export function heeftErrors(errors) {
  return Object.values(errors).some(Boolean)
}

export function aanvraagIsOpen(item) {
  return ['nieuw', 'info', 'ingepland'].includes(item.status)
}

export function aanvraagIsAfgesloten(item) {
  return item.status === 'voltooid' && !aanvraagIsHistorie(item)
}

export function itemDatum(item) {
  const basis = item.voltooidOp || item.behandeld || item.bijgewerkt || item.aangemaakt
  return basis ? new Date(basis) : null
}

export function isOuderDanMaanden(item, maanden) {
  const datum = itemDatum(item)
  if (!datum || Number.isNaN(datum.getTime())) return false
  const grens = new Date()
  grens.setMonth(grens.getMonth() - maanden)
  return datum < grens
}

export function aanvraagIsHistorie(item) {
  if (item.status !== 'voltooid') return false
  return isOuderDanMaanden(item, 1)
}

export function aanvraagZichtbaarVoorAanvrager(item) {
  if (item.prive) return false
  if (item.status === 'verwijderd') return false
  if (item.status === 'voltooid' && aanvraagIsHistorie(item)) return false
  if (item.status === 'afgewezen') return false
  return true
}

export function sortAanvragen(a, b) {
  const prio = { hoog: 0, normaal: 1, laag: 2 }
  const verschil = (prio[a.prioriteit || 'normaal'] ?? 1) - (prio[b.prioriteit || 'normaal'] ?? 1)
  if (verschil !== 0) return verschil
  const tijd = (item) => new Date(item.aangemaakt || item.bijgewerkt || Number(item.id) || 0).getTime() || 0
  return tijd(b) - tijd(a)
}

export function sortTaken(a, b) {
  const verschil = taakDatum(b) - taakDatum(a)
  if (verschil !== 0) return verschil
  const tijd = (item) => new Date(item.aangemaakt || Number(item.id) || 0).getTime() || 0
  return tijd(b) - tijd(a)
}

export function taakZoekTekst(taak) {
  return [
    taak.titel,
    taak.aantal,
    taak.omschrijving,
    taak.van,
    taak.naar,
    taak.week,
    dagLabel(taak.dag),
    fmt(taakDatum(taak)),
    bronLabel(taak.bron),
    STATUS[taak.status]?.label,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function filterTakenOpZoekterm(items, zoekterm) {
  const zoek = zoekterm.trim().toLowerCase()
  if (!zoek) return items
  return items.filter((taak) => taakZoekTekst(taak).includes(zoek))
}

export function groepeerTakenPerMaand(items) {
  return items.reduce((groepen, taak) => {
    const key = isoDag(taakDatum(taak)).slice(0, 7)
    if (!groepen[key]) groepen[key] = []
    groepen[key].push(taak)
    return groepen
  }, {})
}

export function topLijst(items, veld, max = 5) {
  const telling = {}
  items.forEach((item) => {
    const value = item[veld]
    if (!value) return
    telling[value] = (telling[value] || 0) + 1
  })
  return Object.entries(telling)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([label, aantal]) => ({ label, aantal }))
}

export function maakRapportData(taken, rapp) {
  const actieveTaken = taken.filter((taak) => taak.status !== 'verwijderd')
  let filtered = actieveTaken

  if (rapp.type === 'week') {
    filtered = actieveTaken.filter((taak) => taak.week === rapp.week)
  } else if (rapp.type === 'maand') {
    const [jr, mn] = rapp.maand.split('-').map(Number)
    filtered = actieveTaken.filter((taak) => {
      const ma = getMaandag(taak.week)
      return ma.getFullYear() === jr && ma.getMonth() + 1 === mn
    })
  } else {
    const jaar = Number(rapp.jaar)
    filtered = actieveTaken.filter((taak) => getMaandag(taak.week).getFullYear() === jaar)
  }

  const ps = {}
  Object.keys(STATUS).forEach((status) => {
    ps[status] = filtered.filter((taak) => taak.status === status).length
  })

  return {
    taken: filtered,
    ps,
    aanvragen: filtered.filter((taak) => taak.bron === 'aanvraag').length,
    zelf: filtered.filter((taak) => taak.bron === 'zelf').length,
    prioriteit: {
      laag: filtered.filter((taak) => taak.prioriteit === 'laag').length,
      normaal: filtered.filter((taak) => !taak.prioriteit || taak.prioriteit === 'normaal').length,
      hoog: filtered.filter((taak) => taak.prioriteit === 'hoog').length,
    },
    soorten: topLijst(filtered, 'titel'),
    van: topLijst(filtered, 'van'),
    naar: topLijst(filtered, 'naar'),
    totaal: filtered.length,
  }
}
