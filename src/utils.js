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
  if (wk === 'zelf') return 'Geen vaste datum'
  return weekOptieLabel(wk)
}

export function aanvraagMomentLabel(item) {
  if (!item || item.week === 'zsm') return 'Zo snel mogelijk'
  if (item.week === 'zelf') return 'Geen vaste datum'
  if (Number(item.dag) < 0) return `${aanvraagWeekLabel(item.week)}, dag flexibel`
  return `${aanvraagWeekLabel(item.week)}, ${dagLabel(item.dag)}`
}

export function dagLabel(dag) {
  if (dag === null || dag === undefined) return 'Alleen week'
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
  educatieLijsten: 'e5',
  educatieProjecten: 'p5',
  verborgenAutoDrukte: 'vad5',
}

export function laadLokaleState() {
  return {
    taken: laadLokaal(LOKALE_KEYS.taken, []),
    aanvragen: laadLokaal(LOKALE_KEYS.aanvragen, []),
    geblokt: laadLokaal(LOKALE_KEYS.geblokt, []),
    meld: laadLokaal(LOKALE_KEYS.meld, []),
    educatieLijsten: laadLokaal(LOKALE_KEYS.educatieLijsten, []),
    educatieProjecten: laadLokaal(LOKALE_KEYS.educatieProjecten, []),
    verborgenAutoDrukte: laadLokaal(LOKALE_KEYS.verborgenAutoDrukte, []),
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
    reden: '',
    aantal: '',
    tijd: '',
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

export function kwartaalLabel(value) {
  const [jaar, kwartaal] = value.split('-Q')
  const maanden = {
    1: 'jan-feb-mrt',
    2: 'apr-mei-jun',
    3: 'jul-aug-sep',
    4: 'okt-nov-dec',
  }
  return `Kwartaal ${kwartaal} ${jaar} (${maanden[kwartaal]})`
}

export function kwartaalMaanden(value) {
  const [jaar, kwartaal] = value.split('-Q').map(Number)
  const startMaand = (kwartaal - 1) * 3 + 1
  return Array.from({ length: 3 }, (_, index) => `${jaar}-${String(startMaand + index).padStart(2, '0')}`)
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
    taak.tijd,
    taak.naam,
    taak.reden,
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

function getalWaarde(value) {
  const nummer = Number(String(value || '').replace(',', '.'))
  return Number.isFinite(nummer) ? nummer : 0
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
  } else if (rapp.type === 'kwartaal') {
    const maanden = kwartaalMaanden(rapp.kwartaal)
    filtered = actieveTaken.filter((taak) => maanden.includes(isoDag(taakDatum(taak)).slice(0, 7)))
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

function taakInRapportPeriode(taak, rapp) {
  if (rapp.type === 'week') return taak.week === rapp.week
  if (rapp.type === 'maand') return isoDag(taakDatum(taak)).slice(0, 7) === rapp.maand
  if (rapp.type === 'kwartaal') return kwartaalMaanden(rapp.kwartaal).includes(isoDag(taakDatum(taak)).slice(0, 7))
  return taakDatum(taak).getFullYear() === Number(rapp.jaar)
}

function aanvraagInRapportPeriode(aanvraag, rapp) {
  if (aanvraag.status === 'verwijderd') return false
  if (['zsm', 'zelf'].includes(aanvraag.week)) return true
  const aanvraagDatum = getMaandag(aanvraag.week)
  if (rapp.type === 'week') return aanvraag.week === rapp.week
  if (rapp.type === 'maand') return isoDag(aanvraagDatum).slice(0, 7) === rapp.maand
  if (rapp.type === 'kwartaal') return kwartaalMaanden(rapp.kwartaal).includes(isoDag(aanvraagDatum).slice(0, 7))
  return aanvraagDatum.getFullYear() === Number(rapp.jaar)
}

function rapportPeriodeLabel(rapp) {
  if (rapp.type === 'week') return weekNr(rapp.week)
  if (rapp.type === 'maand') return maandLabel(rapp.maand)
  if (rapp.type === 'kwartaal') return kwartaalLabel(rapp.kwartaal)
  return rapp.jaar
}

function periodeDrukte(items, rapp) {
  if (rapp.type === 'week') {
    return DAGEN.map((label, index) => ({
      label: label.slice(0, 2),
      aantal: items.filter((taak) => Number(taak.dag) === index).length,
    }))
  }

  if (rapp.type === 'maand') {
    const weken = Array.from(new Set(maandDagen(rapp.maand).filter((dag) => dag.inMaand).map((dag) => dag.week)))
    return weken
      .sort((a, b) => getMaandag(a) - getMaandag(b))
      .map((week) => ({
        label: weekNr(week).replace('Week ', 'W'),
        aantal: items.filter((taak) => taak.week === week).length,
      }))
  }

  if (rapp.type === 'kwartaal') {
    return kwartaalMaanden(rapp.kwartaal).map((maand) => ({
      label: maandLabel(maand).split(' ')[0].slice(0, 3),
      aantal: items.filter((taak) => isoDag(taakDatum(taak)).slice(0, 7) === maand).length,
    }))
  }

  return jaarMaanden(rapp.jaar).map((maand) => ({
    label: maand.slice(5),
    aantal: items.filter((taak) => isoDag(taakDatum(taak)).slice(0, 7) === maand).length,
  }))
}

function maandKeyVoorItem(item) {
  return isoDag(taakDatum(item)).slice(0, 7)
}

function maandBelasting(items) {
  const maanden = {}
  items.forEach((taak) => {
    const key = maandKeyVoorItem(taak)
    if (!maanden[key]) {
      maanden[key] = {
        taken: 0,
        open: 0,
        sorteerTijd: 0,
        extraStops: 0,
      }
    }
    maanden[key].taken += 1
    if (taak.status !== 'afgerond') maanden[key].open += 1
    if (taak.titel === 'Extra sorteren') maanden[key].sorteerTijd += getalWaarde(taak.tijd)
    if (taak.van || taak.naar) maanden[key].extraStops += 1
  })
  return maanden
}

function gemiddelde(values) {
  if (values.length === 0) return 0
  return values.reduce((som, value) => som + value, 0) / values.length
}

function periodeFactor(rapp) {
  if (rapp.type === 'week') return 1
  if (rapp.type === 'maand') return 4
  if (rapp.type === 'kwartaal') return 12
  return 12
}

function maakCapaciteitSignaal({ actieveTaken, periodeKey, rapp, totaal, open, sorteerTijdMin, extraStops }) {
  const maanden = maandBelasting(actieveTaken)
  const historie = Object.entries(maanden)
    .filter(([key]) => key !== periodeKey)
    .map(([, waarde]) => waarde)

  if (historie.length >= 3) {
    const factor = periodeFactor(rapp)
    const gemiddeldTaken = gemiddelde(historie.map((item) => item.taken))
    const gemiddeldOpen = gemiddelde(historie.map((item) => item.open))
    const gemiddeldSorteer = gemiddelde(historie.map((item) => item.sorteerTijd))
    const gemiddeldStops = gemiddelde(historie.map((item) => item.extraStops))
    const score = [
      totaal > Math.max(gemiddeldTaken * factor * 1.5, gemiddeldTaken * factor + 5 * factor),
      open > Math.max(gemiddeldOpen * factor * 1.5, gemiddeldOpen * factor + 3 * factor),
      sorteerTijdMin > Math.max(gemiddeldSorteer * factor * 1.5, gemiddeldSorteer * factor + 45 * factor),
      extraStops > Math.max(gemiddeldStops * factor * 1.5, gemiddeldStops * factor + 4 * factor),
    ].filter(Boolean).length

    return {
      signaal: score >= 2 ? 'Let op' : score === 1 ? 'Druk' : 'Normaal',
      norm: `benchmark op ${historie.length} eerdere maanden`,
    }
  }

  const factor = periodeFactor(rapp)
  if (open >= 12 * factor || sorteerTijdMin >= 120 * factor || extraStops >= 15 * factor || totaal >= 30 * factor) {
    return { signaal: 'Let op', norm: 'startgrens tot er genoeg historie is' }
  }
  if (open >= 8 * factor || sorteerTijdMin >= 75 * factor || extraStops >= 10 * factor || totaal >= 20 * factor) {
    return { signaal: 'Druk', norm: 'startgrens tot er genoeg historie is' }
  }
  return { signaal: 'Normaal', norm: 'startgrens tot er genoeg historie is' }
}

function maakPiekSignaal({ rapp, sorteerTijdMin, uitzonderingen, extraStops }) {
  const factor = rapp.type === 'week' ? 1 : rapp.type === 'maand' ? 4 : rapp.type === 'kwartaal' ? 12 : 12
  const oranje = {
    sorteerTijd: 30 * factor,
    uitzonderingen: 4 * factor,
    extraStops: 6 * factor,
  }
  const rood = {
    sorteerTijd: 60 * factor,
    uitzonderingen: 8 * factor,
    extraStops: 12 * factor,
  }
  const rodeRedenen = [
    sorteerTijdMin >= rood.sorteerTijd ? 'sorteerdruk' : '',
    uitzonderingen >= rood.uitzonderingen ? 'uitzonderingen' : '',
    extraStops >= rood.extraStops ? 'extra stops' : '',
  ].filter(Boolean)
  const oranjeRedenen = [
    sorteerTijdMin >= oranje.sorteerTijd ? 'sorteerdruk' : '',
    uitzonderingen >= oranje.uitzonderingen ? 'uitzonderingen' : '',
    extraStops >= oranje.extraStops ? 'extra stops' : '',
  ].filter(Boolean)

  if (rodeRedenen.length > 0) {
    return {
      signaal: 'Hoog',
      redenen: rodeRedenen,
      norm: `hoog vanaf ${rood.uitzonderingen} uitzonderingen, ${rood.extraStops} extra stops of ${rood.sorteerTijd} min sorteren`,
    }
  }
  if (oranjeRedenen.length > 0) {
    return {
      signaal: 'Verhoogd',
      redenen: oranjeRedenen,
      norm: `verhoogd vanaf ${oranje.uitzonderingen} uitzonderingen, ${oranje.extraStops} extra stops of ${oranje.sorteerTijd} min sorteren`,
    }
  }
  return {
    signaal: 'Normaal',
    redenen: [],
    norm: `onder ${oranje.uitzonderingen} uitzonderingen, ${oranje.extraStops} extra stops en ${oranje.sorteerTijd} min sorteren`,
  }
}

function uniekeWaarden(items, veld) {
  return new Set(items.map((item) => item[veld]).filter(Boolean)).size
}

function blokkadeInRapportPeriode(item, rapp) {
  if (rapp.type === 'week') return item.week === rapp.week
  const itemMaand = isoDag(getMaandag(item.week)).slice(0, 7)
  if (rapp.type === 'maand') return itemMaand === rapp.maand
  if (rapp.type === 'kwartaal') return kwartaalMaanden(rapp.kwartaal).includes(itemMaand)
  return getMaandag(item.week).getFullYear() === Number(rapp.jaar)
}

export function maakDashboardData(taken, aanvragen, rapp, geblokt = [], extraWaarschuwingen = []) {
  const actieveTaken = taken.filter((taak) => taak.status !== 'verwijderd')
  const periodeTaken = actieveTaken.filter((taak) => taakInRapportPeriode(taak, rapp))
  const periodeAanvragen = aanvragen.filter((aanvraag) => aanvraagInRapportPeriode(aanvraag, rapp))
  const periodeDruktemeldingen = geblokt
    .filter((item) => blokkadeInRapportPeriode(item, rapp))
    .sort((a, b) => getMaandag(a.week) - getMaandag(b.week) || Number(a.dag ?? -1) - Number(b.dag ?? -1))
  const automatischeMeldingen = automatischeBlokkades()
    .filter((item) => blokkadeInRapportPeriode(item, rapp))
    .map((item) => ({
      ...item,
      dag: null,
      automatisch: true,
    }))
  const extraAutomatischeMeldingen = extraWaarschuwingen
    .filter((item) => blokkadeInRapportPeriode(item, rapp))
    .map((item) => ({
      ...item,
      dag: item.dag ?? null,
      automatisch: true,
    }))
  const piekWaarschuwingen = [
    ...periodeDruktemeldingen.map((item) => ({ ...item, automatisch: false })),
    ...automatischeMeldingen,
    ...extraAutomatischeMeldingen,
  ].sort((a, b) => getMaandag(a.week) - getMaandag(b.week) || Number(a.dag ?? -1) - Number(b.dag ?? -1))
  const afgerond = periodeTaken.filter((taak) => taak.status === 'afgerond').length
  const open = periodeTaken.filter((taak) => !['afgerond', 'verwijderd'].includes(taak.status)).length
  const achterstallig = periodeTaken.filter((taak) => taak.status !== 'afgerond' && isVerledenDatum(taakDatum(taak))).length
  const totaal = periodeTaken.length
  const sorteerTaken = periodeTaken.filter((taak) => taak.titel === 'Extra sorteren')
  const routeTaken = periodeTaken.filter((taak) => taak.van || taak.naar)
  const uitzonderingsTaken = periodeTaken.filter((taak) =>
    ['Plukker', 'Eelan', 'Meubel verplaatsen', 'Garage', 'Stort', 'Extra kratten', 'Extra sorteren'].includes(taak.titel),
  )
  const geregistreerdeTijdMin = periodeTaken.reduce((som, taak) => som + getalWaarde(taak.tijd), 0)
  const geregistreerdeAantallen = periodeTaken.reduce((som, taak) => som + getalWaarde(taak.aantal), 0)
  const sorteerTijdMin = sorteerTaken.reduce((som, taak) => som + getalWaarde(taak.tijd), 0)
  const registratieCompleet = periodeTaken.filter((taak) => taak.tijd || taak.aantal || taak.van || taak.naar).length
  const registratiegraad = totaal ? Math.round((registratieCompleet / totaal) * 100) : 0
  const periodeKey =
    rapp.type === 'week'
      ? isoDag(getMaandag(rapp.week)).slice(0, 7)
      : rapp.type === 'maand'
        ? rapp.maand
        : rapp.type === 'kwartaal'
          ? rapp.kwartaal
          : String(rapp.jaar)
  const capaciteit = maakCapaciteitSignaal({
    actieveTaken,
    periodeKey,
    rapp,
    totaal,
    open,
    sorteerTijdMin,
    extraStops: routeTaken.length,
  })
  const piek = maakPiekSignaal({
    rapp,
    sorteerTijdMin,
    uitzonderingen: uitzonderingsTaken.length,
    extraStops: routeTaken.length,
  })
  const dagVerdeling = DAGEN.map((label, index) => ({
    label,
    aantal: periodeTaken.filter((taak) => Number(taak.dag) === index).length,
  }))
  const routeBelasting = DAGEN.map((label, index) => {
    const dagTaken = periodeTaken.filter((taak) => Number(taak.dag) === index)
    return {
      label,
      stops: dagTaken.filter((taak) => taak.van || taak.naar).length,
      vestigingen: uniekeWaarden(
        dagTaken.flatMap((taak) => [
          taak.van ? { vestiging: taak.van } : null,
          taak.naar ? { vestiging: taak.naar } : null,
        ]).filter(Boolean),
        'vestiging',
      ),
      extraRitten: dagTaken.filter((taak) => taak.bron !== 'aanvraag').length,
    }
  })
  const weekDrukte = Array.from(new Set(periodeTaken.map((taak) => taak.week)))
    .sort((a, b) => getMaandag(a) - getMaandag(b))
    .map((week) => ({
      label: weekNr(week),
      aantal: periodeTaken.filter((taak) => taak.week === week).length,
    }))

  return {
    taken: periodeTaken,
    periodeLabel: rapportPeriodeLabel(rapp),
    periodeGrafiekTitel: rapp.type === 'week' ? 'Drukte per dag' : rapp.type === 'maand' ? 'Drukte per week' : 'Drukte per maand',
    periodeDrukte: periodeDrukte(periodeTaken, rapp),
    druktemeldingen: periodeDruktemeldingen,
    automatischeWaarschuwingen: [...automatischeMeldingen, ...extraAutomatischeMeldingen],
    piekWaarschuwingen,
    totaal,
    afgerond,
    open,
    achterstallig,
    vertraagd: achterstallig,
    afrondingsgraad: totaal ? Math.round((afgerond / totaal) * 100) : 0,
    uitAanvragen: periodeTaken.filter((taak) => taak.bron === 'aanvraag').length,
    handmatig: periodeTaken.filter((taak) => taak.bron !== 'aanvraag').length,
    openAanvragen: periodeAanvragen.filter((aanvraag) => ['nieuw', 'info'].includes(aanvraag.status)).length,
    hogePrioriteit: periodeTaken.filter((taak) => taak.prioriteit === 'hoog').length,
    uitzonderingsritten: uitzonderingsTaken.length,
    uitzonderingTypen: topLijst(uitzonderingsTaken, 'titel', 6),
    extraStops: routeTaken.length,
    geregistreerdeTijdMin,
    geregistreerdeAantallen,
    sorteerTaken: sorteerTaken.length,
    sorteerTijdMin,
    tuitjenhornTaken: periodeTaken.filter((taak) => taak.van === 'Bibliotheek Tuitjenhorn' || taak.naar === 'Bibliotheek Tuitjenhorn').length,
    capaciteitSignaal: capaciteit.signaal,
    capaciteitNorm: capaciteit.norm,
    piekSignaal: piek.signaal,
    piekRedenen: piek.redenen,
    piekNorm: piek.norm,
    registratiegraad,
    topTaken: topLijst(periodeTaken, 'titel', 4),
    topVan: topLijst(periodeTaken, 'van', 4),
    topNaar: topLijst(periodeTaken, 'naar', 4),
    dagVerdeling,
    routeBelasting,
    weekDrukte,
  }
}
