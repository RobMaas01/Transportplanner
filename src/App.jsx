import { useEffect, useRef, useState } from 'react'
import './App.css'
import logo from './assets/kopgroep-logo-official.png'
import logoIcon from './assets/kopgroep-logo-icon.jpeg'
import {
  AANVRAAG_STATUS,
  DAGEN,
  DAGEN_KORT,
  PIN_BERT,
  ROLES,
  STATUS,
  TAAK_SUGGESTIES,
  VESTIGINGEN,
  WERKDAGEN_KORT,
} from './constants'
import {
  AanvraagPill,
  Btn,
  Card,
  CardHead,
  DrukteWaarschuwing,
  EducatieImportLayout,
  EducatieProjectenLayout,
  FieldError,
  Label,
  MonthNav,
  Pill,
  YearNav,
  ZelfdeVestigingWaarschuwing,
} from './components'
import { inp } from './uiStyles'
import { bewaarCentraleState, isLegeState, laadCentraleState, localTestMode, supabaseConfigured } from './dataStore'
import { maakEducatieAanvragen } from './educatieImport'
import {
  aanvraagIsAfgesloten,
  aanvraagIsOpen,
  aanvraagMomentLabel,
  aanvraagWeekLabel,
  aanvraagZichtbaarVoorAanvrager,
  automatischeBlokkade,
  automatischeBlokkades,
  bronLabel,
  dagLabel,
  filterTakenOpZoekterm,
  fmt,
  fmtS,
  getMaandag,
  groepeerTakenPerMaand,
  heeftErrors,
  isOuderDanMaanden,
  isVerledenDatum,
  isoDag,
  jaarMaanden,
  kwartaalLabel,
  laadLokaleState,
  maakDashboardData,
  maakRapportData,
  maakWeken,
  maandDagen,
  maandLabel,
  routeLabel,
  sortAanvragen,
  sortTaken,
  standaardAanvraag,
  taakDatum,
  vandaag,
  vandaagDagIndex,
  vandaagWerkdagIndex,
  verschuifWeek,
  weekNr,
  weekDagen,
  weekOptieLabel,
  weekRange,
  weekWerkdagen,
} from './utils'

const BERT_SESSIE_MAX_MS = 8 * 60 * 60 * 1000

function bertSessieVerlopen(loginAt, nu = Date.now()) {
  const tijd = Number(loginAt)
  if (!tijd) return true
  if (nu - tijd > BERT_SESSIE_MAX_MS) return true
  return new Date(tijd).toDateString() !== new Date(nu).toDateString()
}

function laadSessie() {
  try {
    const rol = localStorage.getItem('bb_rol')
    const tab = localStorage.getItem('bb_tab')
    if (rol === ROLES.transporteur && bertSessieVerlopen(localStorage.getItem('bb_login_at'))) {
      localStorage.removeItem('bb_rol')
      localStorage.removeItem('bb_tab')
      localStorage.removeItem('bb_login_at')
      return { rol: null, tab: 'planning' }
    }
    const veiligeTab =
      rol === ROLES.aanvrager && !['aanvraag', 'aanvraagstatus'].includes(tab)
        ? 'aanvraag'
        : rol === ROLES.transporteur && !['planning', 'aanvragen', 'toevoegen', 'drukte', 'aanvraag', 'alletaken', 'rapportage'].includes(tab)
          ? 'planning'
          : rol === ROLES.educatie && !['educatie-import', 'educatie-projecten'].includes(tab)
            ? 'educatie-import'
          : tab || 'planning'
    return {
      rol: Object.values(ROLES).includes(rol) ? rol : null,
      tab: veiligeTab,
    }
  } catch {
    return { rol: null, tab: 'planning' }
  }
}

function maakStateSnapshot(state) {
  try {
    return JSON.stringify({
      taken: state?.taken || [],
      aanvragen: state?.aanvragen || [],
      geblokt: state?.geblokt || [],
      meld: state?.meld || [],
    })
  } catch {
    return ''
  }
}

function korteWeekLabel(wk) {
  return `${weekNr(wk)} ${getMaandag(wk).getFullYear()}`
}

const STANDAARD_TAAK_NAAM = 'Bert'
const SCHOOL7 = 'Bibliotheek School 7'
const TUITJENHORN = 'Bibliotheek Tuitjenhorn'
const TAKEN_MET_AANTAL = ['Plukker', 'Extra kratten', 'Extra sorteren']
const TAKEN_MET_TIJD = ['Extra sorteren']
const TAKEN_MET_SPECIFIEKE_VELDEN = ['Plukker', 'Eelan', 'Extra kratten', 'Extra sorteren', 'CoderDojo', 'Stort', 'Garage']
const CODERDOJO_VESTIGINGEN = [SCHOOL7, 'Bibliotheek Anna Paulowna', 'Bibliotheek Schagen']
const OVERIG_OPTIE = 'Overig'

