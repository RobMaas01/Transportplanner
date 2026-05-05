import { useEffect, useState } from 'react'
import './App.css'
import logo from './assets/kopgroep-logo-official.png'

const PIN_BERT = '2378'

const VESTIGINGEN = [
  'Bibliotheek School 7',
  'Bibliotheek Schagen',
  'Bibliotheek Tuitjenhorn',
  "Bibliotheek 't Zand",
  'Bibliotheek Nieuw Den Helder',
  'Bibliotheek de Schooten',
  'Bibliotheek Julianadorp',
  'Bibliotheek Anna Paulowna',
  'Bibliotheek Hippolytushoef',
  'Bibliotheek Middenmeer',
  'Bibliotheek Nieuwe Niedorp',
  'Bibliotheek Wieringerwerf',
  'Bibliotheek Texel',
  'Jeugdbibliotheek Anna Paulowna',
  "Jeugdbibliotheek 't Veld",
  'Jeugdbibliotheek Wieringerwaard',
  'Jeugdbibliotheek Petten',
  'Jeugdbibliotheek Callantsoog',
  'Jeugdbibliotheek Waarland',
]

const TAAK_SUGGESTIES = [
  'Plukker',
  'Eelan',
  'Extra kratten',
  'Extra sorteren',
  'Garage',
  'Meubel verplaatsen',
  'CoderDojo',
  'Boeken ophalen',
  'Boeken brengen',
  'Anders',
]