export default function App() {
  const WEKEN = maakWeken('2026-W01', 520)
  const lokaal = laadLokaleState()
  const sessie = laadSessie()
  const lokaleStartState = useRef(lokaal)
  const huidigeStateSnapshot = useRef(maakStateSnapshot(lokaal))
  const laatsteLokaleWijzigingOp = useRef(0)
  const huidigeAanvragen = useRef(lokaal.aanvragen)
  const huidigeRol = useRef(sessie.rol)
  const centraleOpslagActief = useRef(supabaseConfigured)
  const centraleOpslagGeladen = useRef(!supabaseConfigured || localTestMode)
  const laatsteCentraleUpdate = useRef(null)
  const skipVolgendeCentraleOpslag = useRef(false)
  const startMobiel = window.innerWidth < 760
  const [isMobiel, setIsMobiel] = useState(startMobiel)

  const [rol, setRol] = useState(sessie.rol)
  const [pin, setPin] = useState('')
  const [pinErr, setPinErr] = useState('')
  const [toonBertPin, setToonBertPin] = useState(false)
  const [tab, setTab] = useState(
    startMobiel && sessie.rol === ROLES.transporteur
      ? 'planning'
      : sessie.rol === ROLES.aanvrager && sessie.tab === 'rapportage'
        ? 'aanvraag'
        : sessie.rol === ROLES.educatie
          ? 'educatie-import'
        : sessie.tab,
  )
  const [menuOpen, setMenuOpen] = useState(false)
  const [toevoegenTab, setToevoegenTab] = useState('taak')
  const [taken, setTaken] = useState(lokaal.taken)
  const [aanvragen, setAanvragen] = useState(lokaal.aanvragen)
  const [geblokt, setGeblokt] = useState(lokaal.geblokt)
  const [week, setWeek] = useState(vandaag())
  const [mobielePlanningDag, setMobielePlanningDag] = useState(vandaagWerkdagIndex())
  const [toonAfgerondMobiel, setToonAfgerondMobiel] = useState(false)
  const [planningWeergave, setPlanningWeergave] = useState(() => (sessie.rol === ROLES.transporteur ? 'week' : 'maand'))
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
  const [taakJaarFilter, setTaakJaarFilter] = useState('alle')
  const [taakMaandFilter, setTaakMaandFilter] = useState('alle')
  const [meld, setMeld] = useState(lokaal.meld)
  const [opslagStatus, setOpslagStatus] = useState(
    localTestMode ? 'Lokale testkopie' : supabaseConfigured ? 'Verbinden met centrale opslag...' : 'Lokale opslag',
  )

  useEffect(() => {
    const updateScherm = () => {
      const mobiel = window.innerWidth < 760
      setIsMobiel(mobiel)
      if (mobiel) setTab((huidigeTab) => (huidigeTab === 'rapportage' ? 'planning' : huidigeTab))
      if (!mobiel) setMenuOpen(false)
    }
    window.addEventListener('resize', updateScherm)
    return () => window.removeEventListener('resize', updateScherm)
  }, [])

  useEffect(() => {
    try {
      if (rol) localStorage.setItem('bb_rol', rol)
      else {
        localStorage.removeItem('bb_rol')
        localStorage.removeItem('bb_login_at')
      }
    } catch {
      // Sessie onthouden is gemak; als localStorage blokkeert blijft de app gewoon werken.
    }
    huidigeRol.current = rol
  }, [rol])

  useEffect(() => {
    huidigeAanvragen.current = aanvragen
  }, [aanvragen])

  useEffect(() => {
    try {
      localStorage.setItem('bb_tab', isMobiel && rol === ROLES.transporteur ? 'planning' : tab)
    } catch {
      // Zie opmerking bij rol-opslag.
    }
  }, [isMobiel, rol, tab])

  const [nieuw, setNieuw] = useState({
    naam: STANDAARD_TAAK_NAAM,
    titel: '',
    omschrijving: '',
    reden: '',
    aantal: '',
    tijd: '',
    van: '',
    naar: '',
    week: vandaag(),
    dag: vandaagDagIndex(),
    alleenWeek: false,
    prioriteit: 'normaal',
  })
  const [aanvraag, setAanvraag] = useState(() => standaardAanvraag())
  const [zsmBewustGekozen, setZsmBewustGekozen] = useState(false)
  const [aanvraagEditId, setAanvraagEditId] = useState(null)
  const [aanvraagBevestigd, setAanvraagBevestigd] = useState(false)
  const [aanvraagErrors, setAanvraagErrors] = useState({})
  const [aanvraagOverigVestiging, setAanvraagOverigVestiging] = useState({ van: false, naar: false })
  const [aanvraagEigenTitelActief, setAanvraagEigenTitelActief] = useState(false)
  const [aanvraagStatusTab, setAanvraagStatusTab] = useState('open')
  const [bertAanvragenTab, setBertAanvragenTab] = useState('nieuw')
  const [taakErrors, setTaakErrors] = useState({})
  const [taakEditId, setTaakEditId] = useState(null)
  const [eigenTitelActief, setEigenTitelActief] = useState(false)
  const [taakOverigVestiging, setTaakOverigVestiging] = useState({ van: false, naar: false })
  const [taakMelding, setTaakMelding] = useState('')
  const [aanvraagMelding, setAanvraagMelding] = useState('')
  const [nieuweAanvraagMelding, setNieuweAanvraagMelding] = useState(null)
  const [toonPriveUitleg, setToonPriveUitleg] = useState(false)
  const [hoverPriveUitleg, setHoverPriveUitleg] = useState(false)
  const [blokForm, setBlokForm] = useState({
    type: 'week',
    week: '',
    eindWeek: '',
    geselecteerdeWeken: [],
    dag: vandaagDagIndex(),
    reden: '',
  })
  const [modal, setModal] = useState(null)
  const [verlaatAanvraagTab, setVerlaatAanvraagTab] = useState(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [vandaagTaakVraag, setVandaagTaakVraag] = useState(false)
  const [bevestigVerwijderen, setBevestigVerwijderen] = useState(null)
  const [bevestigDefinitiefVerwijderen, setBevestigDefinitiefVerwijderen] = useState(null)
  const [weekendBevestiging, setWeekendBevestiging] = useState(null)
  const [verwijderNotitie, setVerwijderNotitie] = useState('')
  const [planAanvraag, setPlanAanvraag] = useState(null)
  const [infoAanvraag, setInfoAanvraag] = useState(null)
  const [infoNotitie, setInfoNotitie] = useState('')
  const [verplW, setVerplW] = useState('')
  const [verplD, setVerplD] = useState(0)
  const [planW, setPlanW] = useState('')
  const [planD, setPlanD] = useState(0)
  const [rapp, setRapp] = useState({
    type: 'week',
    week: vandaag(),
    maand: new Date().toISOString().slice(0, 7),
    kwartaal: `${new Date().getFullYear()}-Q${Math.floor(new Date().getMonth() / 3) + 1}`,
    jaar: String(new Date().getFullYear()),
  })
  const [rapportZichtbaar, setRapportZichtbaar] = useState(false)
  const [rapportWeergave, setRapportWeergave] = useState(null)
  const [educatieImport, setEducatieImport] = useState({
    schooljaar: '',
    periode: '',
    bestandNaam: '',
    rijen: [],
  })
  const [educatieMelding, setEducatieMelding] = useState('')

  useEffect(() => {
    if (!isMobiel || !rol) return undefined

    const resetBijTerugkomen = () => {
      if (document.visibilityState !== 'visible') return
      if (rol === ROLES.transporteur) {
        setTab('planning')
        setPlanningWeergave('week')
        setWeek(vandaag())
        setMobielePlanningDag(vandaagWerkdagIndex())
      } else if (rol === ROLES.aanvrager) {
        setTab('aanvraag')
      } else if (rol === ROLES.educatie) {
        setTab('educatie-import')
      }
      setMenuOpen(false)
      setHelpOpen(false)
    }

    document.addEventListener('visibilitychange', resetBijTerugkomen)
    window.addEventListener('pageshow', resetBijTerugkomen)
    return () => {
      document.removeEventListener('visibilitychange', resetBijTerugkomen)
      window.removeEventListener('pageshow', resetBijTerugkomen)
    }
  }, [isMobiel, rol])

  function uitloggen() {
    setRol(null)
    setTab('planning')
    setHelpOpen(false)
    setMenuOpen(false)
    try {
      localStorage.removeItem('bb_rol')
      localStorage.removeItem('bb_tab')
      localStorage.removeItem('bb_login_at')
    } catch {
      // Geen probleem als de browser dit blokkeert.
    }
  }

  function aanvraagHeeftInhoud() {
    const leeg = standaardAanvraag()
    return (
      aanvraag.aanvrager.trim() ||
      aanvraag.titel.trim() ||
      aanvraag.omschrijving.trim() ||
      String(aanvraag.reden || '').trim() ||
      String(aanvraag.aantal || '').trim() ||
      String(aanvraag.tijd || '').trim() ||
      aanvraag.van ||
      aanvraag.naar ||
      aanvraag.week !== leeg.week ||
      Number(aanvraag.dag) !== Number(leeg.dag) ||
      aanvraag.prioriteit !== leeg.prioriteit ||
      Boolean(aanvraag.prive) !== Boolean(leeg.prive)
    )
  }

  function resetTaakForm() {
    setNieuw({
      naam: STANDAARD_TAAK_NAAM,
      titel: '',
      omschrijving: '',
      reden: '',
      aantal: '',
      tijd: '',
      van: '',
      naar: '',
      week: vandaag(),
      dag: vandaagDagIndex(),
      alleenWeek: false,
      prioriteit: 'normaal',
    })
    setTaakEditId(null)
    setEigenTitelActief(false)
    setTaakOverigVestiging({ van: false, naar: false })
    setTaakErrors({})
  }

  function gaNaarTab(nieuweTab) {
    if (
      rol === ROLES.aanvrager &&
      tab === 'aanvraag' &&
      nieuweTab === 'aanvraagstatus' &&
      !aanvraagBevestigd &&
      aanvraagHeeftInhoud()
    ) {
      setVerlaatAanvraagTab(nieuweTab)
      setMenuOpen(false)
      return
    }
    if (tab === 'toevoegen' && nieuweTab !== 'toevoegen' && !taakEditId) {
      resetTaakForm()
    }
    setTab(nieuweTab)
    setMenuOpen(false)
  }

  function kiesDagMetWeekendCheck(weekKeuze, dagKeuze, actie) {
    const dagNummer = Number(dagKeuze)
    if (dagNummer >= 5) {
      setWeekendBevestiging({
        dag: dagNummer,
        week: weekKeuze,
        actie,
      })
      return
    }
    actie()
  }

  useEffect(() => {
    if (rol !== ROLES.transporteur) return undefined

    const controleerSessie = () => {
      try {
        if (bertSessieVerlopen(localStorage.getItem('bb_login_at'))) {
          uitloggen()
          setToonBertPin(true)
        }
      } catch {
        // Als opslag niet leesbaar is, laten we de app bruikbaar blijven.
      }
    }

    const timer = setInterval(controleerSessie, 60000)
    window.addEventListener('focus', controleerSessie)
    document.addEventListener('visibilitychange', controleerSessie)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', controleerSessie)
      document.removeEventListener('visibilitychange', controleerSessie)
    }
  }, [rol])

  function pasCentraleStateToe(data) {
    skipVolgendeCentraleOpslag.current = true
    huidigeStateSnapshot.current = maakStateSnapshot(data)
    huidigeAanvragen.current = data?.aanvragen || []
    setTaken(data?.taken || [])
    setAanvragen(data?.aanvragen || [])
    setGeblokt(data?.geblokt || [])
    setMeld(data?.meld || [])
  }

  useEffect(() => {
    if (!localTestMode) return undefined

    let actief = true

    async function laadTestkopie() {
      try {
        const response = await fetch('/local-test-state.json', { cache: 'no-store' })
        if (!response.ok) throw new Error('Geen lokale testkopie gevonden.')
        const data = await response.json()
        if (!actief) return
        centraleOpslagActief.current = false
        centraleOpslagGeladen.current = true
        pasCentraleStateToe(data)
        setOpslagStatus('Lokale testkopie')
      } catch (error) {
        console.error('Lokale testkopie kon niet worden geladen.', error)
        if (actief) setOpslagStatus('Lokale testkopie niet gevonden')
      }
    }

    laadTestkopie()

    return () => {
      actief = false
    }
  }, [])

  useEffect(() => {
    if (!supabaseConfigured) return undefined

    let actief = true

    async function laad() {
      const lokaalState = lokaleStartState.current
      const { data, updatedAt, error } = await laadCentraleState()
      if (!actief) return

      if (error) {
        console.error('Centrale opslag kon niet worden geladen.', error)
        centraleOpslagActief.current = false
        setOpslagStatus('Lokale opslag')
        return
      }

      if (data && !isLegeState(data)) {
        laatsteCentraleUpdate.current = updatedAt
        pasCentraleStateToe(data)
      } else if (!isLegeState(lokaalState)) {
        const resultaat = await bewaarCentraleState(lokaalState)
        if (resultaat.updatedAt) laatsteCentraleUpdate.current = resultaat.updatedAt
      }

      centraleOpslagGeladen.current = true
      setOpslagStatus('Centrale opslag actief')
    }

    laad()

    return () => {
      actief = false
    }
  }, [])

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
    if (!centraleOpslagActief.current || !centraleOpslagGeladen.current) return undefined
    const state = { taken, aanvragen, geblokt, meld }
    huidigeStateSnapshot.current = maakStateSnapshot(state)
    if (skipVolgendeCentraleOpslag.current) {
      skipVolgendeCentraleOpslag.current = false
      return undefined
    }

    laatsteLokaleWijzigingOp.current = Date.now()
    const timer = setTimeout(async () => {
      const { updatedAt, error } = await bewaarCentraleState(state)
      if (error) {
        console.error('Centrale opslag kon niet worden opgeslagen.', error)
        setOpslagStatus('Opslaan mislukt, lokaal bewaard')
      } else {
        if (updatedAt) laatsteCentraleUpdate.current = updatedAt
        setOpslagStatus('Centrale opslag actief')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [taken, aanvragen, geblokt, meld])

  useEffect(() => {
    if (!supabaseConfigured) return undefined

    let actief = true
    const timer = setInterval(async () => {
      if (!centraleOpslagActief.current || !centraleOpslagGeladen.current) return
      if (document.visibilityState === 'hidden') return

      const { data, updatedAt, error } = await laadCentraleState()
      if (!actief) return
      if (error) {
        console.error('Centrale opslag kon niet worden ververst.', error)
        return
      }
      if (!data || !updatedAt) return

      if (Date.now() - laatsteLokaleWijzigingOp.current < 2000) return

      const nieuweSnapshot = maakStateSnapshot(data)
      if (!nieuweSnapshot || nieuweSnapshot === huidigeStateSnapshot.current) {
        laatsteCentraleUpdate.current = updatedAt
        return
      }

      const huidigeNieuweAanvragen = new Set(
        huidigeAanvragen.current.filter((item) => item.status === 'nieuw').map((item) => item.id),
      )
      const binnengekomenAanvragen = (data.aanvragen || []).filter(
        (item) => item.status === 'nieuw' && !huidigeNieuweAanvragen.has(item.id),
      )
      laatsteCentraleUpdate.current = updatedAt
      pasCentraleStateToe(data)
      if (huidigeRol.current === ROLES.transporteur && binnengekomenAanvragen.length > 0) {
        setNieuweAanvraagMelding({
          aantal: binnengekomenAanvragen.length,
          titel: binnengekomenAanvragen[0].titel || 'Nieuwe aanvraag',
        })
      }
      setOpslagStatus('Centrale opslag bijgewerkt')
      setTimeout(() => {
        if (actief) setOpslagStatus('Centrale opslag actief')
      }, 1600)
    }, 10000)

    return () => {
      actief = false
      clearInterval(timer)
    }
  }, [])


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

  function login(code = pin) {
    if (code === PIN_BERT) {
      setRol(ROLES.transporteur)
      setTab('planning')
      setPlanningWeergave('week')
      setPinErr('')
      setToonBertPin(false)
      try {
        localStorage.setItem('bb_login_at', String(Date.now()))
      } catch {
        // Sessie onthouden is gemak; als localStorage blokkeert blijft de app gewoon werken.
      }
    } else {
      setPinErr('Onjuiste pincode.')
    }
    setPin('')
  }

  function startAanvraag() {
    setAanvraag(standaardAanvraag())
    setZsmBewustGekozen(false)
    setAanvraagMaand(new Date().toISOString().slice(0, 7))
    setAanvraagEditId(null)
    setAanvraagErrors({})
    setAanvraagOverigVestiging({ van: false, naar: false })
    setAanvraagEigenTitelActief(false)
    setAanvraagBevestigd(false)
    setRol(ROLES.aanvrager)
    setTab('aanvraag')
    setPin('')
    setPinErr('')
    setToonBertPin(false)
  }

  function startEducatie() {
    setRol(ROLES.educatie)
    setTab('educatie-import')
    setMenuOpen(false)
    setHelpOpen(false)
    setPin('')
    setPinErr('')
    setToonBertPin(false)
  }

  function vestigingSelectWaarde(value, overigActief = false) {
    if (overigActief) return OVERIG_OPTIE
    if (!value) return ''
    return VESTIGINGEN.includes(value) ? value : OVERIG_OPTIE
  }

  function taakSelectWaarde(value) {
    if (eigenTitelActief) return OVERIG_OPTIE
    if (!value) return ''
    return TAAK_SUGGESTIES.includes(value) && value !== OVERIG_OPTIE ? value : OVERIG_OPTIE
  }

  function aanvraagTaakSelectWaarde(value) {
    if (aanvraagEigenTitelActief) return OVERIG_OPTIE
    if (!value) return ''
    return TAAK_SUGGESTIES.includes(value) && value !== OVERIG_OPTIE ? value : OVERIG_OPTIE
  }

  function taakRouteVoorTitel(titel, vorigeTaak) {
    const basis = {
      van: vorigeTaak.van || '',
      naar: vorigeTaak.naar || '',
    }
    if (titel === 'Plukker' || titel === 'Eelan') return { van: '', naar: basis.naar || SCHOOL7 }
    if (titel === 'Extra kratten') return { van: '', naar: '' }
    if (titel === 'Extra sorteren') return { van: basis.van || TUITJENHORN, naar: '' }
    if (titel === 'Stort') return { van: basis.van, naar: '' }
    if (titel === 'Garage') return { van: '', naar: '' }
    if (titel === 'CoderDojo') {
      return {
        van: CODERDOJO_VESTIGINGEN.includes(basis.van) ? basis.van : '',
        naar: CODERDOJO_VESTIGINGEN.includes(basis.naar) ? basis.naar : '',
      }
    }
    return basis
  }

  function taakRouteVoorOpslag(titel, taak) {
    if (titel === 'Plukker' || titel === 'Eelan') return { van: '', naar: taak.naar || '' }
    if (titel === 'Extra sorteren' || titel === 'Stort') return { van: taak.van || '', naar: '' }
    if (titel === 'Garage') return { van: '', naar: '' }
    return { van: taak.van || '', naar: taak.naar || '' }
  }

  function taakHeeftAantalVeld(titel) {
    return TAKEN_MET_AANTAL.includes(titel) || Boolean(titel && !TAKEN_MET_SPECIFIEKE_VELDEN.includes(titel))
  }

  function taakHeeftTijdVeld(titel) {
    return TAKEN_MET_TIJD.includes(titel) || Boolean(titel && !TAKEN_MET_SPECIFIEKE_VELDEN.includes(titel))
  }

  function openVandaagTaakVraag() {
    kiesDagMetWeekendCheck(vandaag(), vandaagDagIndex(), () => {
      setNieuw((prev) => ({ ...prev, week: vandaag(), dag: vandaagDagIndex(), alleenWeek: false }))
      setTaakMaand(new Date().toISOString().slice(0, 7))
      setVandaagTaakVraag(true)
    })
  }

  function toonTaakInOverzicht(taakData) {
    const datum = taakDatum(taakData)
    setTaakZoekterm('')
    setTaakJaarFilter(String(datum.getFullYear()))
    setTaakMaandFilter('alle')
    setToonVerwijderdeTaken(false)
    setTab('alletaken')
  }

  function voegToe(status = 'gepland', bestemming = null) {
    const isBewerking = Boolean(taakEditId)
    const errors = {}
    if (!nieuw.titel.trim()) errors.titel = 'Kies een taak of typ zelf een titel.'
    setTaakErrors(errors)
    if (Object.keys(errors).length > 0) return false
    const taakData = {
      ...nieuw,
      naam: String(nieuw.naam || STANDAARD_TAAK_NAAM).trim() || STANDAARD_TAAK_NAAM,
      titel: nieuw.titel.trim(),
      ...taakRouteVoorOpslag(nieuw.titel.trim(), nieuw),
      aantal: taakHeeftAantalVeld(nieuw.titel.trim()) ? String(nieuw.aantal || '').trim() : '',
      tijd: taakHeeftTijdVeld(nieuw.titel.trim()) ? String(nieuw.tijd || '').trim() : '',
      dag: nieuw.alleenWeek ? null : nieuw.dag,
      omschrijving: nieuw.omschrijving,
      reden: nieuw.reden || '',
    }

    if (taakEditId) {
      setTaken((prev) =>
        prev.map((taak) =>
          taak.id === taakEditId
            ? {
                ...taak,
                ...taakData,
                log: [...(taak.log || []), { a: 'gewijzigd', d: rol, w: new Date().toISOString() }],
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
      naam: STANDAARD_TAAK_NAAM,
      titel: '',
      omschrijving: '',
      reden: '',
      aantal: '',
      tijd: '',
      van: '',
      naar: '',
      week: vandaag(),
      dag: vandaagDagIndex(),
      alleenWeek: false,
      prioriteit: 'normaal',
    })
    setTaakEditId(null)
    setEigenTitelActief(false)
    setTaakOverigVestiging({ van: false, naar: false })
    setTaakErrors({})
    if (isBewerking) {
      setTaakMelding('Taak gewijzigd.')
    } else {
      setTaakMelding(status === 'afgerond' ? 'Taak toegevoegd als afgerond.' : 'Taak toegevoegd.')
    }
    if (bestemming === 'alletaken') {
      toonTaakInOverzicht(taakData)
    }
    if (bestemming === 'planning') {
      setWeek(taakData.week)
      if (isMobiel) setMobielePlanningDag(Math.max(0, Math.min(6, Number(taakData.dag || 0))))
      setPlanningMaand(isoDag(taakDatum(taakData)).slice(0, 7))
      setPlanningWeergave('week')
      setTab('planning')
    }
    return true
  }

  function bewerkTaak(taak) {
    setNieuw({
      naam: taak.naam || STANDAARD_TAAK_NAAM,
      titel: taak.titel || '',
      omschrijving: taak.omschrijving || '',
      reden: taak.reden || '',
      aantal: taak.aantal || '',
      tijd: taak.tijd || '',
      van: taak.van || '',
      naar: taak.naar || '',
      week: taak.week || vandaag(),
      dag: taak.dag === null || taak.dag === undefined ? vandaagDagIndex() : Number(taak.dag),
      alleenWeek: taak.dag === null || taak.dag === undefined,
      prioriteit: taak.prioriteit || 'normaal',
    })
    setTaakMaand(isoDag(getMaandag(taak.week || vandaag())).slice(0, 7))
    setTaakEditId(taak.id)
    setEigenTitelActief(!TAAK_SUGGESTIES.includes(taak.titel || ''))
    setTaakOverigVestiging({
      van: Boolean(taak.van && !VESTIGINGEN.includes(taak.van)),
      naar: Boolean(taak.naar && !VESTIGINGEN.includes(taak.naar)),
    })
    setTaakErrors({})
    setToevoegenTab('taak')
    setTab('toevoegen')
  }

  function dienAanvraagIn() {
    const errors = {}
    if (!aanvraag.aanvrager.trim()) errors.aanvrager = 'Vul de naam van de aanvrager in.'
    if (!aanvraag.titel.trim()) errors.titel = 'Vul in wat er moet gebeuren.'
    if (aanvraag.titel !== 'Garage' && !aanvraag.van && !aanvraag.naar) errors.route = 'Kies minimaal een van de vestigingen bij van of naar.'
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
      const aanvraagData = {
        ...aanvraag,
        ...taakRouteVoorOpslag(aanvraag.titel.trim(), aanvraag),
        aantal: taakHeeftAantalVeld(aanvraag.titel.trim()) ? String(aanvraag.aantal || '').trim() : '',
        tijd: taakHeeftTijdVeld(aanvraag.titel.trim()) ? String(aanvraag.tijd || '').trim() : '',
        prive: rol === ROLES.transporteur ? false : Boolean(aanvraag.prive),
      }
      setAanvragen((prev) =>
        prev.map((item) =>
          item.id === aanvraagEditId
            ? {
                ...item,
                ...aanvraagData,
                status: 'nieuw',
                bijgewerkt: new Date().toISOString(),
                aangevuldOp: new Date().toISOString(),
                log: [...item.log, { a: 'aangevuld', d: aanvraag.aanvrager, w: new Date().toISOString() }],
              }
            : item,
        ),
      )
      setAanvraagEditId(null)
      setTab(rol === ROLES.transporteur ? 'aanvragen' : 'aanvraagstatus')
    } else {
      const id = Date.now().toString()
      const aanvraagData = {
        ...aanvraag,
        ...taakRouteVoorOpslag(aanvraag.titel.trim(), aanvraag),
        aantal: taakHeeftAantalVeld(aanvraag.titel.trim()) ? String(aanvraag.aantal || '').trim() : '',
        tijd: taakHeeftTijdVeld(aanvraag.titel.trim()) ? String(aanvraag.tijd || '').trim() : '',
        prive: rol === ROLES.transporteur ? false : Boolean(aanvraag.prive),
      }
      setAanvragen((prev) => [
        ...prev,
        {
        id,
        ...aanvraagData,
        status: 'nieuw',
        aangemaakt: new Date().toISOString(),
        log: [{ a: 'ingediend', d: aanvraag.aanvrager, w: new Date().toISOString() }],
        },
      ])
    }

    setAanvraag(standaardAanvraag())
    setAanvraagOverigVestiging({ van: false, naar: false })
    setAanvraagEigenTitelActief(false)
    setZsmBewustGekozen(false)
    setAanvraagMaand(new Date().toISOString().slice(0, 7))
    if (!aanvraagEditId && rol !== ROLES.transporteur) setAanvraagBevestigd(true)
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
      reden: item.reden || '',
      aantal: item.aantal || '',
      tijd: item.tijd || '',
      van: item.van || '',
      naar: item.naar || '',
      week: item.week || vandaag(),
      dag: Number(item.dag ?? vandaagWerkdagIndex()),
      prioriteit: item.prioriteit || 'normaal',
      prive: Boolean(item.prive),
    })
    setAanvraagOverigVestiging({
      van: Boolean(item.van && !VESTIGINGEN.includes(item.van)),
      naar: Boolean(item.naar && !VESTIGINGEN.includes(item.naar)),
    })
    setAanvraagEigenTitelActief(!TAAK_SUGGESTIES.includes(item.titel || ''))
    setZsmBewustGekozen(false)
    setAanvraagEditId(item.id)
    setAanvraagBevestigd(false)
    setTab('aanvraag')
  }

  function annuleerAanvraagEdit() {
    setAanvraagEditId(null)
    setAanvraagErrors({})
    setAanvraag(standaardAanvraag())
    setAanvraagOverigVestiging({ van: false, naar: false })
    setAanvraagEigenTitelActief(false)
    setZsmBewustGekozen(false)
    setAanvraagMaand(new Date().toISOString().slice(0, 7))
    setAanvraagBevestigd(false)
  }

  function importeerEducatieAanvragen() {
    const rijen = educatieImport.rijen || []
    if (!educatieImport.schooljaar.trim() || !educatieImport.periode.trim() || rijen.length === 0) return

    const nieuweAanvragen = maakEducatieAanvragen(rijen, {
      schooljaar: educatieImport.schooljaar.trim(),
      periode: educatieImport.periode.trim(),
      bestandNaam: educatieImport.bestandNaam,
    })

    setAanvragen((prev) => [...prev, ...nieuweAanvragen])
    setEducatieMelding(`${nieuweAanvragen.length} aanvragen toegevoegd. Ze staan nu klaar bij Aanvragen.`)
    setEducatieImport((prev) => ({ ...prev, bestandNaam: '', rijen: [] }))
  }

  function verwijderAanvraag(id, notitie = '') {
    setAanvragen((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'verwijderd',
              verwijderdOp: new Date().toISOString(),
              verwijderNotitie: notitie.trim(),
              log: [...item.log, { a: notitie.trim() ? `verwijderd: ${notitie.trim()}` : 'verwijderd', d: rol, w: new Date().toISOString() }],
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
              verwijderNotitie: '',
              log: [...item.log, { a: 'hersteld', d: rol, w: new Date().toISOString() }],
            }
          : item,
      ),
    )
  }

  function definitiefVerwijderAanvraag(id) {
    setAanvragen((prev) => prev.filter((item) => item.id !== id))
  }

  function vraagVerwijderAanvraag(item) {
    setBevestigVerwijderen({ type: 'aanvraag', item })
    setVerwijderNotitie(item.verwijderNotitie || '')
  }

  function vraagVerwijderTaak(item) {
    setBevestigVerwijderen({ type: 'taak', item })
    setVerwijderNotitie(item.verwijderNotitie || '')
  }

  function verwijderTaak(id, notitie = '') {
    setTaken((prev) =>
      prev.map((taak) =>
        taak.id === id
          ? {
              ...taak,
              vorigeStatus: taak.status === 'verwijderd' ? taak.vorigeStatus || 'gepland' : taak.status,
              status: 'verwijderd',
              verwijderdOp: new Date().toISOString(),
              verwijderNotitie: notitie.trim(),
              log: [...taak.log, { a: notitie.trim() ? `verwijderd: ${notitie.trim()}` : 'verwijderd', d: rol, w: new Date().toISOString() }],
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
              verwijderNotitie: '',
              log: [...taak.log, { a: 'hersteld', d: rol, w: new Date().toISOString() }],
            }
          : taak,
      ),
    )
  }

  function definitiefVerwijderTaak(id) {
    setTaken((prev) => prev.filter((taak) => taak.id !== id))
  }

  function voerVerwijderenUit() {
    if (!bevestigVerwijderen) return

    if (bevestigVerwijderen.type === 'aanvraag') {
      verwijderAanvraag(bevestigVerwijderen.item.id, verwijderNotitie)
    } else {
      verwijderTaak(bevestigVerwijderen.item.id, verwijderNotitie)
    }

    setBevestigVerwijderen(null)
    setVerwijderNotitie('')
  }

  function voerDefinitiefVerwijderenUit() {
    if (!bevestigDefinitiefVerwijderen) return

    if (bevestigDefinitiefVerwijderen.type === 'aanvraag') {
      definitiefVerwijderAanvraag(bevestigDefinitiefVerwijderen.item.id)
    } else {
      definitiefVerwijderTaak(bevestigDefinitiefVerwijderen.item.id)
    }

    setBevestigDefinitiefVerwijderen(null)
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
        reden: item.reden || '',
        aantal: item.aantal || '',
        tijd: item.tijd || '',
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
    if (isMobiel) setMobielePlanningDag(Math.max(0, Math.min(6, Number(planD || 0))))
    setPlanningWeergave('week')
    setPlanAanvraag(null)
    setAanvraagMelding('Aanvraag ingepland.')
  }

  function updStatus(id, status) {
    const taak = taken.find((item) => item.id === id)
    const vorigeStatus = taak?.status

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
    if (vorigeStatus === 'afgerond' && status !== 'afgerond' && taak?.aanvraagId) {
      setAanvragen((prev) =>
        prev.map((aanvraag) =>
          aanvraag.id === taak.aanvraagId
            ? {
                ...aanvraag,
                status: 'ingepland',
                voltooidOp: null,
                log: [...aanvraag.log, { a: 'teruggezet naar planning', d: rol, w: new Date().toISOString() }],
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
    if (isMobiel) setMobielePlanningDag(Math.max(0, Math.min(6, Number(verplD || 0))))
    setPlanningWeergave('week')
    setModal(null)
  }

  function blokkeer() {
    const geselecteerdeWeken = blokForm.geselecteerdeWeken || []
    if (blokForm.type === 'dag' && !blokForm.week) return
    if (blokForm.type === 'week' && geselecteerdeWeken.length === 0) return

    const weken = blokForm.type === 'dag' ? [blokForm.week] : geselecteerdeWeken
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
    setBlokForm({ type: 'week', week: '', eindWeek: '', geselecteerdeWeken: [], dag: vandaagDagIndex(), reden: '' })
  }

  function kiesDrukteWeek(wk) {
    setBlokForm((prev) => {
      const huidigeWeken = prev.geselecteerdeWeken || []
      const volgendeWeken = huidigeWeken.includes(wk)
        ? huidigeWeken.filter((item) => item !== wk)
        : [...huidigeWeken, wk].sort((a, b) => getMaandag(a) - getMaandag(b))
      return {
        ...prev,
        type: 'week',
        week: volgendeWeken[0] || '',
        eindWeek: '',
        geselecteerdeWeken: volgendeWeken,
        dag: vandaagDagIndex(),
      }
    })
  }

  function blokkadeVoorWeek(wk) {
    return geblokt.find((item) => item.week === wk && (item.dag === null || item.dag === undefined)) || automatischeBlokkade(wk)
  }

  function blokkadeVoorDag(wk, dag) {
    return geblokt.find((item) => item.week === wk && Number(item.dag) === Number(dag)) || blokkadeVoorWeek(wk)
  }

  function xmlWaarde(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;')
  }

  function excelWerkblad(naam, rows) {
    return `
      <Worksheet ss:Name="${xmlWaarde(naam)}">
        <Table>
          ${rows
            .map(
              (row) => `
                <Row>
                  ${row
                    .map(
                      (cell) => `
                        <Cell><Data ss:Type="String">${xmlWaarde(cell)}</Data></Cell>
                      `,
                    )
                    .join('')}
                </Row>
              `,
            )
            .join('')}
        </Table>
      </Worksheet>
    `
  }

  function rappPeriodeLabel() {
    if (rapp.type === 'week') return weekNr(rapp.week)
    if (rapp.type === 'maand') return maandLabel(rapp.maand)
    if (rapp.type === 'kwartaal') return kwartaalLabel(rapp.kwartaal)
    return rapp.jaar
  }

  function kwartaalJaar(value) {
    return value.split('-Q')[0]
  }

  function kwartaalNummer(value) {
    return value.split('-Q')[1]
  }

  function zetKwartaal(deel, waarde) {
    setRapp((prev) => {
      const jaar = deel === 'jaar' ? waarde : kwartaalJaar(prev.kwartaal)
      const kwartaal = deel === 'kwartaal' ? waarde : kwartaalNummer(prev.kwartaal)
      return { ...prev, kwartaal: `${jaar}-Q${kwartaal}` }
    })
    setRapportZichtbaar(false)
    setRapportWeergave(null)
  }

  function kiesRapportMaand(maand) {
    setRapp((prev) => ({ ...prev, maand }))
    setRapportZichtbaar(false)
    setRapportWeergave(null)
  }


  function exportRapportCsv() {
    if (!rappData) return

    const headers = [
      'Datum',
      'Week',
      'Dag',
      'Naam',
      'Taak',
      'Reden',
      'Aantal',
      'Tijd in minuten',
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
      dagLabel(taak.dag),
      taak.naam || taak.door || '',
      taak.titel,
      taak.reden || '',
      taak.aantal || '',
      taak.tijd || '',
      taak.van || '',
      taak.naar || '',
      STATUS[taak.status]?.label || taak.status,
      bronLabel(taak.bron),
      taak.prioriteit || 'normaal',
      taak.omschrijving || '',
      taak.aangemaakt ? fmt(new Date(taak.aangemaakt)) : '',
    ])

    const exportDashboard = maakDashboardData(taken, aanvragen, rapp, geblokt)
    const dashboardRows = [
      ['Periode', exportDashboard.periodeLabel],
      [],
      ['Thema', 'Indicator', 'Waarde'],
      ['Capaciteit', 'Signaal', exportDashboard.capaciteitSignaal],
      ['Capaciteit', 'Norm', exportDashboard.capaciteitNorm],
      ['Capaciteit', 'Geregistreerde tijd', `${exportDashboard.geregistreerdeTijdMin} min`],
      ['Werkdruk', 'Openstaand', exportDashboard.open],
      ['Werkdruk', 'Afgerond', exportDashboard.afgerond],
      ['Werkdruk', 'Vertraagd', exportDashboard.vertraagd],
      ['Piekindicator', 'Status', exportDashboard.piekSignaal],
      ['Piekindicator', 'Grens', exportDashboard.piekNorm],
      ['Piekindicator', 'Reden', exportDashboard.piekRedenen.join(', ') || 'geen'],
      ['Piekindicator', 'Uitzonderingsritten', exportDashboard.uitzonderingsritten],
      ['Piekindicator', 'Sorteertijd', `${exportDashboard.sorteerTijdMin} min`],
      ['Service', 'Afrondingsgraad', `${exportDashboard.afrondingsgraad}%`],
      ['Service', 'Open aanvragen', exportDashboard.openAanvragen],
      ['Beheersbaarheid', 'Registratiegraad', `${exportDashboard.registratiegraad}%`],
      ['Beheersbaarheid', 'Handmatig toegevoegd', exportDashboard.handmatig],
      ['Piekindicator', 'Handmatige druktemeldingen', exportDashboard.druktemeldingen.length],
      ['Piekindicator', 'Automatische waarschuwingen', exportDashboard.automatischeWaarschuwingen.length],
      [],
      [exportDashboard.periodeGrafiekTitel, 'Aantal'],
      ...exportDashboard.periodeDrukte.map((item) => [item.label, item.aantal]),
      [],
      ['Drukte per weekdag', 'Aantal'],
      ...exportDashboard.dagVerdeling.map((item) => [item.label, item.aantal]),
      [],
      ['Uitzonderingsritten', 'Aantal'],
      ...exportDashboard.uitzonderingTypen.map((item) => [item.label, item.aantal]),
      [],
      ['Piekwaarschuwingen', 'Type', 'Dag', 'Reden'],
      ...exportDashboard.piekWaarschuwingen.map((item) => [
        weekNr(item.week),
        item.automatisch ? 'Automatisch' : 'Handmatig',
        item.dag === null || item.dag === undefined ? 'Hele week' : dagLabel(item.dag),
        item.reden || '',
      ]),
    ]

    const workbook = `<?xml version="1.0"?>
      <?mso-application progid="Excel.Sheet"?>
      <Workbook
        xmlns="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
        ${excelWerkblad('Taken', [headers, ...rows])}
        ${excelWerkblad('Dashboard', dashboardRows)}
      </Workbook>`

    const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rapportage-${rapp.type}-${rappPeriodeLabel().replaceAll(' ', '-').toLowerCase()}.xls`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const nieuweAanvragenAantal = aanvragen.filter((item) => item.status === 'nieuw').length
  const infoNodigAantal = aanvragen.filter(
    (item) => aanvraagZichtbaarVoorAanvrager(item) && item.status === 'info',
  ).length

  const navTabs =
    rol === ROLES.aanvrager
        ? [
            { k: 'aanvraag', l: 'Aanvraag indienen' },
            { k: 'aanvraagstatus', l: `Alle aanvragen${infoNodigAantal ? ` (!)` : ''}` },
          ]
        : rol === ROLES.educatie
          ? [
              { k: 'educatie-import', l: 'Import schoollijsten' },
              { k: 'educatie-projecten', l: 'Projecten' },
            ]
        : [
            { k: 'planning', l: 'Planning' },
            { k: 'aanvragen', l: `Aanvragen${nieuweAanvragenAantal ? ` (${nieuweAanvragenAantal})` : ''}` },
            { k: 'toevoegen', l: 'Taak toevoegen' },
            { k: 'drukte', l: 'Druktemelding' },
            { k: 'alletaken', l: 'Overzicht' },
            { k: 'rapportage', l: 'Rapportage' },
          ]
  const zichtbareNavTabs = isMobiel ? navTabs.filter((item) => item.k !== 'rapportage') : navTabs
  const zichtbareNavGroepen =
    rol === ROLES.transporteur
      ? [
          {
            titel: 'Bert',
            tint: '#FFF7ED',
            border: '#FED7AA',
            active: '#EA6A1F',
            color: '#9A3412',
            tabs: zichtbareNavTabs.filter((item) => ['planning', 'aanvragen', 'toevoegen', 'drukte'].includes(item.k)),
          },
          {
            titel: 'Registratie en beheer',
            tint: '#ECFDF5',
            border: '#BBF7D0',
            active: '#1F7A4D',
            color: '#166534',
            tabs: [
              { k: 'aanvraag', l: 'Aanvraag invoeren' },
              ...zichtbareNavTabs.filter((item) => ['alletaken', 'rapportage'].includes(item.k)),
            ],
          },
        ].filter((groep) => groep.tabs.length > 0)
      : rol === ROLES.educatie
        ? [{ titel: '', tabs: zichtbareNavTabs }]
      : [{ titel: '', tabs: zichtbareNavTabs }]

  const pagina = {
    planning: 'Weekplanning',
    aanvragen: 'Aanvragen',
    aanvraag: 'Transport aanvragen',
    drukte: 'Druktemelding',
    aanvraagstatus: 'Aanvragen volgen',
    toevoegen: 'Taak toevoegen',
    alletaken: 'Overzicht',
    rapportage: 'Rapportage',
    'educatie-import': 'Import schoollijsten',
    'educatie-projecten': 'Projecten',
  }

  const educatieImportKlaar =
    educatieImport.schooljaar.trim() && educatieImport.periode.trim() && (educatieImport.rijen || []).length > 0

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
            maxWidth: 460,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div
              aria-label="de Bibliotheek KopGroep Bibliotheken"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div style={{ textAlign: 'left', lineHeight: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#5B5B5B', letterSpacing: 0 }}>de Bibliotheek</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#F26A21', marginTop: 4, letterSpacing: 0 }}>
                  KopGroep Bibliotheken
                </div>
              </div>
              <img
                src={logoIcon}
                alt=""
                aria-hidden="true"
                style={{ width: 50, height: 50, objectFit: 'contain' }}
              />
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#3A2A22' }}>Transportplanning</div>
          </div>
          <div style={{ display: 'grid', gap: 24 }}>
            <button
              onClick={startAanvraag}
              style={{
                width: '100%',
                background: '#EA6A1F',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '16px 18px',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 8px 18px rgba(234, 106, 31, .18)',
              }}
            >
              Transportaanvraag
            </button>
            <button
              onClick={startEducatie}
              style={{
                width: '100%',
                background: '#F3F4F6',
                color: '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: 10,
                padding: '14px 18px',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Educatie
            </button>
            <button
              onClick={() => {
                setToonBertPin(true)
                setPin('')
                setPinErr('')
              }}
              style={{
                width: '100%',
                background: '#1F7A4D',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '14px 18px',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 7px 16px rgba(31, 122, 77, .14)',
              }}
            >
              Registratie en beheer
            </button>
          </div>
        </div>
        {toonBertPin && (
          <div
            onClick={() => setToonBertPin(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15,23,42,.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
                maxWidth: 320,
                boxShadow: '0 20px 60px rgba(0,0,0,.15)',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Registratie en beheer</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>
                Voor Boekenbode, leidinggevende en administratie.
              </div>
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  const next = e.target.value.replace(/\D/g, '').slice(0, 4)
                  setPin(next)
                  setPinErr('')
                  if (next.length === 4) login(next)
                }}
                placeholder="Pincode"
                style={{ ...inp, textAlign: 'center', letterSpacing: 4, fontSize: 18, marginBottom: 10 }}
              />
              {pinErr && <div style={{ fontSize: 12, color: '#DC2626', marginBottom: 10 }}>{pinErr}</div>}
              <button
                type="button"
                onClick={() => {
                  setToonBertPin(false)
                  setPin('')
                  setPinErr('')
                }}
                style={{
                  width: '100%',
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
        )}
      </div>
    )
  }

  const actieveTaken = taken.filter((taak) => taak.status !== 'verwijderd')
  const verwijderdeTaken = taken.filter((taak) => taak.status === 'verwijderd')
  const openTakenInVerleden = actieveTaken
    .filter((taak) => taak.status !== 'afgerond' && isVerledenDatum(taakDatum(taak)))
    .sort((a, b) => taakDatum(a) - taakDatum(b))
  const weekHeeftWeekendTaken = actieveTaken.some(
    (taak) => taak.week === week && taak.dag !== null && taak.dag !== undefined && Number(taak.dag) >= 5,
  )
  const dagData = weekHeeftWeekendTaken ? weekDagen(week) : weekWerkdagen(week)
  const weekTaken = actieveTaken.filter((taak) => taak.week === week)
  const weekTakenAlleenWeek = weekTaken.filter((taak) => taak.dag === null || taak.dag === undefined)
  const weekTakenMetDag = weekTaken.filter((taak) => taak.dag !== null && taak.dag !== undefined)
  const effectieveMobielePlanningDag = Math.min(mobielePlanningDag, dagData.length - 1)
  const zichtbareWeekDagen = isMobiel ? dagData.filter((_, di) => di === effectieveMobielePlanningDag) : dagData
  const weekBlokkade = blokkadeVoorWeek(week)
  const gebloktNu = Boolean(weekBlokkade)
  const maandData = maandDagen(planningMaand)
  const maandTaken = actieveTaken.filter((taak) => {
    const d = taakDatum(taak)
    return isoDag(d).slice(0, 7) === planningMaand
  })
  const jaarTaken = actieveTaken.filter((taak) => taakDatum(taak).getFullYear() === Number(planningJaar))
  const taakJaren = Array.from(new Set(taken.map((taak) => String(taakDatum(taak).getFullYear())))).sort((a, b) => Number(b) - Number(a))
  const taakMaanden = Array.from(
    new Set(
      taken
        .filter((taak) => taakJaarFilter === 'alle' || String(taakDatum(taak).getFullYear()) === taakJaarFilter)
        .map((taak) => isoDag(taakDatum(taak)).slice(0, 7)),
    ),
  ).sort((a, b) => b.localeCompare(a))
  const filterTakenOpPeriode = (items) =>
    items.filter((taak) => {
      const datum = taakDatum(taak)
      const jaar = String(datum.getFullYear())
      const maand = isoDag(datum).slice(0, 7)
      if (taakJaarFilter !== 'alle' && jaar !== taakJaarFilter) return false
      if (taakMaandFilter !== 'alle' && maand !== taakMaandFilter) return false
      return true
    })
  const gezochteActieveTaken = filterTakenOpPeriode(filterTakenOpZoekterm(actieveTaken.slice().sort(sortTaken), taakZoekterm))
  const gezochteVerwijderdeTaken = filterTakenOpPeriode(filterTakenOpZoekterm(verwijderdeTaken.slice().sort(sortTaken), taakZoekterm))
  const takenPerMaand = groepeerTakenPerMaand(gezochteActieveTaken)
  const verwijderdeTakenPerMaand = groepeerTakenPerMaand(gezochteVerwijderdeTaken)
  const dashboardData = tab === 'rapportage' && rapportWeergave === 'dashboard' ? maakDashboardData(taken, aanvragen, rapp, geblokt) : null
  const rappData = tab === 'rapportage' && rapportWeergave === 'rapportage' && rapportZichtbaar ? maakRapportData(taken, rapp) : null
  const breedFormGrid = isMobiel ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))'
  const paginaPadding = isMobiel ? 10 : 20
  const planningNietVandaag =
    planningWeergave !== 'week' ||
    week !== vandaag() ||
    (isMobiel && effectieveMobielePlanningDag !== vandaagWerkdagIndex())
  const helpSubtitel = isMobiel
    ? `Hulp bij ${pagina[tab] || 'dit scherm'}.`
    : rol === ROLES.aanvrager
      ? 'Voor aanvragen en status bekijken.'
      : 'Voor planning en aanvragen beheren.'
  const helpItems = (() => {
    if (isMobiel) {
      const mobieleHelp = {
        aanvraag: [
          rol === ROLES.transporteur
            ? ['Aanvraag invoeren', 'Voer een aanvraag in namens iemand.']
            : ['Transportaanvraag', 'Geef door wat vervoerd moet worden.'],
          rol === ROLES.transporteur
            ? ['Druktemelding', 'Geef drukte of afwezigheid door.']
            : ['Prive', 'Alleen zichtbaar voor Registratie en beheer.'],
        ],
        aanvraagstatus: [
          ['Alle aanvragen', 'Volg recente aanvragen en open acties.'],
          ['Meer info nodig', 'Vul de aanvraag aan als dit gevraagd wordt.'],
        ],
        planning: [
          ['Planning', 'Bekijk wat per dag of week gepland staat.'],
          ['Vandaag', 'Ga snel terug naar de planning van vandaag.'],
        ],
        aanvragen: [
          ['Aanvragen', 'Plan aanvragen in of vraag meer info.'],
          ['Nieuw', 'Het cijfer blijft staan tot de aanvraag is behandeld.'],
        ],
        toevoegen: [
          ['Taak toevoegen', 'Zet een taak direct in de planning.'],
          ['Meteen uitvoeren', 'Gebruik dit als de taak al gedaan is.'],
        ],
        drukte: [
          ['Druktemelding', 'Geef drukte of afwezigheid door.'],
          ['Week of dag', 'Kies een hele week of een losse dag.'],
        ],
        alletaken: [
          ['Overzicht', 'Zoek, wijzig of herstel taken.'],
          ['Verwijderd', 'Herstel of verwijder taken definitief.'],
        ],
      }
      return mobieleHelp[tab] || [['Hulp', 'Gebruik Menu om naar de verschillende onderdelen te gaan.']]
    }

    if (rol === ROLES.aanvrager) {
      return [
        ['Transportaanvraag', 'Geef door wat vervoerd moet worden.'],
        ['Alle aanvragen', 'Volg recente aanvragen en open acties.'],
      ]
    }

    if (rol === ROLES.educatie) {
      return [
        ['Schooljaar', 'Vul het schooljaar van de lijst in.'],
        ['Periode', 'Vul de periode in die op de lijst staat.'],
        ['Excel import', 'Kies straks het bestand dat verwerkt moet worden.'],
        ['Projecten', 'Hier komt later ruimte voor losse educatieprojecten.'],
      ]
    }

    return [
      ['Planning', 'Bekijk de geplande taken.'],
      ['Aanvragen', 'Plan aanvragen in of vraag meer info.'],
      ['Taak toevoegen', 'Zet een taak direct in de planning.'],
      ['Druktemelding', 'Geef drukte of afwezigheid door.'],
      ['Aanvraag invoeren', 'Voer een aanvraag in namens iemand.'],
      ['Overzicht', 'Zoek, wijzig of herstel taken.'],
      ['Rapportage', 'Maak een overzicht voor administratie.'],
    ]
  })()

  const taakVestigingOpties = nieuw.titel === 'CoderDojo' ? CODERDOJO_VESTIGINGEN : VESTIGINGEN
  const taakToelichtingPlaceholder =
    nieuw.titel === 'Extra sorteren'
      ? 'Eventuele opmerkingen'
      : nieuw.titel === 'Plukker'
        ? 'Eventuele opmerkingen'
        : 'Bijzonderheden, gewenste tijd...'

  function renderTaakVestigingVeld(veld, label, opties = taakVestigingOpties) {
    return (
      <div>
        <Label>{label}</Label>
        <select
          value={vestigingSelectWaarde(nieuw[veld], taakOverigVestiging[veld])}
          onChange={(e) => {
            const waarde = e.target.value
            setTaakOverigVestiging((prev) => ({ ...prev, [veld]: waarde === OVERIG_OPTIE }))
            setNieuw((prev) => ({
              ...prev,
              [veld]: waarde === OVERIG_OPTIE ? (opties.includes(prev[veld]) ? '' : prev[veld]) : waarde,
            }))
          }}
          style={inp}
        >
          <option value="">Kies...</option>
          {opties.map((vestiging) => (
            <option key={vestiging} value={vestiging}>
              {vestiging}
            </option>
          ))}
          <option value={OVERIG_OPTIE}>Overig</option>
        </select>
        {vestigingSelectWaarde(nieuw[veld], taakOverigVestiging[veld]) === OVERIG_OPTIE && (
          <input
            value={nieuw[veld]}
            onChange={(e) => setNieuw((prev) => ({ ...prev, [veld]: e.target.value }))}
            placeholder="Vul zelf in"
            style={{ ...inp, marginTop: 7 }}
          />
        )}
      </div>
    )
  }

  function renderTaakAantalVeld() {
    return (
      <div>
        <Label>Aantal</Label>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          value={nieuw.aantal}
          onChange={(e) => setNieuw((prev) => ({ ...prev, aantal: e.target.value }))}
          placeholder="Bijv. 6"
          style={inp}
        />
      </div>
    )
  }

  function renderTaakTijdVeld() {
    return (
      <div>
        <Label>Tijd in minuten</Label>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          value={nieuw.tijd}
          onChange={(e) => setNieuw((prev) => ({ ...prev, tijd: e.target.value }))}
          placeholder="Bijv. 30"
          style={inp}
        />
      </div>
    )
  }

  function renderTaakToelichtingVeld(label = 'Toelichting') {
    return (
      <div>
        <Label>{label}</Label>
        <textarea
          value={nieuw.omschrijving}
          onChange={(e) => setNieuw((prev) => ({ ...prev, omschrijving: e.target.value }))}
          placeholder={taakToelichtingPlaceholder}
          rows={2}
          style={{ ...inp, resize: 'vertical' }}
        />
      </div>
    )
  }

  function renderAanvraagVestigingVeld(veld, label, opties = aanvraag.titel === 'CoderDojo' ? CODERDOJO_VESTIGINGEN : VESTIGINGEN) {
    return (
      <div>
        <Label>{label}</Label>
        <select
          value={vestigingSelectWaarde(aanvraag[veld], aanvraagOverigVestiging[veld])}
          onChange={(e) => {
            const waarde = e.target.value
            setAanvraagOverigVestiging((prev) => ({ ...prev, [veld]: waarde === OVERIG_OPTIE }))
            setAanvraag((prev) => ({
              ...prev,
              [veld]: waarde === OVERIG_OPTIE ? (opties.includes(prev[veld]) ? '' : prev[veld]) : waarde,
            }))
            setAanvraagErrors((prev) => {
              const next = { ...prev }
              delete next.route
              return next
            })
          }}
          style={{ ...inp, borderColor: aanvraagErrors.route ? '#F87171' : '#E5E9F0' }}
        >
          <option value="">Kies...</option>
          {opties.map((vestiging) => (
            <option key={vestiging} value={vestiging}>
              {vestiging}
            </option>
          ))}
          <option value={OVERIG_OPTIE}>Overig</option>
        </select>
        {vestigingSelectWaarde(aanvraag[veld], aanvraagOverigVestiging[veld]) === OVERIG_OPTIE && (
          <input
            value={aanvraag[veld]}
            onChange={(e) => {
              setAanvraag((prev) => ({ ...prev, [veld]: e.target.value }))
              setAanvraagErrors((prev) => {
                const next = { ...prev }
                delete next.route
                return next
              })
            }}
            placeholder="Vul zelf in"
            style={{ ...inp, marginTop: 7, borderColor: aanvraagErrors.route ? '#F87171' : '#E5E9F0' }}
          />
        )}
      </div>
    )
  }

  function renderAanvraagAantalVeld() {
    return (
      <div>
        <Label>Aantal</Label>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          value={aanvraag.aantal || ''}
          onChange={(e) => setAanvraag((prev) => ({ ...prev, aantal: e.target.value }))}
          placeholder="Bijv. 6"
          style={inp}
        />
      </div>
    )
  }

  function renderAanvraagTijdVeld() {
    return (
      <div>
        <Label>Tijd in minuten</Label>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          value={aanvraag.tijd || ''}
          onChange={(e) => setAanvraag((prev) => ({ ...prev, tijd: e.target.value }))}
          placeholder="Bijv. 30"
          style={inp}
        />
      </div>
    )
  }

  function renderAanvraagToelichtingVeld() {
    return (
      <div>
        <Label optional>Toelichting</Label>
        <textarea
          value={aanvraag.omschrijving}
          onChange={(e) => setAanvraag((prev) => ({ ...prev, omschrijving: e.target.value }))}
          placeholder={aanvraag.titel === 'Extra sorteren' || aanvraag.titel === 'Plukker' ? 'Eventuele opmerkingen' : 'Bijzonderheden, gewenste tijd...'}
          rows={2}
          style={{ ...inp, resize: 'vertical' }}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobiel ? 'column' : 'row',
        height: '100dvh',
        width: '100%',
        maxWidth: '100vw',
        background: '#F8F9FC',
        fontFamily: "Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: isMobiel ? '100%' : 210,
          background: '#FFF7ED',
          borderRight: isMobiel ? 'none' : '1px solid #FED7AA',
          borderTop: 'none',
          borderBottom: isMobiel ? '1px solid #FED7AA' : 'none',
          display: 'flex',
          flexDirection: isMobiel ? 'row' : 'column',
          flexShrink: 0,
          height: isMobiel ? 'auto' : '100vh',
          maxHeight: isMobiel ? 'none' : 'none',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            padding: isMobiel ? '10px 10px 8px' : '18px 14px 14px',
            borderBottom: isMobiel ? 'none' : '1px solid #FED7AA',
            width: isMobiel ? 64 : 'auto',
            flexShrink: 0,
            display: isMobiel ? 'flex' : 'block',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isMobiel ? (
            <img
              src={logoIcon}
              alt="KopGroep Bibliotheken"
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                objectFit: 'contain',
                background: '#fff',
              }}
            />
          ) : (
            <>
              <img src={logo} alt="KopGroep Bibliotheken" style={{ width: '100%', height: 'auto', marginBottom: 10 }} />
              <div style={{ color: '#3A2A22', fontSize: 13, fontWeight: 700 }}>Transportplanning</div>
              <div style={{ color: '#9A5A2E', fontSize: 11, marginTop: 3 }}>KopGroep Bibliotheken</div>
            </>
          )}
        </div>
        {isMobiel ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '8px 12px 8px 4px' }}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              style={{
                position: 'relative',
                minWidth: 136,
                background: '#FFF7ED',
                border: '1px solid #EA6A1F',
                color: '#9A3412',
                borderRadius: 8,
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Menu
              {rol === ROLES.transporteur && nieuweAanvragenAantal > 0 && (
                <span
                  aria-label={`${nieuweAanvragenAantal} nieuwe aanvragen`}
                  style={{
                    position: 'absolute',
                    top: -7,
                    right: -7,
                    minWidth: 20,
                    height: 20,
                    padding: '0 5px',
                    borderRadius: 999,
                    background: '#EA6A1F',
                    color: '#fff',
                    border: '2px solid #FFF7ED',
                    fontSize: 11,
                    fontWeight: 900,
                    lineHeight: '16px',
                    boxSizing: 'border-box',
                    textAlign: 'center',
                  }}
                >
                  {nieuweAanvragenAantal}
                </span>
              )}
            </button>
            {menuOpen && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 50,
                  background: '#FFF7ED',
                  padding: 18,
                  display: 'grid',
                  gridTemplateRows: 'auto 1fr auto',
                  gap: 18,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#3A2A22' }}>Menu</div>
                    <div style={{ fontSize: 12, color: '#9A5A2E', marginTop: 2 }}>
                      {rol === ROLES.aanvrager ? 'Aanvrager' : rol === ROLES.educatie ? 'Educatie' : 'Beheer'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      border: '1px solid #FED7AA',
                      background: '#fff',
                      color: '#7C4A2A',
                      borderRadius: 8,
                      padding: '9px 12px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Sluiten
                  </button>
                </div>
                <div style={{ display: 'grid', alignContent: 'start', gap: 10 }}>
                {zichtbareNavGroepen.map((groep) => (
                  <div
                    key={groep.titel || 'aanvrager'}
                    style={{
                      display: 'grid',
                      gap: 6,
                      border: groep.titel ? `1px solid ${groep.border || '#FED7AA'}` : 'none',
                      background: groep.titel ? groep.tint || '#FFF7ED' : 'transparent',
                      borderRadius: 10,
                      padding: groep.titel ? 8 : 0,
                    }}
                  >
                    {groep.titel && (
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 650,
                          color: groep.color || '#7C4A2A',
                          padding: '2px 2px 4px',
                        }}
                      >
                        {groep.titel}
                      </div>
                    )}
                    {groep.tabs.map((item) => (
                      <button
                        key={item.k}
                        type="button"
                        onClick={() => {
                          gaNaarTab(item.k)
                        }}
                        style={{
                          textAlign: 'left',
                          padding: '11px 12px',
                          borderRadius: 8,
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 600,
                          color: tab === item.k ? '#fff' : groep.color || '#7C4A2A',
                          background: tab === item.k ? groep.active || '#EA6A1F' : '#fff',
                          boxShadow: tab === item.k ? '0 6px 14px rgba(0,0,0,.08)' : `inset 0 0 0 1px ${groep.border || '#FED7AA'}`,
                        }}
                      >
                        {item.l}
                      </button>
                    ))}
                  </div>
                ))}
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  <button
                    type="button"
                    onClick={uitloggen}
                    style={{
                      border: '1px solid #F5C99D',
                      background: '#fff',
                      color: '#7C4A2A',
                      borderRadius: 8,
                      padding: '11px 12px',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Uitloggen
                  </button>
                  <div style={{ fontSize: 11, color: '#9A5A2E' }}>{opslagStatus}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <nav style={{ padding: '10px 8px', flex: 1, overflowY: 'auto' }}>
            {zichtbareNavGroepen.map((groep) => (
              <div
                key={groep.titel || 'aanvrager'}
                style={{
                  marginBottom: groep.titel ? 12 : 0,
                  border: groep.titel ? `1px solid ${groep.border || '#FED7AA'}` : 'none',
                  background: groep.titel ? groep.tint || '#FFF7ED' : 'transparent',
                  borderRadius: 10,
                  padding: groep.titel ? 7 : 0,
                }}
              >
                {groep.titel && (
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 400,
                      color: groep.color || '#7C4A2A',
                      padding: '2px 3px 5px',
                    }}
                  >
                    {groep.titel}
                  </div>
                )}
                {groep.tabs.map((item) => (
                  <div
                    key={item.k}
                    onClick={() => gaNaarTab(item.k)}
                    style={{
                      padding: '9px 12px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      marginBottom: 2,
                      fontSize: 13,
                      fontWeight: 500,
                      color: tab === item.k ? '#fff' : groep.color || '#7C4A2A',
                      background: tab === item.k ? groep.active || '#EA6A1F' : '#fff',
                    }}
                  >
                    {item.l}
                  </div>
                ))}
              </div>
            ))}
          </nav>
        )}
        {!isMobiel && <div
          style={{
            padding: '12px 10px',
            borderTop: '1px solid #FED7AA',
            width: 'auto',
            flexShrink: 0,
          }}
        >
          <div style={{ background: '#FFE8D1', borderRadius: 8, padding: isMobiel ? '7px 8px' : '10px 12px', marginBottom: 8 }}>
            <div style={{ color: '#3A2A22', fontSize: 12, fontWeight: 600 }}>
              {rol === ROLES.aanvrager ? 'Aanvrager' : rol === ROLES.educatie ? 'Educatie' : 'Beheer'}
            </div>
            <div style={{ color: '#9A5A2E', fontSize: 11, marginTop: 2 }}>Ingelogd</div>
            <div style={{ color: '#9A5A2E', fontSize: 10, marginTop: 5 }}>{opslagStatus}</div>
          </div>
          <button
            onClick={uitloggen}
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
        </div>}
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div
          style={{
            background: '#fff',
            borderBottom: '1px solid #E5E9F0',
            padding: isMobiel ? '10px 12px' : '0 22px',
            minHeight: isMobiel ? 58 : 54,
            height: isMobiel ? 'auto' : 54,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: isMobiel ? 14 : 15, fontWeight: 600, color: '#111827' }}>{pagina[tab] || ''}</div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
              {tab === 'planning' ? weekRange(week) : 'KopGroep Bibliotheken'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
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

        <div style={{ padding: paginaPadding, flex: 1, minWidth: 0, overflowY: 'auto', overflowX: 'hidden' }}>
          {rol === ROLES.transporteur && nieuweAanvraagMelding && (
            <button
              type="button"
              onClick={() => {
                setTab('aanvragen')
                setBertAanvragenTab('nieuw')
                setNieuweAanvraagMelding(null)
              }}
              style={{
                width: '100%',
                border: '1px solid #FED7AA',
                background: '#FFF7ED',
                color: '#92400E',
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 14,
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: '0 8px 18px rgba(146, 64, 14, .08)',
              }}
            >
              Nieuwe aanvraag ontvangen
              <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#B45309', marginTop: 3 }}>
                {nieuweAanvraagMelding.aantal > 1
                  ? `${nieuweAanvraagMelding.aantal} nieuwe aanvragen. Klik om te bekijken.`
                  : `${nieuweAanvraagMelding.titel}. Klik om te bekijken.`}
              </span>
            </button>
          )}
          {tab === 'aanvraag' && (rol === ROLES.aanvrager || rol === ROLES.transporteur) && (
            <div>
              {aanvraagBevestigd && rol === ROLES.aanvrager ? (
                <Card>
                  <div style={{ padding: 24, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#065F46', marginBottom: 6 }}>
                      Aanvraag ingediend
                    </div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 18 }}>
                      De Boekenbode of administratie ziet de aanvraag en plant deze verder in.
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          setAanvraag(standaardAanvraag())
                          setZsmBewustGekozen(false)
                          setAanvraagMaand(new Date().toISOString().slice(0, 7))
                          setAanvraagErrors({})
                          setAanvraagEigenTitelActief(false)
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
                          setAanvraagBevestigd(false)
                          uitloggen()
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
                <div style={{ padding: isMobiel ? 12 : 16, display: 'grid', gridTemplateColumns: breedFormGrid, gap: isMobiel ? 12 : 16, alignItems: 'start' }}>
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
                      <select
                        value={aanvraagTaakSelectWaarde(aanvraag.titel)}
                        onChange={(e) => {
                          const gekozen = e.target.value
                          const isOverig = gekozen === OVERIG_OPTIE
                          setAanvraagEigenTitelActief(isOverig)
                          setAanvraag((prev) => ({
                            ...prev,
                            titel: isOverig ? '' : gekozen,
                            aantal: taakHeeftAantalVeld(gekozen) ? prev.aantal || '' : '',
                            tijd: taakHeeftTijdVeld(gekozen) ? prev.tijd || '' : '',
                            reden: '',
                            ...taakRouteVoorTitel(gekozen, prev),
                          }))
                          setAanvraagOverigVestiging({ van: false, naar: false })
                          setAanvraagErrors((prev) => {
                            const next = { ...prev }
                            delete next.titel
                            delete next.route
                            return next
                          })
                        }}
                        style={{ ...inp, borderColor: aanvraagErrors.titel ? '#F87171' : '#E5E9F0' }}
                      >
                        <option value="">Kies taak...</option>
                        {TAAK_SUGGESTIES.map((suggestie) => (
                          <option key={suggestie} value={suggestie}>
                            {suggestie}
                          </option>
                        ))}
                      </select>
                      <FieldError>{aanvraagErrors.titel}</FieldError>
                    </div>
                    {aanvraagEigenTitelActief && (
                      <div>
                        <Label>Eigen titel</Label>
                        <input
                          value={aanvraag.titel}
                          onChange={(e) => {
                            setAanvraag((prev) => ({ ...prev, titel: e.target.value, aantal: '', tijd: '' }))
                            setAanvraagEigenTitelActief(true)
                            setAanvraagErrors((prev) => {
                              const next = { ...prev }
                              delete next.titel
                              return next
                            })
                          }}
                          placeholder="Of typ zelf wat er moet gebeuren"
                          style={{ ...inp, borderColor: aanvraagErrors.titel ? '#F87171' : '#E5E9F0' }}
                        />
                      </div>
                    )}
                    {rol !== ROLES.transporteur && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 'fit-content', position: 'relative' }}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 12,
                          color: '#374151',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(aanvraag.prive)}
                          onChange={(e) => setAanvraag((prev) => ({ ...prev, prive: e.target.checked }))}
                        />
                        <span>Privé</span>
                      </label>
                      <button
                        type="button"
                        title="Uitleg over Privé"
                        onClick={() => setToonPriveUitleg(true)}
                        onMouseEnter={() => {
                          if (!isMobiel) setHoverPriveUitleg(true)
                        }}
                        onMouseLeave={() => setHoverPriveUitleg(false)}
                        onFocus={() => {
                          if (!isMobiel) setHoverPriveUitleg(true)
                        }}
                        onBlur={() => setHoverPriveUitleg(false)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 21,
                          height: 21,
                          borderRadius: '50%',
                          border: '1px solid #D1D5DB',
                          color: '#6B7280',
                          background: '#fff',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        i
                      </button>
                      {hoverPriveUitleg && !toonPriveUitleg && (
                        <div
                          style={{
                            position: 'absolute',
                            left: '100%',
                            top: '50%',
                            transform: 'translate(8px, -50%)',
                            zIndex: 35,
                            width: 250,
                            background: '#111827',
                            color: '#fff',
                            borderRadius: 8,
                            padding: '9px 11px',
                            fontSize: 12,
                            lineHeight: 1.35,
                            boxShadow: '0 12px 28px rgba(15,23,42,.18)',
                            pointerEvents: 'none',
                          }}
                        >
                          Alleen Registratie en beheer ziet deze aanvraag. De aanvraag komt niet in Alle aanvragen te staan.
                        </div>
                      )}
                      {toonPriveUitleg && (
                        <div
                          style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 240,
                            background: 'rgba(15,23,42,.32)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 20,
                          }}
                          onClick={() => setToonPriveUitleg(false)}
                        >
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              background: '#fff',
                              borderRadius: 12,
                              padding: 18,
                              width: '100%',
                              maxWidth: 360,
                              boxShadow: '0 20px 60px rgba(0,0,0,.15)',
                            }}
                          >
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 6 }}>
                              Privé aanvraag
                            </div>
                            <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.45, marginBottom: 14 }}>
                              Als je Privé aanvinkt, is de aanvraag alleen zichtbaar in Registratie en beheer. De aanvraag komt dan niet in
                              het overzicht Alle aanvragen bij de aanvrager te staan.
                            </div>
                            <button
                              type="button"
                              onClick={() => setToonPriveUitleg(false)}
                              style={{
                                width: '100%',
                                background: '#EA6A1F',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                padding: '10px 12px',
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Begrepen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    )}
                    {aanvraag.titel === 'Plukker' && (
                      <>
                        {renderAanvraagVestigingVeld('naar', 'Naar vestiging')}
                        {renderAanvraagAantalVeld()}
                        {renderAanvraagToelichtingVeld()}
                      </>
                    )}
                    {aanvraag.titel === 'Eelan' && (
                      <>
                        {renderAanvraagVestigingVeld('naar', 'Naar vestiging')}
                        {renderAanvraagToelichtingVeld()}
                      </>
                    )}
                    {aanvraag.titel === 'Extra kratten' && (
                      <>
                        {renderAanvraagVestigingVeld('van', 'Van vestiging')}
                        {renderAanvraagVestigingVeld('naar', 'Naar vestiging')}
                        <ZelfdeVestigingWaarschuwing van={aanvraag.van} naar={aanvraag.naar} />
                        {renderAanvraagAantalVeld()}
                        {renderAanvraagToelichtingVeld()}
                      </>
                    )}
                    {aanvraag.titel === 'Extra sorteren' && (
                      <>
                        {renderAanvraagVestigingVeld('van', 'Vestiging')}
                        {renderAanvraagAantalVeld()}
                        {renderAanvraagTijdVeld()}
                        {renderAanvraagToelichtingVeld()}
                      </>
                    )}
                    {aanvraag.titel === 'CoderDojo' && (
                      <>
                        {renderAanvraagVestigingVeld('van', 'Van vestiging', CODERDOJO_VESTIGINGEN)}
                        {renderAanvraagVestigingVeld('naar', 'Naar vestiging', CODERDOJO_VESTIGINGEN)}
                        <ZelfdeVestigingWaarschuwing van={aanvraag.van} naar={aanvraag.naar} />
                        {renderAanvraagToelichtingVeld()}
                      </>
                    )}
                    {aanvraag.titel === 'Stort' && (
                      <>
                        {renderAanvraagVestigingVeld('van', 'Van vestiging')}
                        {renderAanvraagToelichtingVeld()}
                      </>
                    )}
                    {aanvraag.titel === 'Garage' && (
                      <>
                        {renderAanvraagToelichtingVeld()}
                      </>
                    )}
                    {aanvraagErrors.route && ['Plukker', 'Eelan', 'Extra kratten', 'Extra sorteren', 'CoderDojo', 'Stort'].includes(aanvraag.titel) && (
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
                    {aanvraag.titel && !['Plukker', 'Eelan', 'Extra kratten', 'Extra sorteren', 'CoderDojo', 'Stort', 'Garage'].includes(aanvraag.titel) && (
                      <>
                    <div>
                      <Label>Van vestiging</Label>
                      <select
                        value={vestigingSelectWaarde(aanvraag.van, aanvraagOverigVestiging.van)}
                        onChange={(e) => {
                          const waarde = e.target.value
                          setAanvraagOverigVestiging((prev) => ({ ...prev, van: waarde === OVERIG_OPTIE }))
                          setAanvraag((prev) => ({ ...prev, van: waarde === OVERIG_OPTIE ? (VESTIGINGEN.includes(prev.van) ? '' : prev.van) : waarde }))
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
                        <option value={OVERIG_OPTIE}>Overig</option>
                      </select>
                      {vestigingSelectWaarde(aanvraag.van, aanvraagOverigVestiging.van) === OVERIG_OPTIE && (
                        <input
                          value={aanvraag.van}
                          onChange={(e) => {
                            setAanvraag((prev) => ({ ...prev, van: e.target.value }))
                            setAanvraagErrors((prev) => {
                              const next = { ...prev }
                              delete next.route
                              return next
                            })
                          }}
                          placeholder="Vul zelf in"
                          style={{ ...inp, marginTop: 7, borderColor: aanvraagErrors.route ? '#F87171' : '#E5E9F0' }}
                        />
                      )}
                    </div>
                    <div>
                      <Label>Naar vestiging</Label>
                      <select
                        value={vestigingSelectWaarde(aanvraag.naar, aanvraagOverigVestiging.naar)}
                        onChange={(e) => {
                          const waarde = e.target.value
                          setAanvraagOverigVestiging((prev) => ({ ...prev, naar: waarde === OVERIG_OPTIE }))
                          setAanvraag((prev) => ({ ...prev, naar: waarde === OVERIG_OPTIE ? (VESTIGINGEN.includes(prev.naar) ? '' : prev.naar) : waarde }))
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
                        <option value={OVERIG_OPTIE}>Overig</option>
                      </select>
                      {vestigingSelectWaarde(aanvraag.naar, aanvraagOverigVestiging.naar) === OVERIG_OPTIE && (
                        <input
                          value={aanvraag.naar}
                          onChange={(e) => {
                            setAanvraag((prev) => ({ ...prev, naar: e.target.value }))
                            setAanvraagErrors((prev) => {
                              const next = { ...prev }
                              delete next.route
                              return next
                            })
                          }}
                          placeholder="Vul zelf in"
                          style={{ ...inp, marginTop: 7, borderColor: aanvraagErrors.route ? '#F87171' : '#E5E9F0' }}
                        />
                      )}
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
                    {renderAanvraagAantalVeld()}
                    {renderAanvraagTijdVeld()}
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
                      </>
                    )}
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
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div>
                      <Label>Wanneer</Label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setAanvraag((prev) => ({ ...prev, week: 'zsm', dag: -1 }))
                            setZsmBewustGekozen(true)
                            setAanvraagMaand(new Date().toISOString().slice(0, 7))
                            setAanvraagErrors((prev) => {
                              const next = { ...prev }
                              delete next.wanneer
                              return next
                            })
                          }}
                          style={{
                            background: aanvraag.week === 'zsm' ? (zsmBewustGekozen ? '#FED7AA' : '#FFF7ED') : '#F3F4F6',
                            color: aanvraag.week === 'zsm' ? '#9A3412' : '#374151',
                            border: aanvraag.week === 'zsm' ? '2px solid #EA6A1F' : '1px solid #E5E9F0',
                            borderRadius: 8,
                            padding: aanvraag.week === 'zsm' ? '7px 11px' : '8px 12px',
                            fontSize: 12,
                            fontWeight: aanvraag.week === 'zsm' ? (zsmBewustGekozen ? 750 : 600) : 600,
                            cursor: 'pointer',
                            boxShadow: aanvraag.week === 'zsm' ? '0 2px 6px rgba(234, 106, 31, .14)' : 'none',
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
                                  setZsmBewustGekozen(false)
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
                              setZsmBewustGekozen(false)
                            } else {
                              setAanvraag((prev) => {
                                const eersteToekomstigeDag = weekWerkdagen(prev.week)
                                  .map((dag, index) => ({ dag, index }))
                                  .find((item) => !isVerledenDatum(item.dag))
                                return { ...prev, dag: eersteToekomstigeDag?.index ?? 0 }
                              })
                              setZsmBewustGekozen(false)
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
                          ? 'De Boekenbode plant deze zo snel mogelijk in.'
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
                          fontWeight: 650,
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

          {tab === 'aanvraagstatus' && rol === ROLES.aanvrager && (
            <Card>
              <CardHead title="Alle aanvragen" sub={`${aanvragen.filter(aanvraagZichtbaarVoorAanvrager).length} totaal`} />
              <div style={{ padding: 14, display: 'grid', gap: 14 }}>
                {aanvragen.filter(aanvraagZichtbaarVoorAanvrager).length === 0 && (
                  <div style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>
                    Nog geen aanvragen.
                  </div>
                )}
                {(() => {
                  const groepen = [
                    {
                      key: 'open',
                      titel: 'Open',
                      leeg: 'Geen open aanvragen.',
                      filter: (item) => aanvraagIsOpen(item) && item.status !== 'info',
                    },
                    {
                      key: 'info',
                      titel: 'Info nodig',
                      leeg: 'Geen aanvragen waar meer informatie nodig is.',
                      filter: (item) => item.status === 'info',
                    },
                    { key: 'voltooid', titel: 'Voltooid', leeg: 'Geen voltooide aanvragen.', filter: aanvraagIsAfgesloten },
                  ]
                  const actieveGroep = groepen.find((groep) => groep.key === aanvraagStatusTab) || groepen[0]
                  const items = aanvragen
                    .filter((item) => aanvraagZichtbaarVoorAanvrager(item) && actieveGroep.filter(item))
                    .slice()
                    .sort(sortAanvragen)

                  return (
                    <>
                      <div style={{ display: 'flex', gap: 3, background: '#F3F4F6', borderRadius: 8, padding: 3, width: 'fit-content', maxWidth: '100%', flexWrap: 'wrap' }}>
                        {groepen.map((groep) => {
                          const aantal = aanvragen.filter((item) => aanvraagZichtbaarVoorAanvrager(item) && groep.filter(item)).length
                          const actief = aanvraagStatusTab === groep.key

                          return (
                            <button
                              key={groep.key}
                              type="button"
                              onClick={() => setAanvraagStatusTab(groep.key)}
                              style={{
                                border: 'none',
                                borderRadius: 6,
                                padding: '7px 12px',
                                fontSize: 12,
                                fontWeight: actief ? 700 : 600,
                                cursor: 'pointer',
                                background: actief ? '#fff' : 'transparent',
                                color: actief ? '#111827' : '#6B7280',
                                boxShadow: actief ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                              }}
                            >
                              {groep.titel} ({aantal})
                            </button>
                          )
                        })}
                      </div>
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
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '9px 12px',
                            borderBottom: '1px solid #E5E9F0',
                            background: '#F8F9FC',
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 650, color: '#374151' }}>{actieveGroep.titel}</div>
                          <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 650 }}>{items.length}</div>
                        </div>
                        {actieveGroep.key === 'voltooid' && (
                          <div
                            style={{
                              padding: '9px 12px',
                              borderBottom: '1px solid #E5E9F0',
                              background: '#fff',
                              color: '#6B7280',
                              fontSize: 12,
                            }}
                          >
                            Voltooide aanvragen blijven ongeveer 1 maand zichtbaar.
                          </div>
                        )}
                        {items.length === 0 && (
                          <div
                            style={{
                              padding: '14px 16px',
                              color: '#9CA3AF',
                              fontSize: 12,
                              background: '#fff',
                            }}
                          >
                            {actieveGroep.leeg}
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
                              {(item.van || item.naar) && (
                                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                                  Locatie: {routeLabel(item.van, item.naar)}
                                </div>
                              )}
                              {item.reden && (
                                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Reden: {item.reden}</div>
                              )}
                              {(item.aantal || item.tijd) && (
                                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                                  {[item.aantal ? `Aantal: ${item.aantal}` : '', item.tijd ? `Tijd: ${item.tijd} min` : ''].filter(Boolean).join(' | ')}
                                </div>
                              )}
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
                                    ' | Gewijzigd door beheer'}
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
                                    background: '#FFFBEB',
                                    border: '1px solid #FED7AA',
                                    borderRadius: 8,
                                    padding: '10px 11px',
                                    fontSize: 12,
                                    color: '#92400E',
                                    marginTop: 10,
                                    fontWeight: 650,
                                  }}
                                >
                                  Beheer vraagt: {item.infoNotitie}
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <AanvraagPill status={item.status} />
                              {aanvraagIsOpen(item) && (
                                <Btn variant="ghost" onClick={() => bewerkAanvraag(item)}>
                                  {item.status === 'info' ? 'Aanvullen' : 'Wijzigen'}
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
                    </>
                  )
                })()}
              </div>
            </Card>
          )}

          {tab === 'educatie-import' && rol === ROLES.educatie && (
            <EducatieImportLayout
              breedFormGrid={breedFormGrid}
              educatieImport={educatieImport}
              educatieImportKlaar={educatieImportKlaar}
              educatieMelding={educatieMelding}
              isMobiel={isMobiel}
              onImportRows={importeerEducatieAanvragen}
              setEducatieImport={setEducatieImport}
              setEducatieMelding={setEducatieMelding}
            />
          )}

          {tab === 'educatie-projecten' && rol === ROLES.educatie && (
            <EducatieProjectenLayout isMobiel={isMobiel} />
          )}

          {tab === 'aanvragen' && rol === ROLES.transporteur && (
            <Card>
              <CardHead
                title="Aanvragen"
                sub={`${aanvragen.filter((item) => item.status === 'nieuw').length} nieuw`}
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
                {(() => {
                  const groepen = [
                    { status: 'nieuw', titel: 'Nieuw', leeg: 'Geen nieuwe aanvragen.' },
                    { status: 'info', titel: 'Meer info nodig', leeg: 'Geen aanvragen waar meer info nodig is.' },
                    { status: 'ingepland', titel: 'Ingepland', leeg: 'Geen ingeplande aanvragen.' },
                    { status: 'voltooid', titel: 'Voltooid', leeg: 'Geen voltooide aanvragen.' },
                    { status: 'verwijderd', titel: 'Verwijderd', leeg: 'Geen verwijderde aanvragen.' },
                  ]
                  const zichtbareItemsVoorGroep = (status) =>
                    aanvragen.filter((item) => {
                      if (item.status !== status) return false
                      if (status === 'voltooid' && isOuderDanMaanden(item, 3)) return false
                      if (status !== 'verwijderd' || !item.verwijderdOp) return true
                      return Date.now() - new Date(item.verwijderdOp).getTime() <= 30 * 24 * 60 * 60 * 1000
                    })
                  const actieveGroep = groepen.find((groep) => groep.status === bertAanvragenTab) || groepen[0]
                  const items = zichtbareItemsVoorGroep(actieveGroep.status)
                    .slice()
                    .sort(sortAanvragen)
                  const ingeklapt = actieveGroep.status === 'verwijderd' && !toonVerwijderd

                  return (
                    <>
                    <div style={{ display: 'flex', gap: 3, background: '#F3F4F6', borderRadius: 8, padding: 3, width: 'fit-content', maxWidth: '100%', flexWrap: 'wrap' }}>
                      {groepen.map((groep) => {
                        const aantal = zichtbareItemsVoorGroep(groep.status).length
                        const actief = bertAanvragenTab === groep.status

                        return (
                          <button
                            key={groep.status}
                            type="button"
                            onClick={() => setBertAanvragenTab(groep.status)}
                            style={{
                              border: 'none',
                              borderRadius: 6,
                              padding: '7px 12px',
                              fontSize: 12,
                              fontWeight: actief ? 700 : 600,
                              cursor: 'pointer',
                              background: actief ? '#fff' : 'transparent',
                              color: actief ? '#111827' : '#6B7280',
                              boxShadow: actief ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                            }}
                          >
                            {groep.titel} ({aantal})
                          </button>
                        )
                      })}
                    </div>
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
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '9px 12px',
                          borderBottom: '1px solid #E5E9F0',
                          background: AANVRAAG_STATUS[actieveGroep.status]?.bg || '#F8F9FC',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 650, color: AANVRAAG_STATUS[actieveGroep.status]?.color || '#374151' }}>{actieveGroep.titel}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontSize: 12, color: AANVRAAG_STATUS[actieveGroep.status]?.color || '#6B7280', fontWeight: 650 }}>{items.length}</div>
                          {actieveGroep.status === 'verwijderd' && items.length > 0 && (
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
                          {actieveGroep.leeg}
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
                                {item.prive && (
                                  <span
                                    title="Alleen zichtbaar in beheer"
                                    style={{
                                      fontSize: 11,
                                      color: '#374151',
                                      background: '#F3F4F6',
                                      border: '1px solid #E5E9F0',
                                      borderRadius: 999,
                                      padding: '2px 7px',
                                      fontWeight: 700,
                                    }}
                                  >
                                    Privé
                                  </span>
                                )}
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
                                {(item.van || item.naar) && <div>Locatie: {routeLabel(item.van, item.naar)}</div>}
                                {item.reden && <div>Reden: {item.reden}</div>}
                                {(item.aantal || item.tijd) && (
                                  <div>
                                    {[item.aantal ? `Aantal: ${item.aantal}` : '', item.tijd ? `Tijd: ${item.tijd} min` : ''].filter(Boolean).join(' | ')}
                                  </div>
                                )}
                                <div>Wanneer: {aanvraagMomentLabel(item)}</div>
                                <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                                  Ingediend: {fmt(new Date(item.aangemaakt || Number(item.id)))}
                                </div>
                              </div>
                              {item.omschrijving && (
                                <div style={{ fontSize: 13, color: '#374151', marginTop: 8 }}>{item.omschrijving}</div>
                              )}
                              {item.aangevuldOp && (
                                <div
                                  style={{
                                    background: '#ECFDF5',
                                    border: '1px solid #A7F3D0',
                                    borderRadius: 8,
                                    padding: '9px 11px',
                                    fontSize: 12,
                                    color: '#065F46',
                                    marginTop: 10,
                                    fontWeight: 650,
                                  }}
                                >
                                  Aanvrager heeft aangevuld op {fmt(new Date(item.aangevuldOp))}.
                                </div>
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
                              {item.verwijderNotitie && (
                                <div
                                  style={{
                                    background: '#F9FAFB',
                                    border: '1px solid #E5E9F0',
                                    borderRadius: 8,
                                    padding: '9px 11px',
                                    fontSize: 12,
                                    color: '#4B5563',
                                    marginTop: 10,
                                  }}
                                >
                                  Verwijdernotitie: {item.verwijderNotitie}
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
                                {item.status !== 'ingepland' && item.status !== 'voltooid' && item.status !== 'verwijderd' && (
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
                                {item.status === 'verwijderd' && (
                                  <Btn size="touch" variant="success" onClick={() => herstelAanvraag(item.id)}>
                                    Herstel
                                  </Btn>
                                )}
                                {item.status === 'verwijderd' && (
                                  <Btn
                                    size="touch"
                                    variant="danger"
                                    onClick={() => setBevestigDefinitiefVerwijderen({ type: 'aanvraag', item })}
                                  >
                                    Definitief verwijderen
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
                    </>
                  )
                })()}
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
                      onClick={() => {
                        setPlanningWeergave(item.k)
                        setToonAfgerondMobiel(false)
                      }}
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
                ) : isMobiel ? (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '42px 1fr 42px',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setWeek(verschuifWeek(week, -1))
                        setToonAfgerondMobiel(false)
                      }}
                      style={{
                        border: '1px solid #E5E9F0',
                        borderRadius: 8,
                        background: '#fff',
                        color: '#374151',
                        minHeight: 38,
                        fontSize: 18,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                      aria-label="Vorige week"
                    >
                      {'<'}
                    </button>
                    <div
                      style={{
                        textAlign: 'center',
                        border: '1px solid #E5E9F0',
                        borderRadius: 8,
                        background: '#fff',
                        color: '#111827',
                        minHeight: 38,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    >
                      {korteWeekLabel(week)}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setWeek(verschuifWeek(week, 1))
                        setToonAfgerondMobiel(false)
                      }}
                      style={{
                        border: '1px solid #E5E9F0',
                        borderRadius: 8,
                        background: '#fff',
                        color: '#374151',
                        minHeight: 38,
                        fontSize: 18,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                      aria-label="Volgende week"
                    >
                      {'>'}
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setWeek(verschuifWeek(week, -1))
                        setToonAfgerondMobiel(false)
                      }}
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
                      onChange={(e) => {
                        setWeek(e.target.value)
                        setToonAfgerondMobiel(false)
                      }}
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
                      onClick={() => {
                        setWeek(verschuifWeek(week, 1))
                        setToonAfgerondMobiel(false)
                      }}
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
                {planningNietVandaag && (
                  <button
                    type="button"
                    onClick={() => {
                      const nu = new Date()
                      setWeek(vandaag())
                      setPlanningWeergave('week')
                      setPlanningMaand(nu.toISOString().slice(0, 7))
                      setPlanningJaar(String(nu.getFullYear()))
                      setMobielePlanningDag(vandaagWerkdagIndex())
                      setToonAfgerondMobiel(false)
                    }}
                    style={{
                      border: '1px solid #FED7AA',
                      background: '#FFF7ED',
                      color: '#9A3412',
                      borderRadius: 8,
                      padding: '6px 10px',
                      fontSize: 12,
                      fontWeight: 750,
                      cursor: 'pointer',
                    }}
                  >
                    Vandaag
                  </button>
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

              {openTakenInVerleden.length > 0 && (
                <div
                  style={{
                    background: isMobiel ? '#fff' : '#FFF7ED',
                    border: isMobiel ? '1px solid #E5E9F0' : '1px solid #FED7AA',
                    borderRadius: 9,
                    padding: isMobiel ? '8px 10px' : '10px 13px',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#F59E0B',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: isMobiel ? 12 : 13, color: isMobiel ? '#6B7280' : '#92400E', fontWeight: isMobiel ? 650 : 800 }}>
                      {openTakenInVerleden.length === 1
                        ? `${isMobiel ? '' : 'Let op: '}1 open taak uit het verleden`
                        : `${isMobiel ? '' : 'Let op: '}${openTakenInVerleden.length} open taken uit het verleden`}
                    </span>
                  </div>
                  <button
                    type="button"
                      onClick={() => {
                        const eerste = openTakenInVerleden[0]
                        setWeek(eerste.week)
                        setPlanningWeergave('week')
                        if (isMobiel) setMobielePlanningDag(Math.max(0, Math.min(4, Number(eerste.dag || 0))))
                        setToonAfgerondMobiel(false)
                      }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#EA6A1F',
                      fontSize: 12,
                      fontWeight: 750,
                      cursor: 'pointer',
                      padding: '3px 0',
                    }}
                  >
                    Bekijk
                  </button>
                </div>
              )}

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
                        const dagTaken = actieveTaken.filter(
                          (taak) => taak.dag !== null && taak.dag !== undefined && taak.week === dag.week && Number(taak.dag) === dag.dagIndex,
                        )
                        const waarschuwing = blokkadeVoorDag(dag.week, dag.dagIndex)
                        const gepland = dagTaken.filter((taak) => taak.status !== 'afgerond').length
                        const hoog = dagTaken.filter((taak) => taak.prioriteit === 'hoog' && taak.status !== 'afgerond').length
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
              {isMobiel && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${dagData.length}, minmax(0, 1fr))`,
                    gap: 6,
                    marginBottom: 12,
                  }}
                >
                  {dagData.map((dag, di) => {
                    const actief = effectieveMobielePlanningDag === di
                    const aantal = weekTakenMetDag.filter((taak) => Number(taak.dag) === di).length
                    const taakLabel = aantal === 1 ? '1 taak' : `${aantal} taken`

                    return (
                      <button
                        key={DAGEN_KORT[di]}
                        type="button"
                        onClick={() => {
                          setMobielePlanningDag(di)
                          setToonAfgerondMobiel(false)
                        }}
                        style={{
                          border: actief ? '1px solid #EA6A1F' : '1px solid #E5E9F0',
                          background: actief ? '#FFF7ED' : '#fff',
                          color: actief ? '#9A3412' : '#374151',
                          borderRadius: 9,
                          padding: '8px 3px',
                          minHeight: 70,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'grid',
                          gap: 2,
                          justifyItems: 'center',
                          alignContent: 'center',
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 800 }}>{DAGEN_KORT[di]}</span>
                        <span style={{ fontSize: 10, color: actief ? '#C2410C' : '#9CA3AF', fontWeight: 650 }}>
                          {fmtS(dag)}
                        </span>
                        {aantal > 0 && (
                          <span
                            style={{
                              marginTop: 2,
                              fontSize: 10,
                              color: actief ? '#9A3412' : '#1F7A4D',
                              fontWeight: 750,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {taakLabel}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
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

              {planningWeergave === 'week' && weekTakenAlleenWeek.length > 0 && (
                <Card style={{ marginBottom: 10 }}>
                  <CardHead title="Weektaken" sub={`${weekTakenAlleenWeek.length} zonder vaste dag`} />
                  <div style={{ padding: isMobiel ? 10 : 12, display: 'grid', gap: 8 }}>
                    {weekTakenAlleenWeek.map((taak) => {
                      const sm = STATUS[taak.status] || STATUS.gepland

                      return (
                        <div
                          key={taak.id}
                          style={{
                            background: taak.status === 'afgerond' ? '#F9FAFB' : '#fff',
                            border: '1px solid #E5E9F0',
                            borderRadius: 8,
                            borderLeft: `3px solid ${sm.dot}`,
                            padding: '10px 12px',
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 750, color: '#111827' }}>{taak.titel}</div>
                          {taak.reden && (
                            <div style={{ fontSize: 12, color: '#374151', marginTop: 3 }}>Reden: {taak.reden}</div>
                          )}
                          {taak.aantal && (
                            <div style={{ fontSize: 12, color: '#374151', marginTop: 3 }}>Aantal: {taak.aantal}</div>
                          )}
                          {taak.tijd && (
                            <div style={{ fontSize: 12, color: '#374151', marginTop: 3 }}>Tijd: {taak.tijd} min</div>
                          )}
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
                            <Pill status={taak.status} />
                            <span style={{ fontSize: 10, color: '#9CA3AF' }}>Alleen week</span>
                            {taak.prioriteit === 'hoog' && (
                              <span style={{ fontSize: 10, color: '#D97706', fontWeight: 700 }}>Hoog</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 9, flexWrap: 'wrap' }}>
                            {rol === ROLES.transporteur && taak.status !== 'afgerond' && (
                              <Btn size="touch" variant="success" onClick={() => updStatus(taak.id, 'afgerond')}>
                                Uitvoeren
                              </Btn>
                            )}
                            {rol === ROLES.transporteur && taak.status === 'afgerond' && (
                              <Btn variant="ghost" onClick={() => updStatus(taak.id, 'gepland')}>
                                Terugzetten
                              </Btn>
                            )}
                            {rol === ROLES.transporteur && (
                              <Btn variant="danger" onClick={() => vraagVerwijderTaak(taak)}>
                                Verwijder
                              </Btn>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobiel ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 10,
                  width: '100%',
                  maxWidth: '100%',
                }}
              >
                {zichtbareWeekDagen.map((dag) => {
                  const di = dagData.findIndex((item) => isoDag(item) === isoDag(dag))
                  const dt = weekTakenMetDag.filter((taak) => Number(taak.dag) === di)
                  const openDt = dt.filter((taak) => taak.status !== 'afgerond')
                  const afgerondDt = dt.filter((taak) => taak.status === 'afgerond')
                  const zichtbareTaken = isMobiel ? openDt : [...openDt, ...afgerondDt]
                  const dagWaarschuwing = blokkadeVoorDag(week, di)
                  const renderTaak = (taak) => {
                    const sm = STATUS[taak.status] || STATUS.gepland

                    return (
                      <div
                        key={taak.id}
                        style={{
                          background: taak.status === 'afgerond' ? '#F9FAFB' : '#fff',
                          border: '1px solid #E5E9F0',
                          borderRadius: 7,
                          padding: isMobiel ? '11px 12px' : '8px 9px',
                          marginBottom: isMobiel ? 8 : 5,
                          borderLeft: `3px solid ${sm.dot}`,
                          opacity: taak.status === 'afgerond' ? 0.86 : 1,
                        }}
                      >
                        <div style={{ fontSize: isMobiel ? 13 : 11, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
                          {taak.titel}
                        </div>
                        {taak.reden && (
                          <div style={{ fontSize: isMobiel ? 12 : 10, color: '#374151', marginBottom: 4 }}>
                            Reden: {taak.reden}
                          </div>
                        )}
                        {taak.aantal && (
                          <div style={{ fontSize: isMobiel ? 12 : 10, color: '#374151', marginBottom: 4 }}>
                            Aantal: {taak.aantal}
                          </div>
                        )}
                        {taak.tijd && (
                          <div style={{ fontSize: isMobiel ? 12 : 10, color: '#374151', marginBottom: 4 }}>
                            Tijd: {taak.tijd} min
                          </div>
                        )}
                        {taak.van && taak.naar && (
                          <div style={{ fontSize: isMobiel ? 12 : 10, color: '#6B7280', marginBottom: 4 }}>
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
                          {rol === ROLES.transporteur &&
                            (taak.status === 'gepland' || taak.status === 'verplaatst' || taak.status === 'onderweg') && (
                              <Btn size="touch" variant="success" onClick={() => updStatus(taak.id, 'afgerond')}>
                                Uitvoeren
                              </Btn>
                            )}
                          {rol === ROLES.transporteur && taak.status === 'afgerond' && (
                            <Btn variant="ghost" onClick={() => updStatus(taak.id, 'gepland')}>
                              Terugzetten
                            </Btn>
                          )}
                          {rol === ROLES.transporteur &&
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
                          {rol === ROLES.transporteur && (
                            <Btn variant="danger" onClick={() => vraagVerwijderTaak(taak)}>
                              Verwijder
                            </Btn>
                          )}
                        </div>
                      </div>
                    )
                  }

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
                          padding: isMobiel ? '12px 13px' : '9px 11px',
                          background: '#fff',
                          borderBottom: '1px solid #E5E9F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: isMobiel ? 15 : 12, fontWeight: 700, color: '#374151' }}>
                            {isMobiel ? DAGEN[di] : DAGEN_KORT[di]}
                          </div>
                          <div style={{ fontSize: isMobiel ? 12 : 10, color: '#9CA3AF' }}>{fmtS(dag)}</div>
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
                      <div style={{ padding: isMobiel ? 10 : 7, minHeight: isMobiel ? 120 : 60 }}>
                        {dt.length === 0 && (
                          <div style={{ padding: '18px 4px', fontSize: isMobiel ? 12 : 10, color: '#D1D5DB', textAlign: 'center' }}>
                            Geen extra taken
                          </div>
                        )}
                        {dt.length > 0 && openDt.length === 0 && isMobiel && (
                          <div style={{ padding: '6px 4px 12px', fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>
                            Geen open taken
                          </div>
                        )}
                        {zichtbareTaken.map(renderTaak)}
                        {isMobiel && afgerondDt.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setToonAfgerondMobiel((toon) => !toon)}
                            style={{
                              width: '100%',
                              border: '1px solid #E5E9F0',
                              background: '#fff',
                              color: '#6B7280',
                              borderRadius: 8,
                              padding: '9px 10px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              marginTop: openDt.length ? 2 : 0,
                              marginBottom: toonAfgerondMobiel ? 8 : 0,
                            }}
                          >
                            {toonAfgerondMobiel ? 'Verberg afgerond' : `Afgerond (${afgerondDt.length})`}
                          </button>
                        )}
                        {isMobiel && toonAfgerondMobiel && afgerondDt.map(renderTaak)}
                      </div>
                    </div>
                  )
                })}
              </div>
                </>
              )}
            </div>
          )}

          {tab === 'toevoegen' && rol === ROLES.transporteur && (
            <div>
              {toevoegenTab === 'taak' && (
              <Card>
                <CardHead title={taakEditId ? 'Taak wijzigen' : 'Taak toevoegen'} />
                <div style={{ padding: isMobiel ? 12 : 16, display: 'grid', gridTemplateColumns: breedFormGrid, gap: isMobiel ? 12 : 16, alignItems: 'start' }}>
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      background: '#FFF7ED',
                      border: '1px solid #FED7AA',
                      borderRadius: 8,
                      padding: '9px 11px',
                      fontSize: 12,
                      color: '#92400E',
                      lineHeight: 1.4,
                      fontWeight: 400,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>!</span> Deze taak komt meteen in de planning. Gebruik Aanvraag invoeren als iets eerst nog beoordeeld of ingepland moet worden.
                  </div>
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
                      Kies een taak of typ zelf een titel.
                    </div>
                  )}
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div>
                      <Label>Naam</Label>
                      <input
                        value={nieuw.naam}
                        onChange={(e) => setNieuw((prev) => ({ ...prev, naam: e.target.value }))}
                        placeholder="Bert"
                        style={inp}
                      />
                    </div>
                    <div>
                      <Label>Wat moet er gebeuren?</Label>
                      <select
                        value={taakSelectWaarde(nieuw.titel)}
                        onChange={(e) => {
                          const gekozen = e.target.value
                          const isOverig = gekozen === OVERIG_OPTIE
                          setEigenTitelActief(isOverig)
                          setNieuw((prev) => ({
                            ...prev,
                            titel: isOverig ? '' : gekozen,
                            aantal: taakHeeftAantalVeld(gekozen) ? prev.aantal : '',
                            tijd: taakHeeftTijdVeld(gekozen) ? prev.tijd : '',
                            reden: '',
                            ...taakRouteVoorTitel(gekozen, prev),
                          }))
                          setTaakOverigVestiging({ van: false, naar: false })
                          setTaakErrors((prev) => {
                            const next = { ...prev }
                            delete next.titel
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
                    {eigenTitelActief && (
                    <div>
                      <Label>Eigen titel</Label>
                      <input
                        value={nieuw.titel}
                        onChange={(e) => {
                          setNieuw((prev) => ({ ...prev, titel: e.target.value, aantal: '' }))
                          setEigenTitelActief(true)
                          setTaakErrors((prev) => {
                            const next = { ...prev }
                            delete next.titel
                            return next
                          })
                        }}
                        placeholder="Of typ zelf wat er moet gebeuren"
                        style={{ ...inp, borderColor: taakErrors.titel ? '#F87171' : '#E5E9F0' }}
                      />
                    </div>
                    )}
                    {nieuw.titel === 'Plukker' && (
                      <>
                        {renderTaakVestigingVeld('naar', 'Naar vestiging')}
                        {renderTaakAantalVeld()}
                        {renderTaakToelichtingVeld()}
                      </>
                    )}
                    {nieuw.titel === 'Eelan' && (
                      <>
                        {renderTaakVestigingVeld('naar', 'Naar vestiging')}
                        {renderTaakToelichtingVeld()}
                      </>
                    )}
                    {nieuw.titel === 'Extra kratten' && (
                      <>
                        {renderTaakVestigingVeld('van', 'Van vestiging')}
                        {renderTaakVestigingVeld('naar', 'Naar vestiging')}
                        <ZelfdeVestigingWaarschuwing van={nieuw.van} naar={nieuw.naar} />
                        {renderTaakAantalVeld()}
                        {renderTaakToelichtingVeld()}
                      </>
                    )}
                    {nieuw.titel === 'Extra sorteren' && (
                      <>
                        {renderTaakVestigingVeld('van', 'Vestiging')}
                        {renderTaakAantalVeld()}
                        {renderTaakTijdVeld()}
                        {renderTaakToelichtingVeld()}
                      </>
                    )}
                    {nieuw.titel === 'CoderDojo' && (
                      <>
                        {renderTaakVestigingVeld('van', 'Van vestiging', CODERDOJO_VESTIGINGEN)}
                        {renderTaakVestigingVeld('naar', 'Naar vestiging', CODERDOJO_VESTIGINGEN)}
                        <ZelfdeVestigingWaarschuwing van={nieuw.van} naar={nieuw.naar} />
                        {renderTaakToelichtingVeld()}
                      </>
                    )}
                    {nieuw.titel === 'Stort' && (
                      <>
                        {renderTaakVestigingVeld('van', 'Van vestiging')}
                        {renderTaakToelichtingVeld()}
                      </>
                    )}
                    {nieuw.titel === 'Garage' && (
                      <>
                        {renderTaakToelichtingVeld()}
                      </>
                    )}
                    {!nieuw.titel && (
                      <>
                        {renderTaakVestigingVeld('van', 'Van vestiging')}
                        {renderTaakVestigingVeld('naar', 'Naar vestiging')}
                        <ZelfdeVestigingWaarschuwing van={nieuw.van} naar={nieuw.naar} />
                        {renderTaakToelichtingVeld('Opmerking')}
                      </>
                    )}
                    {nieuw.titel && !['Plukker', 'Eelan', 'Extra kratten', 'Extra sorteren', 'CoderDojo', 'Stort', 'Garage'].includes(nieuw.titel) && (
                      <>
                        {renderTaakVestigingVeld('van', 'Van vestiging')}
                        {renderTaakVestigingVeld('naar', 'Naar vestiging')}
                        <ZelfdeVestigingWaarschuwing van={nieuw.van} naar={nieuw.naar} />
                        {renderTaakAantalVeld()}
                        {renderTaakTijdVeld()}
                        {renderTaakToelichtingVeld()}
                      </>
                    )}
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
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div>
                      <Label>Wanneer</Label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                        {[
                          { k: false, l: 'Dag kiezen' },
                          { k: true, l: 'Alleen week' },
                        ].map((item) => (
                          <button
                            key={item.l}
                            type="button"
                            onClick={() =>
                              setNieuw((prev) => ({
                                ...prev,
                                alleenWeek: item.k,
                                dag: item.k ? null : prev.dag ?? vandaagDagIndex(),
                              }))
                            }
                            style={{
                              background: nieuw.alleenWeek === item.k ? '#FFF7ED' : '#F3F4F6',
                              color: nieuw.alleenWeek === item.k ? '#9A3412' : '#374151',
                              border: nieuw.alleenWeek === item.k ? '1px solid #EA6A1F' : '1px solid #E5E9F0',
                              borderRadius: 8,
                              padding: '8px 12px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {item.l}
                          </button>
                        ))}
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
                            Al uitgevoerd
                          </button>
                        )}
                        {!nieuw.alleenWeek && <MonthNav value={taakMaand} onChange={setTaakMaand} />}
                      </div>
                      {nieuw.alleenWeek ? (
                        <select
                          value={nieuw.week}
                          onChange={(e) => setNieuw((prev) => ({ ...prev, week: e.target.value, dag: null }))}
                          style={inp}
                        >
                          {WEKEN.map((wk) => (
                            <option key={wk} value={wk}>
                              {weekOptieLabel(wk)}
                            </option>
                          ))}
                        </select>
                      ) : (
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
                                    kiesDagMetWeekendCheck(dag.week, dag.dagIndex, () => {
                                      setNieuw((prev) => ({ ...prev, week: dag.week, dag: dag.dagIndex, alleenWeek: false }))
                                    })
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
                      )}
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>
                        Gekozen: {aanvraagWeekLabel(nieuw.week)}{nieuw.alleenWeek ? '' : ` | ${dagLabel(nieuw.dag)}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => voegToe('gepland', 'alletaken')}
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
                            resetTaakForm()
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

          {tab === 'alletaken' && rol === ROLES.transporteur && (
            <Card>
              <CardHead
                title="Overzicht"
                sub={`${actieveTaken.length} actief${verwijderdeTaken.length ? `, ${verwijderdeTaken.length} verwijderd` : ''}`}
              />
              <div style={{ padding: 14, borderBottom: '1px solid #E5E9F0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  value={taakZoekterm}
                  onChange={(e) => setTaakZoekterm(e.target.value)}
                  placeholder="Zoek op taak, vestiging, datum of week..."
                  style={{ ...inp, flex: '1 1 260px', minWidth: 220 }}
                />
                <select
                  value={taakJaarFilter}
                  onChange={(e) => {
                    setTaakJaarFilter(e.target.value)
                    setTaakMaandFilter('alle')
                  }}
                  style={{ ...inp, width: 'auto', minWidth: 130 }}
                >
                  <option value="alle">Alle jaren</option>
                  {taakJaren.map((jaar) => (
                    <option key={jaar} value={jaar}>
                      {jaar}
                    </option>
                  ))}
                </select>
                <select
                  value={taakMaandFilter}
                  onChange={(e) => setTaakMaandFilter(e.target.value)}
                  style={{ ...inp, width: 'auto', minWidth: 150 }}
                >
                  <option value="alle">Alle maanden</option>
                  {taakMaanden.map((maand) => (
                    <option key={maand} value={maand}>
                      {maandLabel(maand)}
                    </option>
                  ))}
                </select>
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
                            {taak.reden && (
                              <div style={{ fontSize: 12, color: '#374151', marginTop: 2 }}>Reden: {taak.reden}</div>
                            )}
                            {taak.aantal && (
                              <div style={{ fontSize: 12, color: '#374151', marginTop: 2 }}>Aantal: {taak.aantal}</div>
                            )}
                            {taak.tijd && (
                              <div style={{ fontSize: 12, color: '#374151', marginTop: 2 }}>Tijd: {taak.tijd} min</div>
                            )}
                            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                              {weekNr(taak.week)} | {dagLabel(taak.dag)} | {taak.naam || taak.door || bronLabel(taak.bron)}
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
                            {taak.status === 'afgerond' && (
                              <Btn variant="ghost" onClick={() => updStatus(taak.id, 'gepland')}>
                                Terugzetten
                              </Btn>
                            )}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 650, color: '#374151' }}>Verwijderde taken</span>
                        <span
                          style={{
                            minWidth: 24,
                            textAlign: 'center',
                            borderRadius: 999,
                            background: '#E5E7EB',
                            color: '#4B5563',
                            fontSize: 12,
                            fontWeight: 750,
                            padding: '2px 8px',
                          }}
                        >
                          {gezochteVerwijderdeTaken.length}
                        </span>
                      </div>
                      <Btn variant="ghost" onClick={() => setToonVerwijderdeTaken((prev) => !prev)}>
                        {toonVerwijderdeTaken ? 'Verberg verwijderde taken' : 'Toon verwijderde taken'}
                      </Btn>
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
                                {taak.reden && (
                                  <div style={{ fontSize: 12, color: '#374151', marginTop: 2 }}>Reden: {taak.reden}</div>
                                )}
                                {taak.aantal && (
                                  <div style={{ fontSize: 12, color: '#374151', marginTop: 2 }}>Aantal: {taak.aantal}</div>
                                )}
                                {taak.tijd && (
                                  <div style={{ fontSize: 12, color: '#374151', marginTop: 2 }}>Tijd: {taak.tijd} min</div>
                                )}
                                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                                  {weekNr(taak.week)} | {dagLabel(taak.dag)} | {taak.naam || taak.door || bronLabel(taak.bron)}
                                </div>
                                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 3 }}>
                                  Verwijderd: {fmt(new Date(taak.verwijderdOp || taak.aangemaakt || Number(taak.id)))}
                                </div>
                                {taak.verwijderNotitie && (
                                  <div style={{ fontSize: 12, color: '#4B5563', marginTop: 6 }}>
                                    Notitie: {taak.verwijderNotitie}
                                  </div>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <Pill status={taak.status} />
                                <Btn variant="success" onClick={() => herstelTaak(taak.id)}>
                                  Herstel
                                </Btn>
                                <Btn
                                  variant="danger"
                                  onClick={() => setBevestigDefinitiefVerwijderen({ type: 'taak', item: taak })}
                                >
                                  Definitief verwijderen
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

          {tab === 'drukte' && rol === ROLES.transporteur && (
            <div style={{ display: 'grid', gridTemplateColumns: breedFormGrid, gap: isMobiel ? 12 : 18 }}>
              <Card>
                <CardHead title="Druktemelding toevoegen" />
                <div style={{ padding: 18, display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 3, background: '#F3F4F6', borderRadius: 8, padding: 3 }}>
                    {[
                      { k: 'week', l: 'Hele week' },
                      { k: 'dag', l: 'Losse dag' },
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
                            geselecteerdeWeken:
                              item.k === 'week' && (!prev.geselecteerdeWeken || prev.geselecteerdeWeken.length === 0) && prev.week
                                ? [prev.week]
                                : prev.geselecteerdeWeken || [],
                          }))
                        }
                      >
                        {item.l}
                      </button>
                    ))}
                  </div>
                  {blokForm.type === 'week' && (
                    <div>
                      <Label>Week kiezen</Label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                        <button
                          type="button"
                          onClick={() => {
                            kiesDrukteWeek(vandaag())
                            setBlokMaand(new Date().toISOString().slice(0, 7))
                          }}
                          style={{
                            background: (blokForm.geselecteerdeWeken || []).includes(vandaag()) ? '#EA6A1F' : '#F3F4F6',
                            color: (blokForm.geselecteerdeWeken || []).includes(vandaag()) ? '#fff' : '#374151',
                            border: (blokForm.geselecteerdeWeken || []).includes(vandaag()) ? 'none' : '1px solid #E5E9F0',
                            borderRadius: 8,
                            padding: '8px 12px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Deze week
                        </button>
                        <MonthNav value={blokMaand} onChange={setBlokMaand} />
                      </div>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: -4, marginBottom: 8 }}>
                        Klik op elke week die je wilt toevoegen. Klik nog een keer om een week weer weg te halen.
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
                            gridTemplateColumns: '48px repeat(7, minmax(0, 1fr))',
                            gap: 5,
                            marginBottom: 5,
                          }}
                        >
                          <div />
                          {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((dag) => (
                            <div key={dag} style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textAlign: 'center' }}>
                              {dag}
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'grid', gap: 5 }}>
                          {Array.from({ length: Math.ceil(maandDagen(blokMaand).length / 7) }, (_, rij) => {
                            const weekDagenMaand = maandDagen(blokMaand).slice(rij * 7, rij * 7 + 7)
                            const weekKey = weekDagenMaand[0]?.week
                            const geselecteerd = (blokForm.geselecteerdeWeken || []).includes(weekKey)

                            return (
                              <button
                                key={`drukte-week-${weekKey}`}
                                type="button"
                                onClick={() => kiesDrukteWeek(weekKey)}
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '48px repeat(7, minmax(0, 1fr))',
                                  gap: 5,
                                  alignItems: 'center',
                                  width: '100%',
                                  border: geselecteerd ? '1px solid #EA6A1F' : '1px solid #E5E9F0',
                                  borderRadius: 8,
                                  background: geselecteerd ? '#FFF7ED' : '#fff',
                                  padding: 5,
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                }}
                              >
                                <span style={{ fontSize: 11, fontWeight: 750, color: geselecteerd ? '#9A3412' : '#6B7280' }}>
                                  {weekNr(weekKey).replace('Week ', 'W')}
                                </span>
                                {weekDagenMaand.map((dag) => (
                                  <span
                                    key={dag.iso}
                                    style={{
                                      minHeight: 28,
                                      borderRadius: 6,
                                      display: 'grid',
                                      placeItems: 'center',
                                      background: geselecteerd ? '#FED7AA' : dag.inMaand ? '#F8F9FC' : '#fff',
                                      color: dag.inMaand ? '#111827' : '#D1D5DB',
                                      fontSize: 12,
                                      fontWeight: dag.inMaand ? 650 : 500,
                                    }}
                                  >
                                    {dag.date.getDate()}
                                  </span>
                                ))}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>
                        Gekozen:{' '}
                        {(blokForm.geselecteerdeWeken || []).length
                          ? (blokForm.geselecteerdeWeken || []).map((wk) => weekNr(wk)).join(', ')
                          : 'kies een week'}
                      </div>
                    </div>
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
                    {['week', 'maand', 'kwartaal', 'jaar'].map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setRapp((prev) => ({ ...prev, type, week: type === 'week' ? vandaag() : prev.week }))
                          setRapportZichtbaar(false)
                          setRapportWeergave(null)
                        }}
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
                        {type === 'week' ? 'Per week' : type === 'maand' ? 'Per maand' : type === 'kwartaal' ? 'Per kwartaal' : 'Per jaar'}
                      </button>
                    ))}
                  </div>
                  {rapp.type === 'week' ? (
                    <select
                      value={rapp.week}
                      onChange={(e) => {
                        setRapp((prev) => ({ ...prev, week: e.target.value }))
                        setRapportZichtbaar(false)
                        setRapportWeergave(null)
                      }}
                      style={{ ...inp, width: 'auto', padding: '7px 12px' }}
                    >
                      {WEKEN.map((wk) => (
                        <option key={wk} value={wk}>
                          {weekOptieLabel(wk)}
                        </option>
                      ))}
                    </select>
                  ) : rapp.type === 'maand' ? (
                    <MonthNav
                      value={rapp.maand}
                      onChange={kiesRapportMaand}
                      min="2026-01"
                    />
                  ) : rapp.type === 'kwartaal' ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <select
                        value={kwartaalJaar(rapp.kwartaal)}
                        onChange={(e) => zetKwartaal('jaar', e.target.value)}
                        style={{ ...inp, width: 'auto', padding: '7px 12px' }}
                      >
                        {Array.from({ length: 10 }, (_, index) => 2026 + index).map((jaar) => (
                          <option key={jaar} value={jaar}>
                            {jaar}
                          </option>
                        ))}
                      </select>
                      <div style={{ display: 'flex', gap: 3, background: '#F3F4F6', borderRadius: 8, padding: 3 }}>
                        {[
                          ['1', 'Q1', 'jan-feb-mrt'],
                          ['2', 'Q2', 'apr-mei-jun'],
                          ['3', 'Q3', 'jul-aug-sep'],
                          ['4', 'Q4', 'okt-nov-dec'],
                        ].map(([nummer, label, maanden]) => (
                          <button
                            key={nummer}
                            type="button"
                            onClick={() => zetKwartaal('kwartaal', nummer)}
                            title={maanden}
                            style={{
                              border: 'none',
                              borderRadius: 6,
                              padding: '6px 10px',
                              fontSize: 12,
                              fontWeight: 650,
                              cursor: 'pointer',
                              background: kwartaalNummer(rapp.kwartaal) === nummer ? '#fff' : 'transparent',
                              color: kwartaalNummer(rapp.kwartaal) === nummer ? '#111827' : '#6B7280',
                              boxShadow: kwartaalNummer(rapp.kwartaal) === nummer ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: '#6B7280' }}>
                        {kwartaalLabel(rapp.kwartaal).replace(`Kwartaal ${kwartaalNummer(rapp.kwartaal)} ${kwartaalJaar(rapp.kwartaal)} `, '')}
                      </div>
                    </div>
                  ) : (
                    <select
                      value={rapp.jaar}
                      onChange={(e) => {
                        setRapp((prev) => ({ ...prev, jaar: e.target.value }))
                        setRapportZichtbaar(false)
                        setRapportWeergave(null)
                      }}
                      style={{ ...inp, width: 'auto', padding: '7px 12px' }}
                    >
                      {Array.from({ length: 10 }, (_, index) => 2026 + index).map((jaar) => (
                        <option key={jaar} value={jaar}>
                          {jaar}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setRapportWeergave('dashboard')
                      setRapportZichtbaar(false)
                    }}
                    style={{
                      background: '#EA6A1F',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '9px 16px',
                      fontSize: 13,
                      fontWeight: 650,
                      cursor: 'pointer',
                    }}
                  >
                    Toon dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRapportZichtbaar(true)
                      setRapportWeergave('rapportage')
                    }}
                    style={{
                      background: '#1F7A4D',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '9px 16px',
                      fontSize: 13,
                      fontWeight: 650,
                      cursor: 'pointer',
                    }}
                  >
                    Toon rapportage
                  </button>
                  <div
                    style={{
                      flexBasis: '100%',
                      fontSize: 12,
                      color: '#6B7280',
                      lineHeight: 1.4,
                    }}
                  >
                    Dashboard toont stuurinformatie. Rapportage toont detailregels en export voor administratie.
                  </div>
                </div>
              </Card>

              {dashboardData && (
                <div>
                  <div
                    style={{
                      background: '#FFF7ED',
                      color: '#3A2A22',
                      border: '1px solid #FED7AA',
                      borderRadius: 8,
                      padding: isMobiel ? 16 : 20,
                      marginBottom: 14,
                      display: 'grid',
                      gridTemplateColumns: isMobiel ? '1fr' : '1fr auto',
                      gap: 16,
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, color: '#9A3412', fontWeight: 750, marginBottom: 5 }}>
                        Stuurinformatie transport
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 850, letterSpacing: 0 }}>
                        {dashboardData.periodeLabel}
                      </div>
                      <div style={{ fontSize: 12, color: '#7C4A2A', marginTop: 6, lineHeight: 1.45 }}>
                        Gericht op capaciteit, werkdruk, piekbelasting, service en beheersbaarheid.
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: isMobiel ? 'flex-start' : 'flex-end' }}>
                      {[
                        {
                          label: 'Capaciteit',
                          value: dashboardData.capaciteitSignaal,
                          bg: dashboardData.capaciteitSignaal === 'Let op' ? '#FEE2E2' : dashboardData.capaciteitSignaal === 'Druk' ? '#FEF3C7' : '#DCFCE7',
                          color: dashboardData.capaciteitSignaal === 'Let op' ? '#991B1B' : dashboardData.capaciteitSignaal === 'Druk' ? '#92400E' : '#166534',
                        },
                        {
                          label: 'Piekindicator',
                          value: dashboardData.piekSignaal,
                          bg: dashboardData.piekSignaal === 'Hoog' ? '#FEE2E2' : dashboardData.piekSignaal === 'Verhoogd' ? '#FEF3C7' : '#DCFCE7',
                          color: dashboardData.piekSignaal === 'Hoog' ? '#991B1B' : dashboardData.piekSignaal === 'Verhoogd' ? '#92400E' : '#166534',
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          style={{
                            background: item.bg,
                            color: item.color,
                            borderRadius: 8,
                            padding: '9px 12px',
                            minWidth: 126,
                          }}
                        >
                          <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>{item.label}</div>
                          <div style={{ fontSize: 16, fontWeight: 850, marginTop: 2 }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
                      gap: 10,
                      marginBottom: 14,
                    }}
                  >
                    {[
                      { l: 'Open taken', v: dashboardData.open, c: '#1D4ED8', sub: 'actuele werkdruk' },
                      { l: 'Afgerond', v: dashboardData.afgerond, c: '#166534', sub: `${dashboardData.afrondingsgraad}% afronding` },
                      { l: 'Vertraagd', v: dashboardData.vertraagd, c: '#B91C1C', sub: 'niet afgerond in verleden' },
                      { l: 'Uitzonderingen', v: dashboardData.uitzonderingsritten, c: '#111827', sub: 'buiten standaardstroom' },
                      { l: 'Extra stops', v: dashboardData.extraStops, c: '#B45309', sub: 'taken met locatie' },
                      { l: 'Sorteertijd', v: `${dashboardData.sorteerTijdMin} min`, c: '#7C2D12', sub: 'Tuitjenhorn/sorteren' },
                      { l: 'Piekwaarschuwingen', v: dashboardData.piekWaarschuwingen.length, c: '#EA6A1F', sub: 'handmatig + automatisch' },
                    ].map((item) => (
                      <div
                        key={item.l}
                        style={{
                          background: '#fff',
                          border: '1px solid #E5E9F0',
                          borderRadius: 8,
                          padding: '14px 15px',
                        }}
                      >
                        <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 750 }}>{item.l}</div>
                        <div style={{ fontSize: 26, fontWeight: 850, color: item.c, marginTop: 4 }}>{item.v}</div>
                        <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 3 }}>{item.sub}</div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: 10,
                      marginBottom: 18,
                    }}
                  >
                    <Card>
                      <CardHead title={dashboardData.periodeGrafiekTitel} sub={dashboardData.periodeLabel} />
                      <div style={{ padding: 16 }}>
                        {dashboardData.periodeDrukte.length === 0 && (
                          <div style={{ fontSize: 12, color: '#9CA3AF' }}>Geen taken in deze periode.</div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'end', gap: 8, minHeight: 150 }}>
                          {dashboardData.periodeDrukte.map((item) => {
                            const max = Math.max(1, ...dashboardData.periodeDrukte.map((periodeItem) => periodeItem.aantal))
                            return (
                              <div key={item.label} style={{ flex: 1, display: 'grid', gap: 6, alignItems: 'end' }}>
                                <div style={{ fontSize: 10, color: '#6B7280', textAlign: 'center', minHeight: 13 }}>{item.aantal || ''}</div>
                                <div
                                  title={`${item.label}: ${item.aantal}`}
                                  style={{
                                    minHeight: 6,
                                    height: `${Math.max(6, (item.aantal / max) * 118)}px`,
                                    background: item.aantal === 0 ? '#E5E7EB' : '#EA6A1F',
                                    borderRadius: '6px 6px 2px 2px',
                                  }}
                                />
                                <div style={{ fontSize: 10, color: '#6B7280', textAlign: 'center' }}>{item.label}</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </Card>

                    {rapp.type !== 'week' && (
                      <Card>
                        <CardHead title="Drukte per weekdag" />
                        <div style={{ padding: 16, display: 'grid', gap: 9 }}>
                          {dashboardData.dagVerdeling.map((item) => {
                            const max = Math.max(1, ...dashboardData.dagVerdeling.map((dagItem) => dagItem.aantal))
                            return (
                              <div key={item.label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151' }}>
                                  <span>{item.label}</span>
                                  <strong>{item.aantal}</strong>
                                </div>
                                <div style={{ height: 10, background: '#EEF2F7', borderRadius: 999, overflow: 'hidden', marginTop: 4 }}>
                                  <div style={{ width: `${(item.aantal / max) * 100}%`, height: '100%', background: '#2563EB' }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </Card>
                    )}

                    <Card>
                      <CardHead title="Verdeling werk" />
                      <div style={{ padding: 16, display: 'grid', gap: 12 }}>
                        {(() => {
                          const items = [
                            { label: 'Uit aanvragen', aantal: dashboardData.uitAanvragen, color: '#1D4ED8' },
                            { label: 'Handmatig toegevoegd', aantal: dashboardData.handmatig, color: '#1F7A4D' },
                            { label: 'Sorteerwerk', aantal: dashboardData.sorteerTaken, color: '#EA6A1F' },
                            { label: 'Hoge prioriteit', aantal: dashboardData.hogePrioriteit, color: '#B91C1C' },
                          ]
                          const totaalWerk = Math.max(1, items.reduce((som, item) => som + item.aantal, 0))
                          let positie = 0
                          const gradient = items
                            .map((item) => {
                              const start = positie
                              positie += (item.aantal / totaalWerk) * 100
                              return `${item.color} ${start}% ${positie}%`
                            })
                            .join(', ')
                          return (
                            <div style={{ display: 'grid', gridTemplateColumns: '104px 1fr', gap: 14, alignItems: 'center' }}>
                              <div
                                aria-label="Verdeling werk"
                                style={{
                                  width: 104,
                                  height: 104,
                                  borderRadius: '50%',
                                  background: items.some((item) => item.aantal > 0) ? `conic-gradient(${gradient})` : '#E5E7EB',
                                  display: 'grid',
                                  placeItems: 'center',
                                }}
                              >
                                <div
                                  style={{
                                    width: 62,
                                    height: 62,
                                    borderRadius: '50%',
                                    background: '#fff',
                                  }}
                                />
                              </div>
                              <div style={{ display: 'grid', gap: 7 }}>
                                {items.map((item) => (
                                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#374151' }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                                    <span style={{ flex: 1 }}>{item.label}</span>
                                    <strong>{item.aantal}</strong>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })()}
                        {[
                          { label: 'Uit aanvragen', aantal: dashboardData.uitAanvragen, color: '#1D4ED8' },
                          { label: 'Handmatig toegevoegd', aantal: dashboardData.handmatig, color: '#1F7A4D' },
                          { label: 'Sorteerwerk', aantal: dashboardData.sorteerTaken, color: '#EA6A1F' },
                          { label: 'Hoge prioriteit', aantal: dashboardData.hogePrioriteit, color: '#B91C1C' },
                        ].map((item) => {
                          const max = Math.max(1, dashboardData.uitAanvragen, dashboardData.handmatig, dashboardData.sorteerTaken, dashboardData.hogePrioriteit)
                          return (
                            <div key={item.label}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151' }}>
                                <span>{item.label}</span>
                                <strong>{item.aantal}</strong>
                              </div>
                              <div style={{ height: 9, background: '#EEF2F7', borderRadius: 999, overflow: 'hidden', marginTop: 5 }}>
                                <div style={{ width: `${(item.aantal / max) * 100}%`, height: '100%', background: item.color }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </Card>

                    <Card>
                      <CardHead
                        title="Piekwaarschuwingen"
                        sub={
                          dashboardData.piekWaarschuwingen.length
                            ? `${dashboardData.druktemeldingen.length} handmatig, ${dashboardData.automatischeWaarschuwingen.length} automatisch`
                            : 'geen'
                        }
                      />
                      <div style={{ padding: 16, display: 'grid', gap: 8 }}>
                        {dashboardData.piekWaarschuwingen.length === 0 && (
                          <div style={{ fontSize: 12, color: '#9CA3AF' }}>Geen piekwaarschuwingen in deze periode.</div>
                        )}
                        {dashboardData.piekWaarschuwingen.map((item) => (
                          <div
                            key={item.id || `${item.week}-${item.dag ?? 'week'}`}
                            style={{
                              background: item.automatisch ? '#F8FAFC' : '#FFF7ED',
                              border: item.automatisch ? '1px solid #CBD5E1' : '1px solid #FED7AA',
                              borderRadius: 8,
                              padding: '9px 10px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 12, fontWeight: 800, color: item.automatisch ? '#475569' : '#9A3412' }}>
                                {weekNr(item.week)} | {item.dag === null || item.dag === undefined ? 'Hele week' : dagLabel(item.dag)}
                              </span>
                              <span
                                style={{
                                  borderRadius: 999,
                                  padding: '2px 7px',
                                  fontSize: 10,
                                  fontWeight: 800,
                                  background: item.automatisch ? '#E2E8F0' : '#FED7AA',
                                  color: item.automatisch ? '#334155' : '#9A3412',
                                }}
                              >
                                {item.automatisch ? 'Automatisch' : 'Handmatig'}
                              </span>
                            </div>
                            <div style={{ fontSize: 12, color: item.automatisch ? '#64748B' : '#7C4A2A', marginTop: 3 }}>
                              {item.reden || 'Geen reden ingevuld'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                      gap: 10,
                      marginBottom: 18,
                    }}
                  >
                    {[
                      {
                        titel: 'Capaciteit',
                        accent: '#1D4ED8',
                        regels: [
                          ['Signaal', dashboardData.capaciteitSignaal],
                          [
                            'Beoordeling',
                            dashboardData.capaciteitSignaal === 'Normaal'
                              ? 'binnen startgrens'
                              : dashboardData.capaciteitSignaal === 'Druk'
                                ? 'boven startgrens'
                                : 'mogelijk capaciteitsrisico',
                          ],
                          ['Geregistreerde tijd', `${dashboardData.geregistreerdeTijdMin} min`],
                          ['Open taken', dashboardData.open],
                        ],
                      },
                      {
                        titel: 'Werkdruk',
                        accent: '#166534',
                        regels: [
                          ['Openstaand', dashboardData.open],
                          ['Afgerond', dashboardData.afgerond],
                          ['Vertraagd', dashboardData.vertraagd],
                        ],
                      },
                      {
                        titel: 'Piekindicator',
                        accent:
                          dashboardData.piekSignaal === 'Hoog'
                            ? '#B91C1C'
                            : dashboardData.piekSignaal === 'Verhoogd'
                              ? '#B45309'
                              : '#166534',
                        regels: [
                          ['Status', dashboardData.piekSignaal],
                          ['Belasting', dashboardData.piekRedenen.join(', ') || 'geen opvallende piek'],
                          ['Uitzonderingsritten', dashboardData.uitzonderingsritten],
                          ['Sorteertijd', `${dashboardData.sorteerTijdMin} min`],
                        ],
                      },
                      {
                        titel: 'Service',
                        accent: '#4F46E5',
                        regels: [
                          ['Afrondingsgraad', `${dashboardData.afrondingsgraad}%`],
                          ['Open aanvragen', dashboardData.openAanvragen],
                        ],
                      },
                      {
                        titel: 'Beheersbaarheid',
                        accent: '#0F766E',
                        regels: [
                          ['Registratiegraad', `${dashboardData.registratiegraad}%`],
                          ['Handmatig', dashboardData.handmatig],
                          ['Opvallende belasting', dashboardData.piekRedenen[0] || 'geen'],
                        ],
                      },
                    ].map((blok) => (
                      <div
                        key={blok.titel}
                        style={{
                          background: '#fff',
                          border: '1px solid #E5E9F0',
                          borderRadius: 8,
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ height: 4, background: blok.accent }} />
                        <div style={{ padding: '12px 14px 4px', fontSize: 13, fontWeight: 850, color: '#111827' }}>
                          {blok.titel}
                        </div>
                        <div style={{ padding: '6px 14px 14px', display: 'grid', gap: 8 }}>
                          {blok.regels.map(([label, waarde]) => (
                            <div
                              key={label}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 10,
                                fontSize: 12,
                                color: '#374151',
                              }}
                            >
                              <span>{label}</span>
                              <strong style={{ textAlign: 'right' }}>{waarde}</strong>
                            </div>
                          ))}
                        </div>
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
                      { titel: 'Meest voorkomende taken', items: dashboardData.topTaken },
                      { titel: 'Uitzonderingsritten', items: dashboardData.uitzonderingTypen },
                      { titel: 'Vaak vanaf', items: dashboardData.topVan },
                      { titel: 'Vaak naar', items: dashboardData.topNaar },
                    ].map((blok) => (
                      <Card key={blok.titel}>
                        <CardHead title={blok.titel} />
                        <div style={{ padding: 16, display: 'grid', gap: 9 }}>
                          {blok.items.length === 0 && <div style={{ fontSize: 12, color: '#9CA3AF' }}>Geen gegevens.</div>}
                          {blok.items.map((item) => (
                            <div
                              key={item.label}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr auto',
                                gap: 10,
                                alignItems: 'center',
                                fontSize: 12,
                                color: '#374151',
                              }}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                              <strong
                                style={{
                                  minWidth: 28,
                                  textAlign: 'center',
                                  borderRadius: 999,
                                  background: '#F3F4F6',
                                  color: '#111827',
                                  padding: '2px 8px',
                                }}
                              >
                                {item.aantal}
                              </strong>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

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
                      { l: 'Handmatig toegevoegd', v: rappData.zelf, c: '#1F7A4D' },
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
                          <span style={{ flex: 2, fontWeight: 500, color: '#111827' }}>
                            {taak.titel}
                            {taak.reden ? ` - ${taak.reden}` : ''}
                            {taak.aantal ? ` (${taak.aantal})` : ''}
                            {taak.tijd ? ` - ${taak.tijd} min` : ''}
                          </span>
                          <span style={{ flex: 2, color: '#6B7280' }}>
                            {dagLabel(taak.dag)}
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
                  {helpSubtitel}
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
              {helpItems.map(([titel, tekst]) => (
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
                Kies een taak of typ zelf een titel.
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

      {verlaatAanvraagTab && (
        <div
          onClick={() => setVerlaatAanvraagTab(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,.38)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 245,
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
              maxWidth: 380,
              boxShadow: '0 20px 60px rgba(0,0,0,.15)',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 750, color: '#111827', marginBottom: 6 }}>
              Aanvraag nog niet ingediend
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.45, marginBottom: 16 }}>
              Je hebt al iets ingevuld. Als je nu weggaat, wordt deze aanvraag niet bewaard.
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setVerlaatAanvraagTab(null)}
                style={{
                  flex: 1,
                  minWidth: 140,
                  background: '#EA6A1F',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 13,
                  fontWeight: 650,
                  cursor: 'pointer',
                }}
              >
                Blijven invullen
              </button>
              <button
                type="button"
                onClick={() => {
                  const doel = verlaatAanvraagTab
                  setVerlaatAanvraagTab(null)
                  setAanvraag(standaardAanvraag())
                  setAanvraagOverigVestiging({ van: false, naar: false })
                  setAanvraagEigenTitelActief(false)
                  setZsmBewustGekozen(false)
                  setAanvraagMaand(new Date().toISOString().slice(0, 7))
                  setAanvraagEditId(null)
                  setAanvraagErrors({})
                  setAanvraagBevestigd(false)
                  setTab(doel)
                }}
                style={{
                  flex: 1,
                  minWidth: 140,
                  background: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #E5E9F0',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Toch verlaten
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
                    kiesDagMetWeekendCheck(vandaag(), vandaagDagIndex(), () => {
                      setVerplW(vandaag())
                      setVerplD(vandaagDagIndex())
                      setVerplaatsMaand(new Date().toISOString().slice(0, 7))
                    })
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
                          kiesDagMetWeekendCheck(dag.week, dag.dagIndex, () => {
                            setVerplW(dag.week)
                            setVerplD(dag.dagIndex)
                          })
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
            <div style={{ marginBottom: 18 }}>
              <Label optional>Notitie bij verwijderen</Label>
              <textarea
                value={verwijderNotitie}
                onChange={(e) => setVerwijderNotitie(e.target.value)}
                placeholder="Bijv. dubbel ingevoerd, foutje of niet meer nodig."
                rows={3}
                style={{ ...inp, resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  setBevestigVerwijderen(null)
                  setVerwijderNotitie('')
                }}
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

      {bevestigDefinitiefVerwijderen && (
        <div
          onClick={() => setBevestigDefinitiefVerwijderen(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,.50)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 218,
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
              maxWidth: 410,
              boxShadow: '0 20px 60px rgba(0,0,0,.18)',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, color: '#991B1B', marginBottom: 6 }}>
              Definitief verwijderen?
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.45, marginBottom: 18 }}>
              "{bevestigDefinitiefVerwijderen.item.titel}" wordt echt verwijderd en kan daarna niet meer worden
              teruggehaald.
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => setBevestigDefinitiefVerwijderen(null)}
                style={{
                  flex: 1,
                  minWidth: 140,
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
                onClick={voerDefinitiefVerwijderenUit}
                style={{
                  flex: 1,
                  minWidth: 140,
                  background: '#991B1B',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 0',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Definitief verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {weekendBevestiging && (
        <div
          onClick={() => setWeekendBevestiging(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,.38)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 219,
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
              boxShadow: '0 20px 60px rgba(0,0,0,.16)',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 6 }}>
              Weekend gekozen
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.45, marginBottom: 18 }}>
              Dit is een {DAGEN[weekendBevestiging.dag].toLowerCase()}. Wil je deze taak of aanvraag toch op deze
              weekenddag plannen? Dan wordt deze dag ook zichtbaar in de weekplanning.
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setWeekendBevestiging(null)}
                style={{
                  flex: 1,
                  minWidth: 130,
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
                type="button"
                onClick={() => {
                  const actie = weekendBevestiging.actie
                  setWeekendBevestiging(null)
                  actie()
                }}
                style={{
                  flex: 1,
                  minWidth: 130,
                  background: '#EA6A1F',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 0',
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: 'pointer',
                }}
              >
                Toch plannen
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
                    kiesDagMetWeekendCheck(vandaag(), vandaagDagIndex(), () => {
                      setPlanW(vandaag())
                      setPlanD(vandaagDagIndex())
                      setPlanMaand(new Date().toISOString().slice(0, 7))
                    })
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
                          kiesDagMetWeekendCheck(dag.week, dag.dagIndex, () => {
                            setPlanW(dag.week)
                            setPlanD(dag.dagIndex)
                          })
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