const STATUS = {
  gepland: { label: 'Gepland', bg: '#EEF4FF', color: '#2255CC', dot: '#4477EE' },
  onderweg: { label: 'Onderweg', bg: '#FFF7EC', color: '#B45309', dot: '#F59E0B' },
  afgerond: { label: 'Afgerond', bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  verplaatst: { label: 'Verplaatst', bg: '#F3F4F6', color: '#374151', dot: '#9CA3AF' },
  verwijderd: { label: 'Verwijderd', bg: '#F3F4F6', color: '#374151', dot: '#9CA3AF' },
}

const AANVRAAG_STATUS = {
  nieuw: { label: 'Nieuw', bg: '#EEF4FF', color: '#2255CC', dot: '#4477EE' },
  info: { label: 'Meer info nodig', bg: '#FFF7EC', color: '#B45309', dot: '#F59E0B' },
  ingepland: { label: 'Ingepland', bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  voltooid: { label: 'Voltooid', bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  afgewezen: { label: 'Niet uitvoeren', bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
  verwijderd: { label: 'Verwijderd', bg: '#F3F4F6', color: '#374151', dot: '#9CA3AF' },
}

const DAGEN = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']
const DAGEN_KORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const WERKDAGEN_KORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr']

const SCHOOLVAKANTIES_NOORD = [
  { naam: 'Zomervakantie', start: '2026-07-04', eind: '2026-08-16' },
  { naam: 'Herfstvakantie', start: '2026-10-10', eind: '2026-10-18' },
  { naam: 'Kerstvakantie', start: '2026-12-19', eind: '2027-01-03' },
  { naam: 'Voorjaarsvakantie', start: '2027-02-20', eind: '2027-02-28' },
  { naam: 'Meivakantie', start: '2027-04-24', eind: '2027-05-02' },
  { naam: 'Zomervakantie', start: '2027-07-10', eind: '2027-08-22' },
  { naam: 'Herfstvakantie', start: '2027-10-16', eind: '2027-10-24' },
  { naam: 'Kerstvakantie', start: '2027-12-25', eind: '2028-01-09' },
  { naam: 'Voorjaarsvakantie', start: '2028-02-19', eind: '2028-02-27' },
  { naam: 'Meivakantie', start: '2028-04-29', eind: '2028-05-07' },
  { naam: 'Zomervakantie', start: '2028-07-15', eind: '2028-08-27' },
  { naam: 'Herfstvakantie', start: '2028-10-14', eind: '2028-10-22' },
  { naam: 'Kerstvakantie', start: '2028-12-23', eind: '2029-01-07' },
  { naam: 'Voorjaarsvakantie', start: '2029-02-17', eind: '2029-02-25' },
  { naam: 'Meivakantie', start: '2029-04-28', eind: '2029-05-06' },
  { naam: 'Zomervakantie', start: '2029-07-21', eind: '2029-09-02' },
  { naam: 'Herfstvakantie', start: '2029-10-20', eind: '2029-10-28' },
  { naam: 'Kerstvakantie', start: '2029-12-22', eind: '2030-01-06' },
  { naam: 'Voorjaarsvakantie', start: '2030-02-16', eind: '2030-02-24' },
  { naam: 'Meivakantie', start: '2030-04-27', eind: '2030-05-05' },
  { naam: 'Zomervakantie', start: '2030-07-20', eind: '2030-09-01' },
]

function getWeekKey(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const y = d.getFullYear()
  const w = Math.ceil(((d - new Date(y, 0, 1)) / 86400000 + 1) / 7)
  return `${y}-W${String(w).padStart(2, '0')}`
}

function getMaandag(wk) {
  const parts = wk.split('-W')
  const y = Number(parts[0])
  const w = Number(parts[1])
  const d = new Date(y, 0, 1 + (w - 1) * 7)
  const day = d.getDay()
  d.setDate(d.getDate() + (day <= 4 ? 1 - day : 8 - day))
  return d
}

function fmt(d) {
  return d.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function fmtS(d) {
  return d.toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })
}

function isoDag(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function weekDagen(wk) {
  const ma = getMaandag(wk)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(ma)
    d.setDate(ma.getDate() + i)
    return d
  })
}

function weekWerkdagen(wk) {
  return weekDagen(wk).slice(0, 5)
}

function verschuifWeek(wk, stap) {
  const d = getMaandag(wk)
  d.setDate(d.getDate() + stap * 7)
  return getWeekKey(d)
}

function taakDatum(taak) {
  const d = getMaandag(taak.week)
  d.setDate(d.getDate() + Number(taak.dag || 0))
  return d
}

function weekNr(wk) {
  return `Week ${wk.split('-W')[1]}`
}

function weekRange(wk) {
  const ma = getMaandag(wk)
  const vr = new Date(ma)
  vr.setDate(ma.getDate() + 4)
  return `${fmt(ma)} - ${fmt(vr)}`
}

function weekOptieLabel(wk) {
  const blokkade = automatischeBlokkade(wk)
  const suffix = blokkade ? ` - let op: ${blokkade.reden.replace('Automatisch: ', '')}` : ''
  return `${weekNr(wk)} - ${weekRange(wk)}${suffix}`
}

function aanvraagWeekLabel(wk) {
  if (wk === 'zsm') return 'Zo snel mogelijk'
  return weekOptieLabel(wk)
}

function aanvraagMomentLabel(item) {
  if (!item || item.week === 'zsm') return 'Zo snel mogelijk'
  if (Number(item.dag) < 0) return `${aanvraagWeekLabel(item.week)}, dag flexibel`
  return `${aanvraagWeekLabel(item.week)}, ${dagLabel(item.dag)}`
}

function dagLabel(dag) {
  const index = Number(dag)
  if (index < 0) return 'Maakt niet uit'
  return DAGEN[index] || 'Nog niet gekozen'
}

function routeLabel(van, naar) {
  if (!van && !naar) return 'Geen route gekozen'
  if (van && naar) return `Van ${van} | Naar ${naar}`
  if (van) return `Van ${van}`
  return `Naar ${naar}`
}

function wekenTussen(start, eind) {
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

function datum(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function weekVoorVakantie(iso) {
  const d = datum(iso)
  d.setDate(d.getDate() - 1)
  return getWeekKey(d)
}

function weekNaVakantie(iso) {
  const d = datum(iso)
  d.setDate(d.getDate() + 1)
  return getWeekKey(d)
}

function automatischeBlokkade(wk) {
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

function automatischeBlokkades() {
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

function bronLabel(bron) {
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

const LOKALE_KEYS = {
  taken: 't5',
  aanvragen: 'a5',
  geblokt: 'g5',
  meld: 'm5',
}

function laadLokaleState() {
  return {
    taken: laadLokaal(LOKALE_KEYS.taken, []),
    aanvragen: laadLokaal(LOKALE_KEYS.aanvragen, []),
    geblokt: laadLokaal(LOKALE_KEYS.geblokt, []),
    meld: laadLokaal(LOKALE_KEYS.meld, []),
  }
}

function vandaag() {
  return getWeekKey(new Date())
}

function vandaagWerkdagIndex() {
  const dag = new Date().getDay()
  if (dag === 0 || dag === 6) return 0
  return dag - 1
}

function vandaagDagIndex() {
  return (new Date().getDay() + 6) % 7
}

function standaardAanvraag() {
  return {
    aanvrager: '',
    titel: '',
    omschrijving: '',
    van: '',
    naar: '',
    week: 'zsm',
    dag: -1,
    prioriteit: 'normaal',
  }
}

function maakWeken(start, n) {
  const r = []
  const d = getMaandag(start)
  for (let i = 0; i < n; i += 1) {
    r.push(getWeekKey(d))
    d.setDate(d.getDate() + 7)
  }
  return r
}

function maandLabel(value) {
  const [jaar, maand] = value.split('-').map(Number)
  return new Date(jaar, maand - 1, 1).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
}

function verschuifMaand(value, stap) {
  const [jaar, maand] = value.split('-').map(Number)
  const d = new Date(jaar, maand - 1 + stap, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function jaarMaanden(jaar) {
  return Array.from({ length: 12 }, (_, index) => `${jaar}-${String(index + 1).padStart(2, '0')}`)
}

function isVerledenDatum(date) {
  return isoDag(date) < isoDag(new Date())
}

function MonthNav({ value, onChange, min }) {
  const vorigeUit = min && value <= min

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid #E5E9F0',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      <button
        type="button"
        disabled={vorigeUit}
        onClick={() => {
          if (!vorigeUit) onChange(verschuifMaand(value, -1))
        }}
        style={{
          width: 34,
          minHeight: 34,
          border: 'none',
          background: vorigeUit ? '#F9FAFB' : '#fff',
          color: vorigeUit ? '#D1D5DB' : '#374151',
          fontSize: 18,
          cursor: vorigeUit ? 'not-allowed' : 'pointer',
        }}
        aria-label="Vorige maand"
      >
        {'<'}
      </button>
      <div
        style={{
          minWidth: 135,
          textAlign: 'center',
          borderLeft: '1px solid #E5E9F0',
          borderRight: '1px solid #E5E9F0',
          padding: '8px 10px',
          fontSize: 12,
          fontWeight: 700,
          color: '#374151',
          textTransform: 'capitalize',
        }}
      >
        {maandLabel(value)}
      </div>
      <button
        type="button"
        onClick={() => onChange(verschuifMaand(value, 1))}
        style={{
          width: 34,
          minHeight: 34,
          border: 'none',
          background: '#fff',
          color: '#374151',
          fontSize: 18,
          cursor: 'pointer',
        }}
        aria-label="Volgende maand"
      >
        {'>'}
      </button>
    </div>
  )
}

function YearNav({ value, onChange, min }) {
  const vorigeUit = min && Number(value) <= min

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid #E5E9F0',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      <button
        type="button"
        disabled={vorigeUit}
        onClick={() => {
          if (!vorigeUit) onChange(String(Number(value) - 1))
        }}
        style={{
          width: 34,
          minHeight: 34,
          border: 'none',
          background: vorigeUit ? '#F9FAFB' : '#fff',
          color: vorigeUit ? '#D1D5DB' : '#374151',
          fontSize: 18,
          cursor: vorigeUit ? 'not-allowed' : 'pointer',
        }}
        aria-label="Vorig jaar"
      >
        {'<'}
      </button>
      <div
        style={{
          minWidth: 92,
          textAlign: 'center',
          borderLeft: '1px solid #E5E9F0',
          borderRight: '1px solid #E5E9F0',
          padding: '8px 10px',
          fontSize: 12,
          fontWeight: 700,
          color: '#374151',
        }}
      >
        {value}
      </div>
      <button
        type="button"
        onClick={() => onChange(String(Number(value) + 1))}
        style={{
          width: 34,
          minHeight: 34,
          border: 'none',
          background: '#fff',
          color: '#374151',
          fontSize: 18,
          cursor: 'pointer',
        }}
        aria-label="Volgend jaar"
      >
        {'>'}
      </button>
    </div>
  )
}

function maandDagen(value) {
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

const inp = {
  width: '100%',
  border: '1px solid #E5E9F0',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  color: '#111827',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
}

function Pill({ status }) {
  const m = STATUS[status] || STATUS.gepland
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
        fontWeight: 500,
        borderRadius: 12,
        padding: '2px 8px',
        background: m.bg,
        color: m.color,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.dot }} />
      {m.label}
    </span>
  )
}

function AanvraagPill({ status }) {
  const m = AANVRAAG_STATUS[status] || AANVRAAG_STATUS.nieuw
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
        fontWeight: 500,
        borderRadius: 12,
        padding: '2px 8px',
        background: m.bg,
        color: m.color,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.dot }} />
      {m.label}
    </span>
  )
}

function Btn({ onClick, children, variant, size = 'compact' }) {
  const v = variant || 'ghost'
  const styles = {
    ghost: { background: '#F3F4F6', color: '#374151', border: '1px solid #E5E9F0' },
    primary: { background: '#2563EB', color: '#fff', border: 'none' },
    success: { background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' },
    danger: { background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' },
  }

  return (
    <button
      onClick={onClick}
      style={{
        ...styles[v],
        borderRadius: size === 'touch' ? 9 : 7,
        padding: size === 'touch' ? '10px 15px' : '5px 11px',
        fontSize: size === 'touch' ? 13 : 11,
        fontWeight: size === 'touch' ? 700 : 500,
        minHeight: size === 'touch' ? 40 : 'auto',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function Label({ children, required = false, optional = false }) {
  return (
    <label
      style={{
        fontSize: 12,
        fontWeight: 500,
        color: '#374151',
        display: 'block',
        marginBottom: 4,
      }}
    >
      <span>{children}</span>
      {(required || optional) && (
        <span
          style={{
            marginLeft: 6,
            fontSize: 10,
            fontWeight: 700,
            color: required ? '#B45309' : '#9CA3AF',
            textTransform: 'uppercase',
          }}
        >
          {required ? 'verplicht' : 'optioneel'}
        </span>
      )}
    </label>
  )
}

function FieldError({ children }) {
  if (!children) return null

  return <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 4 }}>{children}</div>
}

function DrukteWaarschuwing({ waarschuwing, compact = false }) {
  if (!waarschuwing) return null

  return (
    <div
      style={{
        background: '#FFF7ED',
        border: '1px solid #FED7AA',
        borderRadius: 8,
        padding: compact ? '7px 9px' : '9px 11px',
        fontSize: 12,
        color: '#92400E',
        fontWeight: compact ? 500 : 600,
      }}
    >
      Let op: {waarschuwing.reden || 'drukke periode'}
    </div>
  )
}

function ZelfdeVestigingWaarschuwing({ van, naar }) {
  if (!van || !naar || van !== naar) return null

  return (
    <div
      style={{
        fontSize: 12,
        color: '#92400E',
        background: '#FFF7ED',
        border: '1px solid #FED7AA',
        borderRadius: 8,
        padding: '8px 10px',
      }}
    >
      Van en Naar zijn hetzelfde. Klopt dit? Vul anders maar een van de twee in.
    </div>
  )
}

function heeftErrors(errors) {
  return Object.values(errors).some(Boolean)
}

function aanvraagIsOpen(item) {
  return ['nieuw', 'info', 'ingepland'].includes(item.status)
}

function aanvraagIsAfgesloten(item) {
  return ['voltooid'].includes(item.status)
}

function isDezeMaand(iso) {
  if (!iso) return false
  return iso.slice(0, 7) === new Date().toISOString().slice(0, 7)
}

function aanvraagNietUitgevoerdDezeMaand(item) {
  return item.status === 'afgewezen' && isDezeMaand(item.nietUitvoerenOp || item.bijgewerkt || item.aangemaakt)
}

function aanvraagZichtbaarVoorAanvrager(item) {
  if (item.status === 'verwijderd') return false
  if (item.status === 'afgewezen') return aanvraagNietUitgevoerdDezeMaand(item)
  return true
}

function sortAanvragen(a, b) {
  const prio = { hoog: 0, normaal: 1, laag: 2 }
  const verschil = (prio[a.prioriteit || 'normaal'] ?? 1) - (prio[b.prioriteit || 'normaal'] ?? 1)
  if (verschil !== 0) return verschil
  const tijd = (item) => new Date(item.aangemaakt || item.bijgewerkt || Number(item.id) || 0).getTime() || 0
  return tijd(b) - tijd(a)
}

function sortTaken(a, b) {
  const verschil = taakDatum(b) - taakDatum(a)
  if (verschil !== 0) return verschil
  const tijd = (item) => new Date(item.aangemaakt || Number(item.id) || 0).getTime() || 0
  return tijd(b) - tijd(a)
}

function taakZoekTekst(taak) {
  return [
    taak.titel,
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

function filterTakenOpZoekterm(items, zoekterm) {
  const zoek = zoekterm.trim().toLowerCase()
  if (!zoek) return items
  return items.filter((taak) => taakZoekTekst(taak).includes(zoek))
}

function groepeerTakenPerMaand(items) {
  return items.reduce((groepen, taak) => {
    const key = isoDag(taakDatum(taak)).slice(0, 7)
    if (!groepen[key]) groepen[key] = []
    groepen[key].push(taak)
    return groepen
  }, {})
}

function maakRapportData(taken, rapp) {
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

function topLijst(items, veld, max = 5) {
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

function Card({ children, style }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E5E9F0',
        borderRadius: 12,
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function CardHead({ title, sub }) {
  return (
    <div
      style={{
        padding: '13px 18px',
        borderBottom: '1px solid #E5E9F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{title}</span>
      {sub && <span style={{ fontSize: 12, color: '#9CA3AF' }}>{sub}</span>}
    </div>
  )
}

export default function App() {
  const WEKEN = maakWeken(vandaag(), 260)
  const lokaal = laadLokaleState()

  const [rol, setRol] = useState(null)
  const [pin, setPin] = useState('')
  const [pinErr, setPinErr] = useState('')
  const [tab, setTab] = useState('planning')
  const [toevoegenTab, setToevoegenTab] = useState('taak')
  const [taken, setTaken] = useState(lokaal.taken)
  const [aanvragen, setAanvragen] = useState(lokaal.aanvragen)
  const [geblokt, setGeblokt] = useState(lokaal.geblokt)
  const [week, setWeek] = useState(vandaag())
  const [planningWeergave, setPlanningWeergave] = useState('maand')
  const [planningMaand, setPlanningMaand] = useState(new Date().toISOString().slice(0, 7))
  const [planningJaar, setPlanningJaar] = useState(String(new Date().getFullYear()))
  const [aanvraagMaand, setAanvraagMaand] = useState(new Date().toISOString().slice(0, 7))
  const [taakMaand, setTaakMaand] = useState(new Date().toISOString().slice(0, 7))
  const [verplaatsMaand, setVerplaatsMaand] = useState(new Date().toISOString().slice(0, 7))
  const [blokMaand, setBlokMaand] = useState(new Date().toISOString().slice(0, 7))
  const [planMaand, setPlanMaand] = useState(new Date().toISOString().slice(0, 7))
  const [toonVerwijderd, setToonVerwijderd] = useState(false)
  const [toonVerwijderdeTaken, setToonVerwijderdeTaken] = useState(false)
  const [taakZoekterm, setTaakZoekterm] = useState('')
  const [meld, setMeld] = useState(lokaal.meld)

  const [nieuw, setNieuw] = useState({
    titel: '',
    omschrijving: '',
    van: '',
    naar: '',
    week: vandaag(),
    dag: vandaagDagIndex(),
    prioriteit: 'normaal',
  })
  const [aanvraag, setAanvraag] = useState(() => standaardAanvraag())
  const [aanvraagEditId, setAanvraagEditId] = useState(null)
  const [aanvraagBevestigd, setAanvraagBevestigd] = useState(false)
  const [aanvraagErrors, setAanvraagErrors] = useState({})
  const [taakErrors, setTaakErrors] = useState({})
  const [taakEditId, setTaakEditId] = useState(null)
  const [taakMelding, setTaakMelding] = useState('')
  const [aanvraagMelding, setAanvraagMelding] = useState('')
  const [blokForm, setBlokForm] = useState({ type: 'week', week: '', eindWeek: '', dag: vandaagDagIndex(), reden: '' })
  const [modal, setModal] = useState(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [vandaagTaakVraag, setVandaagTaakVraag] = useState(false)
  const [bevestigVerwijderen, setBevestigVerwijderen] = useState(null)
  const [planAanvraag, setPlanAanvraag] = useState(null)
  const [infoAanvraag, setInfoAanvraag] = useState(null)
  const [infoNotitie, setInfoNotitie] = useState('')
  const [nietUitvoerenAanvraag, setNietUitvoerenAanvraag] = useState(null)
  const [nietUitvoerenReden, setNietUitvoerenReden] = useState('')
  const [verplW, setVerplW] = useState('')
  const [verplD, setVerplD] = useState(0)
  const [planW, setPlanW] = useState('')
  const [planD, setPlanD] = useState(0)
  const [rapp, setRapp] = useState({
    type: 'week',
    week: vandaag(),
    maand: new Date().toISOString().slice(0, 7),
    jaar: String(new Date().getFullYear()),
  })

  useEffect(() => {
    localStorage.setItem('t5', JSON.stringify(taken))
  }, [taken])

  useEffect(() => {
    localStorage.setItem('a5', JSON.stringify(aanvragen))
  }, [aanvragen])

  useEffect(() => {
    localStorage.setItem('g5', JSON.stringify(geblokt))
  }, [geblokt])

  useEffect(() => {
    localStorage.setItem('m5', JSON.stringify(meld))
  }, [meld])

  useEffect(() => {
    if (!taakMelding) return undefined
    const timer = setTimeout(() => setTaakMelding(''), 3000)
    return () => clearTimeout(timer)
  }, [taakMelding])

  useEffect(() => {
    if (!aanvraagMelding) return undefined
    const timer = setTimeout(() => setAanvraagMelding(''), 3000)
    return () => clearTimeout(timer)
  }, [aanvraagMelding])

  function login() {
    if (pin === PIN_BERT) {
      setRol('transporteur')
      setPinErr('')
    } else {
      setPinErr('Onjuiste pincode.')
    }
    setPin('')
  }

  function startAanvraag() {
    setAanvraag(standaardAanvraag())
    setAanvraagMaand(new Date().toISOString().slice(0, 7))
    setAanvraagEditId(null)
    setAanvraagErrors({})
    setAanvraagBevestigd(false)
    setRol('aanvrager')
    setTab('aanvraag')
    setPin('')
    setPinErr('')
  }

  function openVandaagTaakVraag() {
    setNieuw((prev) => ({ ...prev, week: vandaag(), dag: vandaagDagIndex() }))
    setTaakMaand(new Date().toISOString().slice(0, 7))
    setVandaagTaakVraag(true)
  }

  function voegToe(status = 'gepland', bestemming = null) {
    const errors = {}
    if (!nieuw.titel) errors.titel = 'Kies wat voor taak dit is.'
    setTaakErrors(errors)
    if (Object.keys(errors).length > 0) return false
    const taakData = {
      ...nieuw,
      omschrijving: nieuw.omschrijving,
    }

    if (taakEditId) {
      setTaken((prev) =>
        prev.map((taak) =>
          taak.id === taakEditId
            ? {
                ...taak,
                ...taakData,
                log: [...taak.log, { a: 'gewijzigd', d: rol, w: new Date().toISOString() }],
              }
            : taak,
        ),
      )
    } else {
      setTaken((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          ...taakData,
          status,
          aangemaakt: new Date().toISOString(),
          door: rol,
          bron: 'zelf',
          log: [{ a: 'aangemaakt', d: rol, w: new Date().toISOString() }],
        },
      ])
    }

    setNieuw({
      titel: '',
      omschrijving: '',
      van: '',
      naar: '',
      week: vandaag(),
      dag: vandaagDagIndex(),
      prioriteit: 'normaal',
    })
    setTaakEditId(null)
    setTaakErrors({})
    if (taakEditId) {
      setTaakMelding('Taak gewijzigd.')
    } else {
      setTaakMelding(status === 'afgerond' ? 'Taak toegevoegd als afgerond.' : 'Taak toegevoegd.')
    }
    if (bestemming === 'alletaken') {
      setTab('alletaken')
    }
    if (bestemming === 'planning') {
      setWeek(taakData.week)
      setPlanningMaand(isoDag(taakDatum(taakData)).slice(0, 7))
      setPlanningWeergave('week')
      setTab('planning')
    }
    return true
  }

  function bewerkTaak(taak) {
    setNieuw({
      titel: TAAK_SUGGESTIES.includes(taak.titel) ? taak.titel : 'Anders',
      omschrijving: taak.omschrijving || '',
      van: taak.van || '',
      naar: taak.naar || '',
      week: taak.week || vandaag(),
      dag: Number(taak.dag ?? vandaagDagIndex()),
      prioriteit: taak.prioriteit || 'normaal',
    })
    setTaakMaand(isoDag(getMaandag(taak.week || vandaag())).slice(0, 7))
    setTaakEditId(taak.id)
    setTaakErrors({})
    setToevoegenTab('taak')
    setTab('toevoegen')
  }

  function dienAanvraagIn() {
    const errors = {}
    if (!aanvraag.aanvrager.trim()) errors.aanvrager = 'Vul de naam van de aanvrager in.'
    if (!aanvraag.titel.trim()) errors.titel = 'Vul in wat er moet gebeuren.'
    if (!aanvraag.van && !aanvraag.naar) errors.route = 'Kies minimaal een van de vestigingen bij van of naar.'
    if (aanvraag.week !== 'zsm') {
      if (Number(aanvraag.dag) >= 0) {
        const gekozenDatum = getMaandag(aanvraag.week)
        gekozenDatum.setDate(gekozenDatum.getDate() + Number(aanvraag.dag))
        if (isVerledenDatum(gekozenDatum)) errors.wanneer = 'Kies vandaag of een datum in de toekomst.'
      } else {
        const heeftToekomstigeWerkdag = weekWerkdagen(aanvraag.week).some((dag) => !isVerledenDatum(dag))
        if (!heeftToekomstigeWerkdag) errors.wanneer = 'Kies een week met minimaal een toekomstige werkdag.'
      }
    }
    setAanvraagErrors(errors)
    if (Object.keys(errors).length > 0) return

    if (aanvraagEditId) {
      setAanvragen((prev) =>
        prev.map((item) =>
          item.id === aanvraagEditId
            ? {
                ...item,
                ...aanvraag,
                status: 'nieuw',
                bijgewerkt: new Date().toISOString(),
                log: [...item.log, { a: 'aangevuld', d: aanvraag.aanvrager, w: new Date().toISOString() }],
              }
            : item,
        ),
      )
      setAanvraagEditId(null)
      setTab(rol === 'transporteur' ? 'aanvragen' : 'aanvraagstatus')
    } else {
      const id = Date.now().toString()
      setAanvragen((prev) => [
        ...prev,
        {
        id,
        ...aanvraag,
        status: 'nieuw',
        aangemaakt: new Date().toISOString(),
        log: [{ a: 'ingediend', d: aanvraag.aanvrager, w: new Date().toISOString() }],
        },
      ])
    }

    setAanvraag(standaardAanvraag())
    setAanvraagMaand(new Date().toISOString().slice(0, 7))
    if (!aanvraagEditId && rol !== 'transporteur') setAanvraagBevestigd(true)
    setAanvraagErrors({})
  }

  function bewerkAanvraag(item) {
    if (item.week && item.week !== 'zsm') {
      setAanvraagMaand(isoDag(getMaandag(item.week)).slice(0, 7))
    }
    setAanvraag({
      aanvrager: item.aanvrager || '',
      titel: item.titel || '',
      omschrijving: item.omschrijving || '',
      van: item.van || '',
      naar: item.naar || '',
      week: item.week || vandaag(),
      dag: Number(item.dag ?? vandaagWerkdagIndex()),
      prioriteit: item.prioriteit || 'normaal',
    })
    setAanvraagEditId(item.id)
    setAanvraagBevestigd(false)
    setTab('aanvraag')
  }

  function annuleerAanvraagEdit() {
    setAanvraagEditId(null)
    setAanvraagErrors({})
    setAanvraag(standaardAanvraag())
    setAanvraagMaand(new Date().toISOString().slice(0, 7))
    setAanvraagBevestigd(false)
  }

  function verwijderAanvraag(id) {
    setAanvragen((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'verwijderd',
              verwijderdOp: new Date().toISOString(),
              log: [...item.log, { a: 'verwijderd', d: rol, w: new Date().toISOString() }],
            }
          : item,
      ),
    )
  }

  function herstelAanvraag(id) {
    setAanvragen((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.geplandeWeek ? 'ingepland' : 'nieuw',
              verwijderdOp: null,
              log: [...item.log, { a: 'hersteld', d: rol, w: new Date().toISOString() }],
            }
          : item,
      ),
    )
  }

  function vraagVerwijderAanvraag(item) {
    setBevestigVerwijderen({ type: 'aanvraag', item })
  }

  function vraagVerwijderTaak(item) {
    setBevestigVerwijderen({ type: 'taak', item })
  }

  function verwijderTaak(id) {
    setTaken((prev) =>
      prev.map((taak) =>
        taak.id === id
          ? {
              ...taak,
              vorigeStatus: taak.status === 'verwijderd' ? taak.vorigeStatus || 'gepland' : taak.status,
              status: 'verwijderd',
              verwijderdOp: new Date().toISOString(),
              log: [...taak.log, { a: 'verwijderd', d: rol, w: new Date().toISOString() }],
            }
          : taak,
      ),
    )
  }

  function herstelTaak(id) {
    setTaken((prev) =>
      prev.map((taak) =>
        taak.id === id
          ? {
              ...taak,
              status: taak.vorigeStatus || 'gepland',
              vorigeStatus: null,
              verwijderdOp: null,
              log: [...taak.log, { a: 'hersteld', d: rol, w: new Date().toISOString() }],
            }
          : taak,
      ),
    )
  }

  function voerVerwijderenUit() {
    if (!bevestigVerwijderen) return

    if (bevestigVerwijderen.type === 'aanvraag') {
      verwijderAanvraag(bevestigVerwijderen.item.id)
    } else {
      verwijderTaak(bevestigVerwijderen.item.id)
    }

    setBevestigVerwijderen(null)
  }

  function openNietUitvoeren(item) {
    setNietUitvoerenAanvraag(item)
    setNietUitvoerenReden(item.nietUitvoerenReden || '')
  }

  function slaNietUitvoerenOp() {
    if (!nietUitvoerenAanvraag) return

    setAanvragen((prev) =>
      prev.map((item) =>
        item.id === nietUitvoerenAanvraag.id
          ? {
              ...item,
              status: 'afgewezen',
              nietUitvoerenReden: nietUitvoerenReden.trim(),
              nietUitvoerenOp: new Date().toISOString(),
              log: [...item.log, { a: 'niet uitvoeren', d: rol, w: new Date().toISOString() }],
            }
          : item,
      ),
    )
    setNietUitvoerenAanvraag(null)
    setNietUitvoerenReden('')
  }

  function openInfoNodig(item) {
    setInfoAanvraag(item)
    setInfoNotitie(item.infoNotitie || '')
  }

  function slaInfoNodigOp() {
    if (!infoAanvraag) return

    setAanvragen((prev) =>
      prev.map((item) =>
        item.id === infoAanvraag.id
          ? {
              ...item,
              status: 'info',
              infoNotitie: infoNotitie.trim(),
              log: [...item.log, { a: 'info nodig', d: rol, w: new Date().toISOString() }],
            }
          : item,
      ),
    )
    setInfoAanvraag(null)
    setInfoNotitie('')
  }

  function openPlanAanvraag(item) {
    const doelWeek = item.week === 'zsm' ? week : item.week
    setPlanAanvraag(item)
    setPlanW(doelWeek)
    setPlanD(Number(item.dag) >= 0 ? Number(item.dag) : 0)
    setPlanMaand(isoDag(getMaandag(doelWeek)).slice(0, 7))
  }

  function zetAanvraagDoor() {
    if (!planAanvraag || !planW) return

    const item = planAanvraag
    setTaken((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        titel: item.titel,
        omschrijving: item.omschrijving,
        van: item.van,
        naar: item.naar,
        week: planW,
        dag: planD,
        prioriteit: item.prioriteit,
        status: 'gepland',
        aangemaakt: new Date().toISOString(),
        door: rol,
        bron: 'aanvraag',
        aanvraagId: item.id,
        log: [{ a: 'aangemaakt uit aanvraag', d: rol, w: new Date().toISOString() }],
      },
    ])

    setAanvragen((prev) =>
      prev.map((aanv) =>
        aanv.id === item.id
          ? {
              ...aanv,
              status: 'ingepland',
              geplandeWeek: planW,
              geplandeDag: planD,
              behandeld: new Date().toISOString(),
              log: [...aanv.log, { a: 'doorgezet naar planning', d: rol, w: new Date().toISOString() }],
            }
          : aanv,
      ),
    )
    setWeek(planW)
    setPlanningWeergave('week')
    setPlanAanvraag(null)
    setAanvraagMelding('Aanvraag ingepland.')
  }

  function updStatus(id, status) {
    const taak = taken.find((item) => item.id === id)

    setTaken((prev) =>
      prev.map((taak) =>
        taak.id === id
          ? {
              ...taak,
              status,
              log: [...taak.log, { a: `->${status}`, d: rol, w: new Date().toISOString() }],
            }
          : taak,
      ),
    )

    if (status === 'afgerond' && taak?.aanvraagId) {
      setAanvragen((prev) =>
        prev.map((aanvraag) =>
          aanvraag.id === taak.aanvraagId
            ? {
                ...aanvraag,
                status: 'voltooid',
                voltooidOp: new Date().toISOString(),
                log: [...aanvraag.log, { a: 'voltooid', d: rol, w: new Date().toISOString() }],
              }
            : aanvraag,
        ),
      )
    }
  }

  function verplaats() {
    if (!verplW || !modal) return

    setTaken((prev) =>
      prev.map((taak) =>
        taak.id === modal.id
          ? {
              ...taak,
              week: verplW,
              dag: verplD,
              status: 'verplaatst',
              log: [...taak.log, { a: `verplaatst->${verplW}`, d: rol, w: new Date().toISOString() }],
            }
          : taak,
      ),
    )

    setMeld((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        tekst: `"${modal.titel}" verplaatst naar ${weekNr(verplW)}, ${DAGEN[verplD]}`,
        gelezen: false,
      },
    ])

    setWeek(verplW)
    setPlanningWeergave('week')
    setModal(null)
  }

  function blokkeer() {
    if (!blokForm.week) return

    const weken = blokForm.type === 'dag' ? [blokForm.week] : wekenTussen(blokForm.week, blokForm.eindWeek)
    const nieuwGeblokt = weken.map((wk) => ({
      id: `${Date.now()}-${wk}-${blokForm.type}`,
      week: wk,
      dag: blokForm.type === 'dag' ? Number(blokForm.dag) : null,
      type: blokForm.type,
      reden: blokForm.reden,
    }))

    setGeblokt((prev) => [
      ...prev.filter((item) => !nieuwGeblokt.some((nieuwItem) => nieuwItem.week === item.week && nieuwItem.dag === item.dag)),
      ...nieuwGeblokt,
    ])
    setBlokForm({ type: 'week', week: '', eindWeek: '', dag: vandaagDagIndex(), reden: '' })
  }

  function blokkadeVoorWeek(wk) {
    return geblokt.find((item) => item.week === wk && (item.dag === null || item.dag === undefined)) || automatischeBlokkade(wk)
  }

  function blokkadeVoorDag(wk, dag) {
    return geblokt.find((item) => item.week === wk && Number(item.dag) === Number(dag)) || blokkadeVoorWeek(wk)
  }

  function nieuweM() {
    return meld.filter((item) => !item.gelezen).length
  }

  function leesM() {
    setMeld((prev) => prev.map((item) => ({ ...item, gelezen: true })))
  }

  function csvWaarde(value) {
    const tekst = String(value ?? '')
    return `"${tekst.replaceAll('"', '""')}"`
  }

  function rappPeriodeLabel() {
    if (rapp.type === 'week') return weekNr(rapp.week)
    if (rapp.type === 'maand') return maandLabel(rapp.maand)
    return rapp.jaar
  }

  function exportRapportCsv() {
    if (!rappData) return

    const headers = [
      'Datum',
      'Week',
      'Dag',
      'Taak',
      'Van',
      'Naar',
      'Status',
      'Bron',
      'Prioriteit',
      'Toelichting',
      'Aangemaakt',
    ]
    const rows = rappData.taken.map((taak) => [
      fmt(taakDatum(taak)),
      weekNr(taak.week),
      DAGEN[taak.dag] || '',
      taak.titel,
      taak.van || '',
      taak.naar || '',
      STATUS[taak.status]?.label || taak.status,
      bronLabel(taak.bron),
      taak.prioriteit || 'normaal',
      taak.omschrijving || '',
      taak.aangemaakt ? fmt(new Date(taak.aangemaakt)) : '',
    ])

    const csv = [headers, ...rows].map((row) => row.map(csvWaarde).join(';')).join('\r\n')
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rapportage-${rapp.type}-${rappPeriodeLabel().replaceAll(' ', '-').toLowerCase()}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const navTabs =
    rol === 'aanvrager'
        ? [
            { k: 'aanvraag', l: 'Aanvraag indienen' },
            { k: 'aanvraagstatus', l: 'Alle aanvragen' },
          ]
        : [
            { k: 'planning', l: 'Planning' },
            { k: 'aanvragen', l: `Aanvragen${aanvragen.filter((item) => item.status === 'nieuw').length ? ` (${aanvragen.filter((item) => item.status === 'nieuw').length})` : ''}` },
            { k: 'toevoegen', l: 'Toevoegen' },
            { k: 'alletaken', l: 'Alle taken' },
            { k: 'rapportage', l: 'Rapportage' },
          ]

  const pagina = {
    planning: 'Weekplanning',
    aanvragen: 'Aanvragen inbox',
    aanvraag: 'Transport aanvragen',
    aanvraagstatus: 'Aanvragen volgen',
    toevoegen: 'Toevoegen',
    alletaken: 'Alle taken',
    rapportage: 'Rapportage',
  }

  if (!rol) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#F8F9FC',
          padding: 20,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid #E5E9F0',
            borderRadius: 16,
            padding: 34,
            width: '100%',
            maxWidth: 430,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img
              src={logo}
              alt="KopGroep Bibliotheken"
              style={{ width: '100%', maxWidth: 255, height: 'auto', marginBottom: 16 }}
            />
            <div style={{ fontSize: 20, fontWeight: 600, color: '#3A2A22' }}>Transportplanning</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
              KopGroep Bibliotheken
            </div>
          </div>
          <button
            onClick={startAanvraag}
            style={{
              width: '100%',
              background: '#EA6A1F',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '14px 0',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 14,
              boxShadow: '0 5px 12px rgba(234, 106, 31, .16)',
            }}
          >
            Ik wil iets aanvragen
          </button>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#3A2A22', marginBottom: 8, marginTop: 12 }}>
            Bert planning
          </div>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') login()
            }}
            placeholder="Pincode"
            style={{ ...inp, marginBottom: 10 }}
          />
          {pinErr && <div style={{ fontSize: 12, color: '#DC2626', marginBottom: 8 }}>{pinErr}</div>}
          <button
            onClick={login}
            style={{
              width: '100%',
              background: '#1F7A4D',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 0',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Inloggen als Bert
          </button>
          <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 14, whiteSpace: 'nowrap' }}>
            Aanvragen kan zonder pincode. Bert beheert de planning.
          </div>
        </div>
      </div>
    )
  }

  const actieveTaken = taken.filter((taak) => taak.status !== 'verwijderd')
  const verwijderdeTaken = taken.filter((taak) => taak.status === 'verwijderd')
  const dagData = weekWerkdagen(week)
  const weekTaken = actieveTaken.filter((taak) => taak.week === week)
  const weekBlokkade = blokkadeVoorWeek(week)
  const gebloktNu = Boolean(weekBlokkade)
  const maandData = maandDagen(planningMaand)
  const maandTaken = actieveTaken.filter((taak) => {
    const d = taakDatum(taak)
    return isoDag(d).slice(0, 7) === planningMaand
  })
  const jaarTaken = actieveTaken.filter((taak) => taakDatum(taak).getFullYear() === Number(planningJaar))
  const gezochteActieveTaken = filterTakenOpZoekterm(actieveTaken.slice().sort(sortTaken), taakZoekterm)
  const gezochteVerwijderdeTaken = filterTakenOpZoekterm(verwijderdeTaken.slice().sort(sortTaken), taakZoekterm)
  const takenPerMaand = groepeerTakenPerMaand(gezochteActieveTaken)
  const verwijderdeTakenPerMaand = groepeerTakenPerMaand(gezochteVerwijderdeTaken)
  const rappData = tab === 'rapportage' ? maakRapportData(taken, rapp) : null

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#F8F9FC',
        fontFamily: "Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          width: 210,
          background: '#FFF7ED',
          borderRight: '1px solid #FED7AA',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '18px 14px 14px', borderBottom: '1px solid #FED7AA' }}>
          <img src={logo} alt="KopGroep Bibliotheken" style={{ width: '100%', height: 'auto', marginBottom: 10 }} />
          <div style={{ color: '#3A2A22', fontSize: 13, fontWeight: 700 }}>Transportplanning</div>
          <div style={{ color: '#9A5A2E', fontSize: 11, marginTop: 3 }}>KopGroep Bibliotheken</div>
        </div>
        <nav style={{ padding: '10px 8px', flex: 1 }}>
          {navTabs.map((item) => (
            <div
              key={item.k}
              onClick={() => setTab(item.k)}
              style={{
                padding: '9px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                marginBottom: 2,
                fontSize: 13,
                fontWeight: 500,
                color: tab === item.k ? '#fff' : '#7C4A2A',
                background: tab === item.k ? '#EA6A1F' : 'transparent',
              }}
            >
              {item.l}
            </div>
          ))}
        </nav>
        <div style={{ padding: '12px 10px', borderTop: '1px solid #FED7AA' }}>
          <div style={{ background: '#FFE8D1', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
            <div style={{ color: '#3A2A22', fontSize: 12, fontWeight: 600 }}>
              {rol === 'aanvrager' ? 'Aanvrager' : 'Bert'}
            </div>
            <div style={{ color: '#9A5A2E', fontSize: 11, marginTop: 2 }}>Ingelogd</div>
          </div>
          <button
            onClick={() => {
              setRol(null)
              setTab('planning')
              setHelpOpen(false)
            }}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid #F5C99D',
              color: '#7C4A2A',
              borderRadius: 6,
              padding: 7,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Uitloggen
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div
          style={{
            background: '#fff',
            borderBottom: '1px solid #E5E9F0',
            padding: '0 22px',
            height: 54,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{pagina[tab] || ''}</div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
              {tab === 'planning' ? weekRange(week) : 'KopGroep Bibliotheken'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {nieuweM() > 0 && (
            <button
              onClick={leesM}
              style={{
                background: '#EEF4FF',
                border: 'none',
                color: '#2255CC',
                borderRadius: 20,
                padding: '5px 14px',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {nieuweM()} nieuw bericht{nieuweM() > 1 ? 'en' : ''} gelezen
            </button>
          )}
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              title="Help"
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                border: '1px solid #E5E9F0',
                background: '#fff',
                color: '#374151',
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              ?
            </button>
          </div>
        </div>

        <div style={{ padding: 20, flex: 1, overflowY: 'auto' }}>
          {tab === 'aanvraag' && (rol === 'aanvrager' || rol === 'transporteur') && (
            <div>
              {aanvraagBevestigd && rol === 'aanvrager' ? (
                <Card>
                  <div style={{ padding: 24, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#065F46', marginBottom: 6 }}>
                      Aanvraag ingediend
                    </div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 18 }}>
                      Bert ziet de aanvraag en plant deze verder in.
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          setAanvraag(standaardAanvraag())
                          setAanvraagMaand(new Date().toISOString().slice(0, 7))
                          setAanvraagErrors({})
                          setAanvraagBevestigd(false)
                        }}
                        style={{
                          background: '#EA6A1F',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '10px 16px',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Nog een aanvraag
                      </button>
                      <button
                        onClick={() => {
                          setRol(null)
                          setTab('planning')
                          setAanvraagBevestigd(false)
                        }}
                        style={{
                          background: '#F3F4F6',
                          color: '#374151',
                          border: '1px solid #E5E9F0',
                          borderRadius: 8,
                          padding: '10px 16px',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Uitloggen
                      </button>
                    </div>
                  </div>
                </Card>
              ) : (
              <Card>
                <CardHead title={aanvraagEditId ? 'Aanvraag aanvullen' : 'Nieuwe transportaanvraag'} />
                <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'start' }}>
                  {heeftErrors(aanvraagErrors) && (
                    <div
                      style={{
                        gridColumn: '1 / -1',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontSize: 12,
                        color: '#991B1B',
                        fontWeight: 600,
                      }}
                    >
                      Er mist nog iets voordat de aanvraag verstuurd kan worden.
                    </div>
                  )}
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div>
                      <Label required>Aanvrager</Label>
                      <input
                        value={aanvraag.aanvrager}
                        onChange={(e) => {
                          setAanvraag((prev) => ({ ...prev, aanvrager: e.target.value }))
                          setAanvraagErrors((prev) => {
                            const next = { ...prev }
                            delete next.aanvrager
                            return next
                          })
                        }}
                        placeholder="Naam"
                        style={{ ...inp, borderColor: aanvraagErrors.aanvrager ? '#F87171' : '#E5E9F0' }}
                      />
                      <FieldError>{aanvraagErrors.aanvrager}</FieldError>
                    </div>
                    <div>
                      <Label>Wat moet er gebeuren?</Label>
                      <input
                        value={aanvraag.titel}
                        onChange={(e) => {
                          setAanvraag((prev) => ({ ...prev, titel: e.target.value }))
                          setAanvraagErrors((prev) => {
                            const next = { ...prev }
                            delete next.titel
                            return next
                          })
                        }}
                        placeholder="Bijv. Kratten ophalen"
                        style={{ ...inp, borderColor: aanvraagErrors.titel ? '#F87171' : '#E5E9F0' }}
                      />
                      <FieldError>{aanvraagErrors.titel}</FieldError>
                    </div>
                    <div>
                      <Label>Van vestiging</Label>
                      <select
                        value={aanvraag.van}
                        onChange={(e) => {
                          setAanvraag((prev) => ({ ...prev, van: e.target.value }))
                          setAanvraagErrors((prev) => {
                            const next = { ...prev }
                            delete next.route
                            return next
                          })
                        }}
                        style={{ ...inp, borderColor: aanvraagErrors.route ? '#F87171' : '#E5E9F0' }}
                      >
                        <option value="">Kies...</option>
                        {VESTIGINGEN.map((vestiging) => (
                          <option key={vestiging} value={vestiging}>
                            {vestiging}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Naar vestiging</Label>
                      <select
                        value={aanvraag.naar}
                        onChange={(e) => {
                          setAanvraag((prev) => ({ ...prev, naar: e.target.value }))
                          setAanvraagErrors((prev) => {
                            const next = { ...prev }
                            delete next.route
                            return next
                          })
                        }}
                        style={{ ...inp, borderColor: aanvraagErrors.route ? '#F87171' : '#E5E9F0' }}
                      >
                        <option value="">Kies...</option>
                        {VESTIGINGEN.map((vestiging) => (
                          <option key={vestiging} value={vestiging}>
                            {vestiging}
                          </option>
                        ))}
                      </select>
                    </div>
                    {aanvraagErrors.route && (
                      <div
                        style={{
                          fontSize: 12,
                          color: '#991B1B',
                          background: '#FEF2F2',
                          border: '1px solid #FECACA',
                          borderRadius: 8,
                          padding: '8px 10px',
                        }}
                      >
                        Kies bij Van of Naar minimaal een vestiging.
                      </div>
                    )}
                    <ZelfdeVestigingWaarschuwing van={aanvraag.van} naar={aanvraag.naar} />
                    <div>
                      <Label optional>Toelichting</Label>
                      <textarea
                        value={aanvraag.omschrijving}
                        onChange={(e) => setAanvraag((prev) => ({ ...prev, omschrijving: e.target.value }))}
                        placeholder="Aantal kratten, bijzonderheden, gewenste tijd..."
                        rows={2}
                        style={{ ...inp, resize: 'vertical' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div>
                      <Label optional>Wanneer</Label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setAanvraag((prev) => ({ ...prev, week: 'zsm', dag: -1 }))
                            setAanvraagMaand(new Date().toISOString().slice(0, 7))
                            setAanvraagErrors((prev) => {
                              const next = { ...prev }
                              delete next.wanneer
                              return next
                            })
                          }}
                          style={{
                            background: aanvraag.week === 'zsm' ? '#EA6A1F' : '#F3F4F6',
                            color: aanvraag.week === 'zsm' ? '#fff' : '#374151',
                            border: aanvraag.week === 'zsm' ? 'none' : '1px solid #E5E9F0',
                            borderRadius: 8,
                            padding: '8px 12px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Zo snel mogelijk
                        </button>
                        <MonthNav value={aanvraagMaand} onChange={setAanvraagMaand} />
                      </div>
                      <div
                        style={{
                          border: '1px solid #E5E9F0',
                          borderRadius: 8,
                          padding: 10,
                          background: '#F8F9FC',
                        }}
                      >
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                            gap: 5,
                            marginBottom: 5,
                          }}
                        >
                          {WERKDAGEN_KORT.map((dag) => (
                            <div key={dag} style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textAlign: 'center' }}>
                              {dag}
                            </div>
                          ))}
                        </div>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                            gap: 5,
                          }}
                        >
                          {maandDagen(aanvraagMaand).filter((dag) => dag.isWerkdag).map((dag) => {
                            const verleden = isVerledenDatum(dag.date)
                            const selected =
                              aanvraag.week === dag.week &&
                              !verleden &&
                              (Number(aanvraag.dag) === dag.dagIndex || (Number(aanvraag.dag) < 0 && dag.isWerkdag))
                            const waarschuwing = dag.isWerkdag ? blokkadeVoorDag(dag.week, dag.dagIndex) : null
                            const disabled = !dag.isWerkdag || verleden

                            return (
                              <button
                                key={`aanvraag-${dag.iso}`}
                                type="button"
                                disabled={disabled}
                                onClick={() => {
                                  if (disabled) return
                                  setAanvraag((prev) => ({ ...prev, week: dag.week, dag: dag.dagIndex }))
                                  setAanvraagErrors((prev) => {
                                    const next = { ...prev }
                                    delete next.wanneer
                                    return next
                                  })
                                }}
                                style={{
                                  minHeight: 34,
                                  border: selected ? '1px solid #EA6A1F' : '1px solid #E5E9F0',
                                  borderRadius: 7,
                                  background: selected ? '#FFF7ED' : dag.inMaand ? '#fff' : '#F8F9FC',
                                  color: disabled ? '#D1D5DB' : '#111827',
                                  opacity: dag.inMaand ? 1 : 0.55,
                                  cursor: disabled ? 'default' : 'pointer',
                                  fontSize: 12,
                                  fontWeight: selected ? 800 : 600,
                                  position: 'relative',
                                }}
                              >
                                {dag.date.getDate()}
                                {waarschuwing && (
                                  <span
                                    title={`Let op: ${waarschuwing.reden || 'drukke periode'}`}
                                    style={{
                                      position: 'absolute',
                                      right: 4,
                                      top: 4,
                                      width: 5,
                                      height: 5,
                                      borderRadius: '50%',
                                      background: '#F59E0B',
                                    }}
                                  />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 8,
                          marginTop: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#374151',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={aanvraag.week !== 'zsm' && Number(aanvraag.dag) < 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const eersteWerkdag = maandDagen(aanvraagMaand).find(
                                (dag) => dag.inMaand && dag.isWerkdag && !isVerledenDatum(dag.date),
                              )
                              if (!eersteWerkdag) return
                              setAanvraag((prev) => ({
                                ...prev,
                                week:
                                  prev.week === 'zsm' ||
                                  !weekWerkdagen(prev.week).some((dag) => !isVerledenDatum(dag))
                                    ? eersteWerkdag.week
                                    : prev.week,
                                dag: -1,
                              }))
                            } else {
                              setAanvraag((prev) => {
                                const eersteToekomstigeDag = weekWerkdagen(prev.week)
                                  .map((dag, index) => ({ dag, index }))
                                  .find((item) => !isVerledenDatum(item.dag))
                                return { ...prev, dag: eersteToekomstigeDag?.index ?? 0 }
                              })
                            }
                            setAanvraagErrors((prev) => {
                              const next = { ...prev }
                              delete next.wanneer
                              return next
                            })
                          }}
                          style={{ marginTop: 2 }}
                        />
                        <span>
                          Geen vaste dag, deze week heeft voorkeur
                        </span>
                      </label>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>
                        {aanvraag.week === 'zsm'
                          ? 'Bert plant deze zo snel mogelijk in.'
                          : `Voorkeur: ${aanvraagMomentLabel(aanvraag)}.`}
                      </div>
                      {aanvraag.week !== 'zsm' && (
                        <div style={{ marginTop: 8 }}>
                          <DrukteWaarschuwing
                            waarschuwing={
                              Number(aanvraag.dag) < 0
                                ? blokkadeVoorWeek(aanvraag.week)
                                : blokkadeVoorDag(aanvraag.week, aanvraag.dag)
                            }
                          />
                        </div>
                      )}
                      <FieldError>{aanvraagErrors.wanneer}</FieldError>
                    </div>
                    <div>
                      <Label>Prioriteit</Label>
                      <select
                        value={aanvraag.prioriteit}
                        onChange={(e) => setAanvraag((prev) => ({ ...prev, prioriteit: e.target.value }))}
                        style={inp}
                      >
                        <option value="laag">Laag</option>
                        <option value="normaal">Normaal</option>
                        <option value="hoog">Hoog</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={dienAanvraagIn}
                        style={{
                          background: '#EA6A1F',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '10px 0',
                          fontSize: 13,
                          fontWeight: 800,
                          cursor: 'pointer',
                          flex: 1,
                        }}
                      >
                        {aanvraagEditId ? 'Aanvulling opslaan' : 'Aanvraag indienen'}
                      </button>
                      {aanvraagEditId && (
                        <button
                          onClick={annuleerAanvraagEdit}
                          style={{
                            background: '#F3F4F6',
                            color: '#374151',
                            border: '1px solid #E5E9F0',
                            borderRadius: 8,
                            padding: '9px 14px',
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          Annuleer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
              )}
            </div>
          )}

          {tab === 'aanvraagstatus' && rol === 'aanvrager' && (
            <Card>
              <CardHead title="Alle aanvragen" sub={`${aanvragen.filter(aanvraagZichtbaarVoorAanvrager).length} totaal`} />
              <div style={{ padding: 14, display: 'grid', gap: 14 }}>
                {aanvragen.filter(aanvraagZichtbaarVoorAanvrager).length === 0 && (
                  <div style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>
                    Nog geen aanvragen.
                  </div>
                )}
                {[
                  { titel: 'Open aanvragen', filter: aanvraagIsOpen },
                  { titel: 'Niet uitgevoerde aanvragen deze maand', filter: aanvraagNietUitgevoerdDezeMaand },
                  { titel: 'Voltooide aanvragen', filter: aanvraagIsAfgesloten },
                ].map((groep) => {
                  const items = aanvragen
                    .filter((item) => aanvraagZichtbaarVoorAanvrager(item) && groep.filter(item))
                    .slice()
                    .sort(sortAanvragen)

                  return (
                    <div
                      key={groep.titel}
                      style={{
                        border: '1px solid #E5E9F0',
                        borderRadius: 9,
                        background: '#FCFCFD',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '9px 12px',
                          borderBottom: '1px solid #E5E9F0',
                          background: '#F8F9FC',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 650, color: '#374151' }}>{groep.titel}</div>
                        <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 650 }}>{items.length}</div>
                      </div>
                      {items.length === 0 && (
                        <div
                          style={{
                            padding: '14px 16px',
                            color: '#9CA3AF',
                            fontSize: 12,
                            background: '#fff',
                          }}
                        >
                          Geen aanvragen in deze groep.
                        </div>
                      )}
                      <div style={{ display: 'grid', gap: 10, padding: items.length ? 10 : 0 }}>
                        {items.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 14px',
                              border: '1px solid #E5E9F0',
                              borderRadius: 8,
                              gap: 12,
                              flexWrap: 'wrap',
                              background: '#fff',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 220 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.titel}</div>
                              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                                Locatie: {routeLabel(item.van, item.naar)}
                              </div>
                              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                                Wanneer: {aanvraagMomentLabel(item)}
                              </div>
                              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 3 }}>
                                Ingediend: {fmt(new Date(item.aangemaakt || Number(item.id)))}
                              </div>
                              {item.status === 'ingepland' && item.geplandeWeek && (
                                <div style={{ fontSize: 11, color: '#065F46', marginTop: 3, fontWeight: 600 }}>
                                  Ingepland: {weekNr(item.geplandeWeek)} | {dagLabel(item.geplandeDag)}
                                  {(item.geplandeWeek !== item.week || Number(item.geplandeDag) !== Number(item.dag)) &&
                                    ' | Gewijzigd door Bert'}
                                </div>
                              )}
                              {item.status === 'voltooid' && (
                                <div style={{ fontSize: 11, color: '#065F46', marginTop: 3, fontWeight: 600 }}>
                                  Voltooid
                                </div>
                              )}
                              {item.infoNotitie && (
                                <div
                                  style={{
                                    background: '#FFF7ED',
                                    border: '1px solid #FED7AA',
                                    borderRadius: 8,
                                    padding: '8px 10px',
                                    fontSize: 12,
                                    color: '#92400E',
                                    marginTop: 8,
                                  }}
                                >
                                  Bert vraagt: {item.infoNotitie}
                                </div>
                              )}
                              {item.nietUitvoerenReden && (
                                <div
                                  style={{
                                    background: '#FEF2F2',
                                    border: '1px solid #FECACA',
                                    borderRadius: 8,
                                    padding: '9px 11px',
                                    fontSize: 12,
                                    color: '#991B1B',
                                    marginTop: 10,
                                  }}
                                >
                                  Reden niet uitvoeren: {item.nietUitvoerenReden}
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <AanvraagPill status={item.status} />
                              {aanvraagIsOpen(item) && (
                                <Btn variant="ghost" onClick={() => bewerkAanvraag(item)}>
                                  Wijzigen
                                </Btn>
                              )}
                              {aanvraagIsOpen(item) && (
                                <Btn variant="danger" onClick={() => vraagVerwijderAanvraag(item)}>
                                  Verwijderen
                                </Btn>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {tab === 'aanvragen' && rol === 'transporteur' && (
            <Card>
              <CardHead
                title="Aanvragen"
                sub={`${aanvragen.filter((item) => item.status === 'nieuw').length} nieuw${
                  aanvragen.filter((item) => item.status === 'verwijderd').length
                    ? `, ${aanvragen.filter((item) => item.status === 'verwijderd').length} verwijderd onderaan`
                    : ''
                }`}
              />
              <div style={{ padding: 14, display: 'grid', gap: 14 }}>
                {aanvraagMelding && (
                  <div
                    style={{
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      borderRadius: 8,
                      padding: '10px 12px',
                      fontSize: 12,
                      color: '#065F46',
                      fontWeight: 700,
                    }}
                  >
                    {aanvraagMelding}
                  </div>
                )}
                {aanvragen.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>
                    Nog geen aanvragen ontvangen.
                  </div>
                )}
                {[
                  { status: 'nieuw', titel: 'Nieuw' },
                  { status: 'info', titel: 'Meer info nodig' },
                  { status: 'ingepland', titel: 'Ingepland' },
                  { status: 'voltooid', titel: 'Voltooid' },
                  { status: 'afgewezen', titel: 'Niet uitvoeren' },
                  { status: 'verwijderd', titel: 'Verwijderd' },
                ].map((groep) => {
                  const items = aanvragen
                    .filter((item) => item.status === groep.status)
                    .filter((item) => {
                      if (groep.status !== 'verwijderd' || !item.verwijderdOp) return true
                      return Date.now() - new Date(item.verwijderdOp).getTime() <= 30 * 24 * 60 * 60 * 1000
                    })
                    .slice()
                    .sort(sortAanvragen)
                  if (groep.status === 'verwijderd' && items.length === 0) return null
                  const ingeklapt = groep.status === 'verwijderd' && !toonVerwijderd

                  return (
                    <div
                      key={groep.status}
                      style={{
                        border: '1px solid #E5E9F0',
                        borderRadius: 9,
                        background: '#FCFCFD',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '9px 12px',
                          borderBottom: '1px solid #E5E9F0',
                          background: AANVRAAG_STATUS[groep.status]?.bg || '#F8F9FC',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 650, color: AANVRAAG_STATUS[groep.status]?.color || '#374151' }}>{groep.titel}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontSize: 12, color: AANVRAAG_STATUS[groep.status]?.color || '#6B7280', fontWeight: 650 }}>{items.length}</div>
                          {groep.status === 'verwijderd' && items.length > 0 && (
                            <Btn variant="ghost" onClick={() => setToonVerwijderd((prev) => !prev)}>
                              {toonVerwijderd ? 'Verberg' : 'Toon'}
                            </Btn>
                          )}
                        </div>
                      </div>
                      {ingeklapt && (
                        <div
                          style={{
                            border: '1px dashed #E5E9F0',
                            borderRadius: 0,
                            padding: '12px 14px',
                            color: '#6B7280',
                            fontSize: 12,
                            background: '#fff',
                          }}
                        >
                          Verwijderde aanvragen van de laatste 30 dagen zijn verborgen. Gebruik Toon om ze terug te halen.
                        </div>
                      )}
                      {!ingeklapt && items.length === 0 && (
                        <div
                          style={{
                            padding: '14px 16px',
                            color: '#9CA3AF',
                            fontSize: 12,
                            background: '#fff',
                          }}
                        >
                          Geen aanvragen in deze groep.
                        </div>
                      )}
                      {!ingeklapt && <div style={{ display: 'grid', gap: 10, padding: items.length ? 10 : 0 }}>
                        {items.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              padding: '15px 16px',
                              border: '1px solid #E5E9F0',
                              borderRadius: 8,
                              display: 'grid',
                              gridTemplateColumns: '1fr',
                              gap: 18,
                              alignItems: 'start',
                              background: '#fff',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{item.titel}</span>
                                <AanvraagPill status={item.status} />
                                {item.prioriteit === 'hoog' && (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: '#D97706',
                                      background: '#FFF7ED',
                                      border: '1px solid #FED7AA',
                                      borderRadius: 999,
                                      padding: '2px 7px',
                                      fontWeight: 800,
                                    }}
                                  >
                                    Hoog
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'grid', gap: 3, fontSize: 12, color: '#6B7280' }}>
                                <div>Aanvrager: {item.aanvrager || 'Onbekend'}</div>
                                <div>Locatie: {routeLabel(item.van, item.naar)}</div>
                                <div>Wanneer: {aanvraagMomentLabel(item)}</div>
                                <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                                  Ingediend: {fmt(new Date(item.aangemaakt || Number(item.id)))}
                                </div>
                              </div>
                              {item.omschrijving && (
                                <div style={{ fontSize: 13, color: '#374151', marginTop: 8 }}>{item.omschrijving}</div>
                              )}
                              {item.infoNotitie && (
                                <div
                                  style={{
                                    background: '#FFF7ED',
                                    border: '1px solid #FED7AA',
                                    borderRadius: 8,
                                    padding: '9px 11px',
                                    fontSize: 12,
                                    color: '#92400E',
                                    marginTop: 10,
                                  }}
                                >
                                  Info gevraagd: {item.infoNotitie}
                                </div>
                              )}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                gap: 10,
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                marginTop: 12,
                                paddingTop: 12,
                                borderTop: '1px solid #F3F4F6',
                              }}
                            >
                                {item.status !== 'ingepland' && item.status !== 'afgewezen' && item.status !== 'voltooid' && item.status !== 'verwijderd' && (
                                  <Btn size="touch" variant="success" onClick={() => openPlanAanvraag(item)}>
                                    Plan in
                                  </Btn>
                                )}
                                {item.status === 'nieuw' && (
                                  <Btn size="touch" variant="ghost" onClick={() => openInfoNodig(item)}>
                                    Info nodig
                                  </Btn>
                                )}
                                {item.status !== 'verwijderd' && (
                                  <Btn size="touch" variant="ghost" onClick={() => bewerkAanvraag(item)}>
                                    Wijzig
                                  </Btn>
                                )}
                                {item.status !== 'afgewezen' && item.status !== 'ingepland' && item.status !== 'voltooid' && item.status !== 'verwijderd' && (
                                <Btn size="touch" variant="danger" onClick={() => openNietUitvoeren(item)}>
                                  Niet uitvoeren
                                </Btn>
                                )}
                                {item.status === 'verwijderd' && (
                                  <Btn size="touch" variant="success" onClick={() => herstelAanvraag(item.id)}>
                                    Herstel
                                  </Btn>
                                )}
                              {item.status !== 'verwijderd' && (
                                <Btn variant="danger" onClick={() => vraagVerwijderAanvraag(item)}>
                                  Verwijder
                                </Btn>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {tab === 'planning' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 3, background: '#F3F4F6', borderRadius: 8, padding: 3 }}>
                  {[
                    { k: 'week', l: 'Week' },
                    { k: 'maand', l: 'Maand' },
                    { k: 'jaar', l: 'Jaar' },
                  ].map((item) => (
                    <button
                      key={item.k}
                      onClick={() => setPlanningWeergave(item.k)}
                      style={{
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 14px',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        background: planningWeergave === item.k ? '#fff' : 'transparent',
                        color: planningWeergave === item.k ? '#111827' : '#6B7280',
                        boxShadow: planningWeergave === item.k ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                      }}
                    >
                      {item.l}
                    </button>
                  ))}
                </div>
                {planningWeergave === 'maand' ? (
                  <MonthNav value={planningMaand} onChange={setPlanningMaand} min="2026-01" />
                ) : planningWeergave === 'jaar' ? (
                  <YearNav value={planningJaar} onChange={setPlanningJaar} min={2026} />
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setWeek(verschuifWeek(week, -1))}
                      style={{
                        border: '1px solid #E5E9F0',
                        borderRadius: 8,
                        background: '#fff',
                        color: '#374151',
                        padding: '6px 10px',
                        fontSize: 12,
                        fontWeight: 650,
                        cursor: 'pointer',
                      }}
                    >
                      {'< Vorige week'}
                    </button>
                    <select
                      value={week}
                      onChange={(e) => setWeek(e.target.value)}
                      style={{
                        border: '1px solid #E5E9F0',
                        borderRadius: 8,
                        padding: '6px 10px',
                        fontSize: 13,
                        color: '#374151',
                        background: '#fff',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {WEKEN.map((wk) => (
                        <option key={wk} value={wk}>
                          {weekOptieLabel(wk)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setWeek(verschuifWeek(week, 1))}
                      style={{
                        border: '1px solid #E5E9F0',
                        borderRadius: 8,
                        background: '#fff',
                        color: '#374151',
                        padding: '6px 10px',
                        fontSize: 12,
                        fontWeight: 650,
                        cursor: 'pointer',
                      }}
                    >
                      {'Volgende week >'}
                    </button>
                  </>
                )}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['gepland', 'afgerond'].map((status) => {
                    const m = STATUS[status]
                    const bron =
                      planningWeergave === 'maand' ? maandTaken : planningWeergave === 'jaar' ? jaarTaken : weekTaken
                    const cnt = bron.filter((taak) => taak.status === status).length

                    return (
                      <span
                        key={status}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: 11,
                          color: m.color,
                          background: m.bg,
                          borderRadius: 20,
                          padding: '4px 10px',
                          fontWeight: 500,
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot }} />
                        {m.label}: {cnt}
                      </span>
                    )
                  })}
                </div>
              </div>

              {planningWeergave === 'maand' && (
                <Card>
                  <CardHead title={maandLabel(planningMaand)} sub="Klik op een werkdag om die week te openen" />
                  <div style={{ padding: 12 }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                        gap: 6,
                        marginBottom: 6,
                      }}
                    >
                      {WERKDAGEN_KORT.map((dag) => (
                        <div key={dag} style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', padding: '0 4px' }}>
                          {dag}
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                        gap: 6,
                      }}
                    >
                      {maandData.filter((dag) => dag.isWerkdag).map((dag) => {
                        const dagTaken = actieveTaken.filter((taak) => taak.week === dag.week && Number(taak.dag) === dag.dagIndex)
                        const waarschuwing = blokkadeVoorDag(dag.week, dag.dagIndex)
                        const gepland = dagTaken.filter((taak) => taak.status !== 'afgerond').length
                        const hoog = dagTaken.filter((taak) => taak.prioriteit === 'hoog').length
                        const afgerond = dagTaken.filter((taak) => taak.status === 'afgerond').length

                        return (
                          <button
                            key={dag.iso}
                            onClick={() => {
                              setWeek(dag.week)
                              setPlanningWeergave('week')
                            }}
                            style={{
                              minHeight: 86,
                              textAlign: 'left',
                              border: dag.week === week ? '1px solid #EA6A1F' : '1px solid #E5E9F0',
                              borderRadius: 8,
                              background: dag.inMaand ? '#fff' : '#F8F9FC',
                              opacity: dag.inMaand ? 1 : 0.5,
                              padding: 8,
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>
                                {dag.date.getDate()}
                              </span>
                              {waarschuwing && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    color: '#92400E',
                                    fontWeight: 700,
                                    background: '#FFF7ED',
                                    border: '1px solid #FED7AA',
                                    borderRadius: 999,
                                    padding: '1px 6px',
                                  }}
                                >
                                  Let op
                                </span>
                              )}
                            </div>
                            {dagTaken.length > 0 && (
                              <>
                                {gepland > 0 && (
                                  <div style={{ fontSize: 22, fontWeight: 800, color: '#2255CC', lineHeight: 1 }}>
                                    {gepland}
                                  </div>
                                )}
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                  {hoog > 0 && <span style={{ fontSize: 10, color: '#D97706', fontWeight: 700 }}>{hoog} hoog</span>}
                                  {afgerond > 0 && <span style={{ fontSize: 10, color: '#065F46', fontWeight: 700 }}>{afgerond} klaar</span>}
                                </div>
                              </>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </Card>
              )}

              {planningWeergave === 'jaar' && (
                <Card>
                  <CardHead title={planningJaar} sub="Klik op een maand om die maand te openen" />
                  <div
                    style={{
                      padding: 14,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: 10,
                    }}
                  >
                    {jaarMaanden(planningJaar).map((maand) => {
                      const maandTakenVoorJaar = actieveTaken.filter((taak) => isoDag(taakDatum(taak)).slice(0, 7) === maand)
                      const gepland = maandTakenVoorJaar.filter((taak) => taak.status !== 'afgerond').length
                      const afgerond = maandTakenVoorJaar.filter((taak) => taak.status === 'afgerond').length

                      return (
                        <button
                          key={maand}
                          type="button"
                          onClick={() => {
                            setPlanningMaand(maand)
                            setPlanningWeergave('maand')
                          }}
                          style={{
                            minHeight: 90,
                            textAlign: 'left',
                            border: maand === planningMaand ? '1px solid #EA6A1F' : '1px solid #E5E9F0',
                            borderRadius: 8,
                            background: '#fff',
                            padding: 12,
                            cursor: 'pointer',
                            display: 'grid',
                            gap: 8,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#111827', textTransform: 'capitalize' }}>
                              {maandLabel(maand).replace(` ${planningJaar}`, '')}
                            </span>
                          </div>
                          {maandTakenVoorJaar.length > 0 && (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'baseline' }}>
                              {gepland > 0 && (
                                <span style={{ fontSize: 22, fontWeight: 800, color: '#2255CC', lineHeight: 1 }}>
                                  {gepland}
                                </span>
                              )}
                              {afgerond > 0 && (
                                <span style={{ fontSize: 11, color: '#065F46', fontWeight: 700 }}>{afgerond} klaar</span>
                              )}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </Card>
              )}

              {planningWeergave === 'week' && (
                <>
              {gebloktNu && (
                <div
                  style={{
                    background: '#FFF7ED',
                    border: '1px solid #FED7AA',
                    borderRadius: 10,
                    padding: '11px 16px',
                    marginBottom: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 15 }}>Let op</span>
                  <span style={{ fontSize: 13, color: '#92400E' }}>
                    <strong>Drukke periode</strong> -{' '}
                    {weekBlokkade?.reden || 'geen reden opgegeven'}
                  </span>
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 10,
                }}
              >
                {dagData.map((dag, di) => {
                  const dt = weekTaken.filter((taak) => Number(taak.dag) === di)
                  const dagWaarschuwing = blokkadeVoorDag(week, di)

                  return (
                    <div
                      key={DAGEN_KORT[di]}
                      style={{
                        background: '#F8F9FC',
                        border: '1px solid #E5E9F0',
                        borderRadius: 10,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          padding: '9px 11px',
                          background: '#fff',
                          borderBottom: '1px solid #E5E9F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{DAGEN_KORT[di]}</div>
                          <div style={{ fontSize: 10, color: '#9CA3AF' }}>{fmtS(dag)}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {dagWaarschuwing && (
                            <span
                              title={dagWaarschuwing.reden || 'Drukke periode'}
                              style={{
                                background: '#FFF7ED',
                                color: '#92400E',
                                border: '1px solid #FED7AA',
                                fontSize: 10,
                                fontWeight: 700,
                                borderRadius: 10,
                                padding: '1px 7px',
                              }}
                            >
                              Let op
                            </span>
                          )}
                          <span
                            style={{
                              background: '#F3F4F6',
                              color: '#6B7280',
                              fontSize: 10,
                              fontWeight: 600,
                              borderRadius: 10,
                              padding: '1px 7px',
                            }}
                          >
                            {dt.length}
                          </span>
                        </div>
                      </div>
                      <div style={{ padding: 7, minHeight: 60 }}>
                        {dt.length === 0 && (
                          <div style={{ padding: '12px 4px', fontSize: 10, color: '#D1D5DB', textAlign: 'center' }}>
                            Leeg
                          </div>
                        )}
                        {dt.map((taak) => {
                          const sm = STATUS[taak.status] || STATUS.gepland

                          return (
                            <div
                              key={taak.id}
                              style={{
                                background: '#fff',
                                border: '1px solid #E5E9F0',
                                borderRadius: 7,
                                padding: '8px 9px',
                                marginBottom: 5,
                                borderLeft: `3px solid ${sm.dot}`,
                              }}
                            >
                              <div style={{ fontSize: 11, fontWeight: 600, color: '#111827', marginBottom: 2 }}>
                                {taak.titel}
                              </div>
                              {taak.van && taak.naar && (
                                <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 4 }}>
                                  {taak.van.split(' ').pop()} - {taak.naar.split(' ').pop()}
                                </div>
                              )}
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                                <Pill status={taak.status} />
                                {taak.bron === 'zelf' && <span style={{ fontSize: 9, color: '#9CA3AF' }}>Eigen</span>}
                                {taak.bron === 'aanvraag' && (
                                  <span style={{ fontSize: 9, color: '#9CA3AF' }}>Aanvraag</span>
                                )}
                                {taak.prioriteit === 'hoog' && (
                                  <span style={{ fontSize: 9, color: '#D97706', fontWeight: 700 }}>Hoog</span>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: 8, marginTop: 9, flexWrap: 'wrap' }}>
                                {rol === 'transporteur' &&
                                  (taak.status === 'gepland' || taak.status === 'verplaatst' || taak.status === 'onderweg') && (
                                    <Btn size="touch" variant="success" onClick={() => updStatus(taak.id, 'afgerond')}>
                                      Uitvoeren
                                    </Btn>
                                  )}
                                {rol === 'transporteur' &&
                                  (taak.status === 'gepland' || taak.status === 'verplaatst') && (
                                    <Btn
                                      size="touch"
                                      variant="ghost"
                                      onClick={() => {
                                        setModal(taak)
                                        setVerplW(week)
                                        setVerplD(0)
                                        setVerplaatsMaand(isoDag(getMaandag(week)).slice(0, 7))
                                      }}
                                    >
                                      Verplaats
                                    </Btn>
                                )}
                                {rol === 'transporteur' && (
                                  <Btn variant="danger" onClick={() => vraagVerwijderTaak(taak)}>
                                    Verwijder
                                  </Btn>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
                </>
              )}
            </div>
          )}

          {tab === 'toevoegen' && rol === 'transporteur' && (
            <div>
              <div style={{ display: 'flex', gap: 3, background: '#F3F4F6', borderRadius: 8, padding: 3, marginBottom: 14, width: 'fit-content' }}>
                {[
                  { k: 'taak', l: 'Taak' },
                  { k: 'drukte', l: 'Druktemelding' },
                ].map((item) => (
                  <button
                    key={item.k}
                    type="button"
                    onClick={() => setToevoegenTab(item.k)}
                    style={{
                      border: 'none',
                      borderRadius: 6,
                      padding: '7px 14px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: toevoegenTab === item.k ? '#fff' : 'transparent',
                      color: toevoegenTab === item.k ? '#111827' : '#6B7280',
                      boxShadow: toevoegenTab === item.k ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                    }}
                  >
                    {item.l}
                  </button>
                ))}
              </div>
              {toevoegenTab === 'taak' && (
              <Card>
                <CardHead title={taakEditId ? 'Taak wijzigen' : 'Taak toevoegen'} />
                <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'start' }}>
                  {taakMelding && (
                    <div
                      onClick={() => setTaakMelding('')}
                      style={{
                        gridColumn: '1 / -1',
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontSize: 12,
                        color: '#065F46',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {taakMelding}
                    </div>
                  )}
                  {heeftErrors(taakErrors) && (
                    <div
                      style={{
                        gridColumn: '1 / -1',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontSize: 12,
                        color: '#991B1B',
                        fontWeight: 600,
                      }}
                    >
                      Kies eerst wat voor taak dit is.
                    </div>
                  )}
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div>
                      <Label>Wat moet er gebeuren?</Label>
                      <select
                        value={nieuw.titel}
                        onChange={(e) => {
                          setNieuw((prev) => ({ ...prev, titel: e.target.value, omschrijving: '' }))
                          setTaakErrors((prev) => {
                            const next = { ...prev }
                            delete next.titel
                            delete next.omschrijving
                            return next
                          })
                        }}
                        style={{ ...inp, borderColor: taakErrors.titel ? '#F87171' : '#E5E9F0' }}
                      >
                        <option value="">Kies taak...</option>
                        {TAAK_SUGGESTIES.map((suggestie) => (
                          <option key={suggestie} value={suggestie}>
                            {suggestie}
                          </option>
                        ))}
                      </select>
                      <FieldError>{taakErrors.titel}</FieldError>
                    </div>
                    {nieuw.titel === 'Anders' && (
                      <div>
                        <Label>Notitie</Label>
                        <textarea
                          value={nieuw.omschrijving}
                          onChange={(e) => setNieuw((prev) => ({ ...prev, omschrijving: e.target.value }))}
                          placeholder="Bijv. wat er precies anders is, aantallen of bijzonderheden..."
                          rows={2}
                          style={{ ...inp, resize: 'vertical' }}
                        />
                      </div>
                    )}
                    <div>
                      <Label>Van vestiging</Label>
                      <select
                        value={nieuw.van}
                        onChange={(e) => setNieuw((prev) => ({ ...prev, van: e.target.value }))}
                        style={inp}
                      >
                        <option value="">Kies...</option>
                        {VESTIGINGEN.map((vestiging) => (
                          <option key={vestiging} value={vestiging}>
                            {vestiging}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Naar vestiging</Label>
                      <select
                        value={nieuw.naar}
                        onChange={(e) => setNieuw((prev) => ({ ...prev, naar: e.target.value }))}
                        style={inp}
                      >
                        <option value="">Kies...</option>
                        {VESTIGINGEN.map((vestiging) => (
                          <option key={vestiging} value={vestiging}>
                            {vestiging}
                          </option>
                        ))}
                      </select>
                    </div>
                    <ZelfdeVestigingWaarschuwing van={nieuw.van} naar={nieuw.naar} />
                    {nieuw.titel !== 'Anders' && (
                      <div>
                        <Label>Toelichting</Label>
                        <textarea
                          value={nieuw.omschrijving}
                          onChange={(e) => setNieuw((prev) => ({ ...prev, omschrijving: e.target.value }))}
                          placeholder="Aantal kratten, bijzonderheden, gewenste tijd..."
                          rows={2}
                          style={{ ...inp, resize: 'vertical' }}
                        />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div>
                      <Label>Wanneer</Label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                        {!taakEditId && (
                          <button
                            type="button"
                            onClick={openVandaagTaakVraag}
                            style={{
                              background: '#166534',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 8,
                              padding: '8px 12px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Vandaag toevoegen
                          </button>
                        )}
                        <MonthNav value={taakMaand} onChange={setTaakMaand} />
                      </div>
                      <div
                        style={{
                          border: '1px solid #E5E9F0',
                          borderRadius: 8,
                          padding: 10,
                          background: '#F8F9FC',
                        }}
                      >
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                            gap: 5,
                            marginBottom: 5,
                          }}
                        >
                          {DAGEN_KORT.map((dag) => (
                            <div key={dag} style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textAlign: 'center' }}>
                              {dag}
                            </div>
                          ))}
                        </div>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                            gap: 5,
                          }}
                        >
                          {maandDagen(taakMaand).map((dag) => {
                            const selected = nieuw.week === dag.week && Number(nieuw.dag) === dag.dagIndex
                            const waarschuwing = blokkadeVoorDag(dag.week, dag.dagIndex)

                            return (
                              <button
                                key={`taak-${dag.iso}`}
                                type="button"
                                onClick={() => {
                                  setNieuw((prev) => ({ ...prev, week: dag.week, dag: dag.dagIndex }))
                                }}
                                style={{
                                  minHeight: 34,
                                  border: selected ? '1px solid #EA6A1F' : '1px solid #E5E9F0',
                                  borderRadius: 7,
                                  background: selected ? '#FFF7ED' : dag.inMaand ? '#fff' : '#F8F9FC',
                                  color: '#111827',
                                  opacity: dag.inMaand ? 1 : 0.55,
                                  cursor: 'pointer',
                                  fontSize: 12,
                                  fontWeight: selected ? 800 : 600,
                                  position: 'relative',
                                }}
                              >
                                {dag.date.getDate()}
                                {waarschuwing && (
                                  <span
                                    title={`Let op: ${waarschuwing.reden || 'drukke periode'}`}
                                    style={{
                                      position: 'absolute',
                                      right: 4,
                                      top: 4,
                                      width: 5,
                                      height: 5,
                                      borderRadius: '50%',
                                      background: '#F59E0B',
                                    }}
                                  />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>
                        Gekozen: {aanvraagWeekLabel(nieuw.week)} | {dagLabel(nieuw.dag)}
                      </div>
                    </div>
                    <div>
                      <Label>Prioriteit</Label>
                      <select
                        value={nieuw.prioriteit}
                        onChange={(e) => setNieuw((prev) => ({ ...prev, prioriteit: e.target.value }))}
                        style={inp}
                      >
                        <option value="laag">Laag</option>
                        <option value="normaal">Normaal</option>
                        <option value="hoog">Hoog</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => voegToe('gepland')}
                        style={{
                          background: '#EA6A1F',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '10px 0',
                          fontSize: 13,
                          fontWeight: 800,
                          cursor: 'pointer',
                          flex: 1,
                        }}
                      >
                        {taakEditId ? 'Wijziging opslaan' : 'Taak toevoegen'}
                      </button>
                      {taakEditId && (
                        <button
                          onClick={() => {
                            setTaakEditId(null)
                            setNieuw({
                              titel: '',
                              omschrijving: '',
                              van: '',
                              naar: '',
                              week: vandaag(),
                              dag: vandaagDagIndex(),
                              prioriteit: 'normaal',
                            })
                            setTaakErrors({})
                          }}
                          style={{
                            background: '#F3F4F6',
                            color: '#374151',
                            border: '1px solid #E5E9F0',
                            borderRadius: 8,
                            padding: '9px 14px',
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          Annuleer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
              )}
            </div>
          )}

          {tab === 'alletaken' && rol === 'transporteur' && (
            <Card>
              <CardHead
                title="Alle taken"
                sub={`${actieveTaken.length} actief${verwijderdeTaken.length ? `, ${verwijderdeTaken.length} verwijderd` : ''}`}
              />
              <div style={{ padding: 14, borderBottom: '1px solid #E5E9F0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  value={taakZoekterm}
                  onChange={(e) => setTaakZoekterm(e.target.value)}
                  placeholder="Zoek op taak, vestiging, datum of week..."
                  style={{ ...inp, flex: '1 1 260px', minWidth: 220 }}
                />
                {verwijderdeTaken.length > 0 && (
                  <Btn variant="ghost" size="touch" onClick={() => setToonVerwijderdeTaken((prev) => !prev)}>
                    {toonVerwijderdeTaken ? 'Verberg verwijderde taken' : 'Toon verwijderde taken'}
                  </Btn>
                )}
              </div>
              <div style={{ maxHeight: 620, overflowY: 'auto', padding: 14, display: 'grid', gap: 14 }}>
                {gezochteActieveTaken.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 28, color: '#9CA3AF', fontSize: 13 }}>
                    {taakZoekterm.trim() ? 'Geen taken gevonden.' : 'Nog geen taken.'}
                  </div>
                )}
                {Object.keys(takenPerMaand).map((maand) => (
                  <div
                    key={maand}
                    style={{
                      border: '1px solid #E5E9F0',
                      borderRadius: 9,
                      background: '#FCFCFD',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        padding: '9px 12px',
                        borderBottom: '1px solid #E5E9F0',
                        background: '#F8F9FC',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 650, color: '#374151', textTransform: 'capitalize' }}>
                        {maandLabel(maand)}
                      </span>
                      <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 650 }}>{takenPerMaand[maand].length}</span>
                    </div>
                    <div style={{ display: 'grid' }}>
                      {takenPerMaand[maand].map((taak) => (
                        <div
                          key={taak.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            borderBottom: '1px solid #F3F4F6',
                            gap: 12,
                            flexWrap: 'wrap',
                            background: '#fff',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 230 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{taak.titel}</div>
                            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                              {weekNr(taak.week)} | {DAGEN[taak.dag]} | {bronLabel(taak.bron)}
                            </div>
                            {(taak.van || taak.naar) && (
                              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{routeLabel(taak.van, taak.naar)}</div>
                            )}
                            <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 3 }}>
                              Geplaatst: {fmt(new Date(taak.aangemaakt || Number(taak.id)))}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <Pill status={taak.status} />
                            <Btn variant="ghost" onClick={() => bewerkTaak(taak)}>
                              Wijzig
                            </Btn>
                            <Btn variant="danger" onClick={() => vraagVerwijderTaak(taak)}>
                              Verwijder
                            </Btn>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {verwijderdeTaken.length > 0 && (
                  <div
                    style={{
                      border: '1px solid #E5E9F0',
                      borderRadius: 9,
                      background: '#FCFCFD',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        padding: '9px 12px',
                        borderBottom: '1px solid #E5E9F0',
                        background: '#F3F4F6',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 650, color: '#374151' }}>Verwijderde taken</span>
                      <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 650 }}>
                        {gezochteVerwijderdeTaken.length}
                      </span>
                    </div>
                    {!toonVerwijderdeTaken ? (
                      <div style={{ padding: '12px 14px', fontSize: 12, color: '#6B7280', background: '#fff' }}>
                        Verwijderde taken zijn verborgen. Gebruik Toon om ze terug te halen.
                      </div>
                    ) : gezochteVerwijderdeTaken.length === 0 ? (
                      <div style={{ padding: '12px 14px', fontSize: 12, color: '#9CA3AF', background: '#fff' }}>
                        Geen verwijderde taken gevonden.
                      </div>
                    ) : (
                      Object.keys(verwijderdeTakenPerMaand).map((maand) => (
                        <div key={`verwijderd-${maand}`}>
                          <div
                            style={{
                              padding: '8px 12px',
                              background: '#FAFAFA',
                              borderBottom: '1px solid #F3F4F6',
                              fontSize: 12,
                              fontWeight: 650,
                              color: '#6B7280',
                              textTransform: 'capitalize',
                            }}
                          >
                            {maandLabel(maand)}
                          </div>
                          {verwijderdeTakenPerMaand[maand].map((taak) => (
                            <div
                              key={taak.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 14px',
                                borderBottom: '1px solid #F3F4F6',
                                gap: 12,
                                flexWrap: 'wrap',
                                background: '#fff',
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 230 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{taak.titel}</div>
                                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                                  {weekNr(taak.week)} | {DAGEN[taak.dag]} | {bronLabel(taak.bron)}
                                </div>
                                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 3 }}>
                                  Verwijderd: {fmt(new Date(taak.verwijderdOp || taak.aangemaakt || Number(taak.id)))}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <Pill status={taak.status} />
                                <Btn variant="success" onClick={() => herstelTaak(taak.id)}>
                                  Herstel
                                </Btn>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          {tab === 'toevoegen' && rol === 'transporteur' && toevoegenTab === 'drukte' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
              <Card>
                <CardHead title="Druktemelding toevoegen" />
                <div style={{ padding: 18, display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 3, background: '#F3F4F6', borderRadius: 8, padding: 3 }}>
                    {[
                      { k: 'week', l: 'Week/weken' },
                      { k: 'dag', l: 'Dag' },
                    ].map((item) => (
                      <button
                        key={item.k}
                        style={{
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: blokForm.type === item.k ? '#fff' : 'transparent',
                          color: blokForm.type === item.k ? '#111827' : '#6B7280',
                        }}
                        type="button"
                        onClick={() =>
                          setBlokForm((prev) => ({
                            ...prev,
                            type: item.k,
                            week: item.k === 'dag' && !prev.week ? vandaag() : prev.week,
                            dag: item.k === 'dag' ? Number(prev.dag ?? vandaagDagIndex()) : prev.dag,
                            eindWeek: item.k === 'dag' ? '' : prev.eindWeek,
                          }))
                        }
                      >
                        {item.l}
                      </button>
                    ))}
                  </div>
                  {blokForm.type === 'week' && (
                    <>
                      <div>
                        <Label>Vanaf week</Label>
                        <select
                          value={blokForm.week}
                          onChange={(e) => setBlokForm((prev) => ({ ...prev, week: e.target.value }))}
                          style={inp}
                        >
                          <option value="">Kies week...</option>
                          {WEKEN.map((wk) => (
                            <option key={wk} value={wk}>
                              {weekOptieLabel(wk)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Tot en met week</Label>
                        <select
                          value={blokForm.eindWeek}
                          onChange={(e) => setBlokForm((prev) => ({ ...prev, eindWeek: e.target.value }))}
                          style={inp}
                        >
                          <option value="">Alleen deze week</option>
                          {WEKEN.map((wk) => (
                            <option key={wk} value={wk}>
                              {weekOptieLabel(wk)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                  {blokForm.type === 'dag' && (
                    <div>
                      <Label>Welke dag?</Label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setBlokForm((prev) => ({ ...prev, week: vandaag(), dag: vandaagDagIndex() }))
                            setBlokMaand(new Date().toISOString().slice(0, 7))
                          }}
                          style={{
                            background: blokForm.week === vandaag() && Number(blokForm.dag) === vandaagDagIndex() ? '#EA6A1F' : '#F3F4F6',
                            color: blokForm.week === vandaag() && Number(blokForm.dag) === vandaagDagIndex() ? '#fff' : '#374151',
                            border: blokForm.week === vandaag() && Number(blokForm.dag) === vandaagDagIndex() ? 'none' : '1px solid #E5E9F0',
                            borderRadius: 8,
                            padding: '8px 12px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Vandaag
                        </button>
                        <MonthNav value={blokMaand} onChange={setBlokMaand} />
                      </div>
                      <div
                        style={{
                          border: '1px solid #E5E9F0',
                          borderRadius: 8,
                          padding: 10,
                          background: '#F8F9FC',
                        }}
                      >
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                            gap: 5,
                            marginBottom: 5,
                          }}
                        >
                          {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((dag) => (
                            <div key={dag} style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textAlign: 'center' }}>
                              {dag}
                            </div>
                          ))}
                        </div>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                            gap: 5,
                          }}
                        >
                          {maandDagen(blokMaand).map((dag) => {
                            const selected = blokForm.week === dag.week && Number(blokForm.dag) === dag.dagIndex

                            return (
                              <button
                                key={`drukte-${dag.iso}`}
                                type="button"
                                onClick={() => {
                                  setBlokForm((prev) => ({ ...prev, week: dag.week, dag: dag.dagIndex }))
                                }}
                                style={{
                                  minHeight: 34,
                                  border: selected ? '1px solid #EA6A1F' : '1px solid #E5E9F0',
                                  borderRadius: 7,
                                  background: selected ? '#FFF7ED' : dag.inMaand ? '#fff' : '#F8F9FC',
                                  color: '#111827',
                                  opacity: dag.inMaand ? 1 : 0.55,
                                  cursor: 'pointer',
                                  fontSize: 12,
                                  fontWeight: selected ? 800 : 600,
                                }}
                              >
                                {dag.date.getDate()}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>
                        Gekozen: {blokForm.week ? `${aanvraagWeekLabel(blokForm.week)} | ${dagLabel(blokForm.dag)}` : 'kies een werkdag'}
                      </div>
                    </div>
                  )}
                  <div>
                    <Label>Reden</Label>
                    <input
                      value={blokForm.reden}
                      onChange={(e) => setBlokForm((prev) => ({ ...prev, reden: e.target.value }))}
                      placeholder="bijv. week voor schoolvakantie of veel vaste routes"
                      style={inp}
                    />
                  </div>
                  <button
                    onClick={blokkeer}
                    style={{
                      background: '#1F7A4D',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '9px 0',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    Melding toevoegen
                  </button>
                </div>
              </Card>

              <Card>
                <CardHead title="Handmatige druktemeldingen" sub={`${geblokt.length} meldingen`} />
                <div style={{ padding: 16 }}>
                  {geblokt.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 24, color: '#9CA3AF', fontSize: 13 }}>
                      Geen handmatige druktemeldingen.
                    </div>
                  )}
                  {geblokt.map((item) => (
                    <div
                      key={item.id || `${item.week}-${item.dag ?? 'week'}`}
                      style={{
                        background: '#FFF7ED',
                        border: '1px solid #FED7AA',
                        borderRadius: 10,
                        padding: '11px 14px',
                        marginBottom: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>
                          {weekNr(item.week)} - {weekRange(item.week)}
                          {item.dag !== null && item.dag !== undefined ? ` | ${DAGEN[item.dag]}` : ''}
                        </div>
                        {item.reden && <div style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>{item.reden}</div>}
                      </div>
                      <Btn
                        variant="danger"
                        onClick={() =>
                          setGeblokt((prev) =>
                            prev.filter((x) => (item.id ? x.id !== item.id : x.week !== item.week || x.dag !== item.dag)),
                          )
                        }
                      >
                        Melding verwijderen
                      </Btn>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHead title="Automatische vakantiewaarschuwingen" sub="Regio Noord" />
                <div style={{ padding: 16, maxHeight: 420, overflowY: 'auto' }}>
                  {automatischeBlokkades()
                    .filter((item) => getMaandag(item.week) >= getMaandag(vandaag()))
                    .map((item) => (
                      <div
                        key={`${item.week}-${item.reden}`}
                        style={{
                          background: '#F8F9FC',
                          border: '1px solid #E5E9F0',
                          borderRadius: 10,
                          padding: '10px 12px',
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                          {weekNr(item.week)} - {weekRange(item.week)}
                        </div>
                        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{item.reden}</div>
                      </div>
                    ))}
                </div>
              </Card>
            </div>
          )}

          {tab === 'rapportage' && (
            <div>
              <Card style={{ marginBottom: 18 }}>
                <CardHead title="Rapportage genereren" />
                <div style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 3, background: '#F3F4F6', borderRadius: 8, padding: 3 }}>
                    {['week', 'maand', 'jaar'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setRapp((prev) => ({ ...prev, type }))}
                        style={{
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 14px',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                          background: rapp.type === type ? '#fff' : 'transparent',
                          color: rapp.type === type ? '#111827' : '#6B7280',
                          boxShadow: rapp.type === type ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                        }}
                      >
                        {type === 'week' ? 'Per week' : type === 'maand' ? 'Per maand' : 'Per jaar'}
                      </button>
                    ))}
                  </div>
                  {rapp.type === 'week' ? (
                    <select
                      value={rapp.week}
                      onChange={(e) => setRapp((prev) => ({ ...prev, week: e.target.value }))}
                      style={{ ...inp, width: 'auto', padding: '7px 12px' }}
                    >
                      {WEKEN.map((wk) => (
                        <option key={wk} value={wk}>
                          {weekOptieLabel(wk)}
                        </option>
                      ))}
                    </select>
                  ) : rapp.type === 'maand' ? (
                    <input
                      type="month"
                      value={rapp.maand}
                      onChange={(e) => setRapp((prev) => ({ ...prev, maand: e.target.value }))}
                      style={{ ...inp, width: 'auto', padding: '7px 12px' }}
                    />
                  ) : (
                    <input
                      type="number"
                      min="2026"
                      max="2035"
                      value={rapp.jaar}
                      onChange={(e) => setRapp((prev) => ({ ...prev, jaar: e.target.value }))}
                      style={{ ...inp, width: 110, padding: '7px 12px' }}
                    />
                  )}
                </div>
              </Card>

              {rappData && (
                <div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                      gap: 10,
                      marginBottom: 18,
                    }}
                  >
                    {[
                      { l: 'Totaal taken', v: rappData.totaal, c: '#111827' },
                      { l: 'Afgerond', v: rappData.ps.afgerond, c: '#065F46' },
                      { l: 'Gepland', v: rappData.ps.gepland, c: '#1D4ED8' },
                      { l: 'Uit aanvragen', v: rappData.aanvragen, c: '#111827' },
                      { l: 'Bert taken', v: rappData.zelf, c: '#1F7A4D' },
                    ].map((item) => (
                      <div
                        key={item.l}
                        style={{
                          background: '#F8F9FC',
                          border: '1px solid #E5E9F0',
                          borderRadius: 10,
                          padding: '13px 16px',
                        }}
                      >
                        <div style={{ fontSize: 26, fontWeight: 700, color: item.c }}>{item.v}</div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3 }}>{item.l}</div>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: 10,
                      marginBottom: 18,
                    }}
                  >
                    {[
                      { titel: 'Prioriteit', items: [
                        { label: 'Hoog', aantal: rappData.prioriteit.hoog },
                        { label: 'Normaal', aantal: rappData.prioriteit.normaal },
                        { label: 'Laag', aantal: rappData.prioriteit.laag },
                      ] },
                      { titel: 'Veelvoorkomende taken', items: rappData.soorten },
                      { titel: 'Vaak vanaf', items: rappData.van },
                      { titel: 'Vaak naar', items: rappData.naar },
                    ].map((blok) => (
                      <div
                        key={blok.titel}
                        style={{
                          background: '#fff',
                          border: '1px solid #E5E9F0',
                          borderRadius: 8,
                          padding: '12px 14px',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 8 }}>{blok.titel}</div>
                        {blok.items.length === 0 && <div style={{ fontSize: 12, color: '#9CA3AF' }}>Geen gegevens.</div>}
                        {blok.items.map((item) => (
                          <div
                            key={item.label}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: 10,
                              fontSize: 12,
                              color: '#374151',
                              marginTop: 5,
                            }}
                          >
                            <span>{item.label}</span>
                            <strong>{item.aantal}</strong>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <Card>
                    <CardHead title="Taken detail" sub={`${rappData.taken.length} taken`} />
                    <div>
                      {rappData.taken.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 28, color: '#9CA3AF', fontSize: 13 }}>
                          Geen taken in deze periode.
                        </div>
                      )}
                      {rappData.taken.map((taak, index) => (
                        <div
                          key={taak.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 18px',
                            fontSize: 12,
                            borderBottom: index < rappData.taken.length - 1 ? '1px solid #F3F4F6' : 'none',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span style={{ flex: 2, fontWeight: 500, color: '#111827' }}>{taak.titel}</span>
                          <span style={{ flex: 2, color: '#6B7280' }}>
                            {DAGEN[taak.dag]}
                            {taak.van && taak.naar ? ` | ${taak.van.split(' ').pop()} -> ${taak.naar.split(' ').pop()}` : ''}
                          </span>
                          <span style={{ flex: 1, color: '#6B7280' }}>
                            {bronLabel(taak.bron)}
                          </span>
                          <Pill status={taak.status} />
                        </div>
                      ))}
                    </div>
                  </Card>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <button
                      onClick={exportRapportCsv}
                      style={{
                        background: '#1F7A4D',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '9px 18px',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Export naar Excel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {helpOpen && (
        <div
          onClick={() => setHelpOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,.32)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 230,
            padding: 20,
            boxSizing: 'border-box',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: 22,
              width: '100%',
              maxWidth: 460,
              boxShadow: '0 20px 60px rgba(0,0,0,.15)',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>Korte hulp</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  {rol === 'aanvrager' ? 'Voor aanvragen en status bekijken.' : 'Voor planning en aanvragen beheren.'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  border: '1px solid #E5E9F0',
                  background: '#F8F9FC',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                x
              </button>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {(rol === 'aanvrager'
                ? [
                    ['Aanvraag indienen', 'Maak een nieuwe transportaanvraag voor Bert.'],
                    ['Alle aanvragen', 'Bekijk de status, wijzig open aanvragen of verwijder ze.'],
                    ['Niet uitgevoerd', 'Aanvragen die Bert niet uitvoert blijven deze maand zichtbaar met reden.'],
                  ]
                : [
                    ['Planning', 'Bekijk taken per week, maand of jaar.'],
                    ['Aanvragen', 'Plan aanvragen in, vraag extra info of zet ze op niet uitvoeren.'],
                    [
                      'Toevoegen',
                      'Voeg een taak toe of zet een druktemelding, bijvoorbeeld vakantie, afwezigheid of een drukke week. Aanvragers zien deze waarschuwing bij het kiezen van een datum.',
                    ],
                    ['Alle taken', 'Zoek taken terug, wijzig ze of verwijder ze.'],
                    ['Rapportage', 'Maak een overzicht per week, maand of jaar.'],
                  ]
              ).map(([titel, tekst]) => (
                <div
                  key={titel}
                  style={{
                    border: '1px solid #E5E9F0',
                    borderRadius: 8,
                    padding: '10px 12px',
                    background: '#F8F9FC',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{titel}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{tekst}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {vandaagTaakVraag && (
        <div
          onClick={() => setVandaagTaakVraag(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 216,
            padding: 20,
            boxSizing: 'border-box',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: 24,
              width: '100%',
              maxWidth: 390,
              boxShadow: '0 20px 60px rgba(0,0,0,.15)',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 650, color: '#111827', marginBottom: 6 }}>Afgerond?</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 18 }}>
              Moet deze taak meteen als klaar worden opgeslagen?
            </div>
            {taakErrors.titel && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                  padding: '9px 11px',
                  fontSize: 12,
                  color: '#991B1B',
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                Kies eerst wat voor taak dit is.
              </div>
            )}
            <div style={{ display: 'grid', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  if (voegToe('afgerond', 'alletaken')) setVandaagTaakVraag(false)
                }}
                style={{
                  background: '#166534',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 0',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Ja, afgerond
              </button>
              <button
                type="button"
                onClick={() => {
                  if (voegToe('gepland', 'planning')) setVandaagTaakVraag(false)
                }}
                style={{
                  background: '#EEF4FF',
                  color: '#2255CC',
                  border: '1px solid #C7D7FE',
                  borderRadius: 8,
                  padding: '10px 0',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Nee, zet in planning
              </button>
              <button
                type="button"
                onClick={() => setVandaagTaakVraag(false)}
                style={{
                  background: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #E5E9F0',
                  borderRadius: 8,
                  padding: '9px 0',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Annuleer
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div
          onClick={() => setModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: 20,
            boxSizing: 'border-box',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: 24,
              width: '100%',
              maxWidth: 430,
              boxShadow: '0 20px 60px rgba(0,0,0,.15)',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Taak verplaatsen</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 10 }}>"{modal.titel}"</div>
            <div
              style={{
                background: '#F8F9FC',
                border: '1px solid #E5E9F0',
                borderRadius: 8,
                padding: '9px 11px',
                fontSize: 12,
                color: '#374151',
                marginBottom: 14,
              }}
            >
              Nu: {weekNr(modal.week)} | {dagLabel(modal.dag)}
            </div>
            <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setVerplW(vandaag())
                    setVerplD(vandaagDagIndex())
                    setVerplaatsMaand(new Date().toISOString().slice(0, 7))
                  }}
                  style={{
                    background: verplW === vandaag() && Number(verplD) === vandaagDagIndex() ? '#EA6A1F' : '#F3F4F6',
                    color: verplW === vandaag() && Number(verplD) === vandaagDagIndex() ? '#fff' : '#374151',
                    border: verplW === vandaag() && Number(verplD) === vandaagDagIndex() ? 'none' : '1px solid #E5E9F0',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Vandaag
                </button>
                <MonthNav value={verplaatsMaand} onChange={setVerplaatsMaand} />
              </div>
              <div
                style={{
                  border: '1px solid #E5E9F0',
                  borderRadius: 8,
                  padding: 10,
                  background: '#F8F9FC',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                    gap: 5,
                    marginBottom: 5,
                  }}
                >
                  {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((dag) => (
                    <div key={dag} style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textAlign: 'center' }}>
                      {dag}
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                    gap: 5,
                  }}
                >
                  {maandDagen(verplaatsMaand).map((dag) => {
                    const selected = verplW === dag.week && Number(verplD) === dag.dagIndex
                    const waarschuwing = blokkadeVoorDag(dag.week, dag.dagIndex)

                    return (
                      <button
                        key={`verplaats-${dag.iso}`}
                        type="button"
                        onClick={() => {
                          setVerplW(dag.week)
                          setVerplD(dag.dagIndex)
                        }}
                        style={{
                          minHeight: 42,
                          border: selected ? '1px solid #EA6A1F' : '1px solid #E5E9F0',
                          borderRadius: 7,
                          background: selected ? '#FFF7ED' : dag.inMaand ? '#fff' : '#F8F9FC',
                          color: '#111827',
                          opacity: dag.inMaand ? 1 : 0.55,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: selected ? 800 : 600,
                          position: 'relative',
                        }}
                      >
                        {dag.date.getDate()}
                        {waarschuwing && (
                          <span
                            title={`Let op: ${waarschuwing.reden || 'drukke periode'}`}
                            style={{
                              position: 'absolute',
                              right: 4,
                              top: 4,
                              width: 5,
                              height: 5,
                              borderRadius: '50%',
                              background: '#F59E0B',
                            }}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>
                Naar: {verplW ? `${weekNr(verplW)} | ${dagLabel(verplD)}` : 'kies een werkdag'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={verplaats}
                style={{
                  flex: 1,
                  background: '#2563EB',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 0',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Verplaatsen
              </button>
              <button
                onClick={() => setModal(null)}
                style={{
                  flex: 1,
                  background: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #E5E9F0',
                  borderRadius: 8,
                  padding: '9px 0',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Annuleer
              </button>
            </div>
          </div>
        </div>
      )}

      {bevestigVerwijderen && (
        <div
          onClick={() => setBevestigVerwijderen(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 215,
            padding: 20,
            boxSizing: 'border-box',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: 24,
              width: '100%',
              maxWidth: 390,
              boxShadow: '0 20px 60px rgba(0,0,0,.15)',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 6 }}>
              {bevestigVerwijderen.type === 'aanvraag' ? 'Aanvraag verwijderen?' : 'Taak verwijderen?'}
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 18 }}>
              "{bevestigVerwijderen.item.titel}" wordt {bevestigVerwijderen.type === 'aanvraag' ? 'naar Verwijderd verplaatst en kan later worden hersteld.' : 'naar Verwijderde taken verplaatst en kan later worden hersteld.'}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setBevestigVerwijderen(null)}
                style={{
                  flex: 1,
                  background: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #E5E9F0',
                  borderRadius: 8,
                  padding: '10px 0',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Annuleer
              </button>
              <button
                onClick={voerVerwijderenUit}
                style={{
                  flex: 1,
                  background: '#FEF2F2',
                  color: '#991B1B',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                  padding: '10px 0',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Verwijder
              </button>
            </div>
          </div>
        </div>
      )}

      {nietUitvoerenAanvraag && (
        <div
          onClick={() => setNietUitvoerenAanvraag(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 206,
            padding: 20,
            boxSizing: 'border-box',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: 24,
              width: '100%',
              maxWidth: 420,
              boxShadow: '0 20px 60px rgba(0,0,0,.15)',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
              Niet uitvoeren
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>"{nietUitvoerenAanvraag.titel}"</div>
            <div style={{ marginBottom: 18 }}>
              <Label optional>Reden voor de aanvrager</Label>
              <textarea
                value={nietUitvoerenReden}
                onChange={(e) => setNietUitvoerenReden(e.target.value)}
                placeholder="Bijv. dit valt onder regulier transport, of er is eerst meer afstemming nodig."
                rows={4}
                style={{ ...inp, resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={slaNietUitvoerenOp}
                style={{
                  flex: 1,
                  background: '#FEF2F2',
                  color: '#991B1B',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                  padding: '9px 0',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Niet uitvoeren
              </button>
              <button
                onClick={() => setNietUitvoerenAanvraag(null)}
                style={{
                  flex: 1,
                  background: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #E5E9F0',
                  borderRadius: 8,
                  padding: '9px 0',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Annuleer
              </button>
            </div>
          </div>
        </div>
      )}

      {infoAanvraag && (
        <div
          onClick={() => setInfoAanvraag(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 205,
            padding: 20,
            boxSizing: 'border-box',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: 24,
              width: '100%',
              maxWidth: 420,
              boxShadow: '0 20px 60px rgba(0,0,0,.15)',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
              Welke info is nodig?
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>"{infoAanvraag.titel}"</div>
            <div style={{ marginBottom: 18 }}>
              <Label>Notitie voor de aanvrager</Label>
              <textarea
                value={infoNotitie}
                onChange={(e) => setInfoNotitie(e.target.value)}
                placeholder="Bijv. hoeveel kratten zijn het, of welke vestiging bedoel je precies?"
                rows={4}
                style={{ ...inp, resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={slaInfoNodigOp}
                style={{
                  flex: 1,
                  background: '#EA6A1F',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 0',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Info vragen
              </button>
              <button
                onClick={() => setInfoAanvraag(null)}
                style={{
                  flex: 1,
                  background: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #E5E9F0',
                  borderRadius: 8,
                  padding: '9px 0',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Annuleer
              </button>
            </div>
          </div>
        </div>
      )}

      {planAanvraag && (
        <div
          onClick={() => setPlanAanvraag(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 210,
            padding: 20,
            boxSizing: 'border-box',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: 24,
              width: '100%',
              maxWidth: 460,
              boxShadow: '0 20px 60px rgba(0,0,0,.15)',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
              Aanvraag inplannen
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>"{planAanvraag.titel}"</div>
            <div
              style={{
                background: '#FFF7ED',
                border: '1px solid #FED7AA',
                borderRadius: 8,
                padding: '9px 11px',
                fontSize: 12,
                color: '#92400E',
                marginBottom: 16,
              }}
            >
              Aangevraagd voor {aanvraagMomentLabel(planAanvraag)}
            </div>
            <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setPlanW(vandaag())
                    setPlanD(vandaagDagIndex())
                    setPlanMaand(new Date().toISOString().slice(0, 7))
                  }}
                  style={{
                    background: planW === vandaag() && Number(planD) === vandaagDagIndex() ? '#EA6A1F' : '#F3F4F6',
                    color: planW === vandaag() && Number(planD) === vandaagDagIndex() ? '#fff' : '#374151',
                    border: planW === vandaag() && Number(planD) === vandaagDagIndex() ? 'none' : '1px solid #E5E9F0',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Vandaag
                </button>
                <MonthNav value={planMaand} onChange={setPlanMaand} />
              </div>
              <div
                style={{
                  border: '1px solid #E5E9F0',
                  borderRadius: 8,
                  padding: 10,
                  background: '#F8F9FC',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                    gap: 5,
                    marginBottom: 5,
                  }}
                >
                  {DAGEN_KORT.map((dag) => (
                    <div key={dag} style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textAlign: 'center' }}>
                      {dag}
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                    gap: 5,
                  }}
                >
                  {maandDagen(planMaand).map((dag) => {
                    const selected = planW === dag.week && Number(planD) === dag.dagIndex
                    const aanvraagDag =
                      planAanvraag.week !== 'zsm' &&
                      planAanvraag.week === dag.week &&
                      (Number(planAanvraag.dag) === dag.dagIndex || Number(planAanvraag.dag) < 0)
                    const waarschuwing = blokkadeVoorDag(dag.week, dag.dagIndex)

                    return (
                      <button
                        key={`plan-${dag.iso}`}
                        type="button"
                        onClick={() => {
                          setPlanW(dag.week)
                          setPlanD(dag.dagIndex)
                        }}
                        style={{
                          minHeight: 38,
                          border: selected ? '1px solid #EA6A1F' : aanvraagDag ? '1px solid #A7F3D0' : '1px solid #E5E9F0',
                          borderRadius: 7,
                          background: selected ? '#FFF7ED' : aanvraagDag ? '#ECFDF5' : dag.inMaand ? '#fff' : '#F8F9FC',
                          color: '#111827',
                          opacity: dag.inMaand ? 1 : 0.55,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: selected ? 800 : 600,
                          position: 'relative',
                        }}
                      >
                        {dag.date.getDate()}
                        {waarschuwing && (
                          <span
                            title={`Let op: ${waarschuwing.reden || 'drukke periode'}`}
                            style={{
                              position: 'absolute',
                              right: 4,
                              top: 4,
                              width: 5,
                              height: 5,
                              borderRadius: '50%',
                              background: '#F59E0B',
                            }}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>
                Gekozen: {planW ? `${weekNr(planW)} | ${dagLabel(planD)}` : 'kies een dag'}
              </div>
              <DrukteWaarschuwing waarschuwing={blokkadeVoorDag(planW, planD)} compact />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={zetAanvraagDoor}
                style={{
                  flex: 1,
                  background: '#EA6A1F',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 0',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Definitief inplannen
              </button>
              <button
                onClick={() => setPlanAanvraag(null)}
                style={{
                  flex: 1,
                  background: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #E5E9F0',
                  borderRadius: 8,
                  padding: '9px 0',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Annuleer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
