import { useEffect, useState } from 'react'
import './App.css'

const PIN_L = '1234'
const PIN_T = '5678'

const VESTIGINGEN = [
  'Den Helder Centrum',
  'Den Helder Noord',
  'Den Helder Zuid',
  'Den Helder Oost',
  'Schagen Centrum',
  'Schagen Noord',
  'Anna Paulowna',
  'Callantsoog',
  'Tuitjenhorn',
  'Heerhugowaard Centrum',
  'Heerhugowaard Zuid',
  'Heerhugowaard Noord',
  'Alkmaar Centrum',
  'Alkmaar Noord',
  'Alkmaar Zuid',
  'Alkmaar Oost',
  'Alkmaar West',
  'Hollands Kroon',
  'Niedorp',
]

const STATUS = {
  gepland: { label: 'Gepland', bg: '#EEF4FF', color: '#2255CC', dot: '#4477EE' },
  onderweg: { label: 'Onderweg', bg: '#FFF7EC', color: '#B45309', dot: '#F59E0B' },
  afgerond: { label: 'Afgerond', bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  verplaatst: { label: 'Verplaatst', bg: '#F3F4F6', color: '#374151', dot: '#9CA3AF' },
}

const DAGEN = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag']
const DAGEN_KORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr']

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

function weekDagen(wk) {
  const ma = getMaandag(wk)
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(ma)
    d.setDate(ma.getDate() + i)
    return d
  })
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

function vandaag() {
  return getWeekKey(new Date())
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

function Btn({ onClick, children, variant }) {
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
        borderRadius: 7,
        padding: '5px 11px',
        fontSize: 11,
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function Label({ children }) {
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
      {children}
    </label>
  )
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
  const WEKEN = maakWeken(vandaag(), 20)

  const [rol, setRol] = useState(null)
  const [pin, setPin] = useState('')
  const [pinErr, setPinErr] = useState('')
  const [tab, setTab] = useState('planning')
  const [taken, setTaken] = useState([])
  const [geblokt, setGeblokt] = useState([])
  const [week, setWeek] = useState(vandaag())
  const [meld, setMeld] = useState([])
  const [klaar, setKlaar] = useState(false)

  const [nieuw, setNieuw] = useState({
    titel: '',
    omschrijving: '',
    van: '',
    naar: '',
    week: vandaag(),
    dag: 0,
    prioriteit: 'normaal',
  })
  const [blokForm, setBlokForm] = useState({ week: '', reden: '' })
  const [modal, setModal] = useState(null)
  const [verplW, setVerplW] = useState('')
  const [verplD, setVerplD] = useState(0)
  const [rapp, setRapp] = useState({
    type: 'week',
    week: vandaag(),
    maand: new Date().toISOString().slice(0, 7),
  })
  const [rappData, setRappData] = useState(null)

  useEffect(() => {
    try {
      const savedTaken = localStorage.getItem('t5')
      const savedGeblokt = localStorage.getItem('g5')
      const savedMeld = localStorage.getItem('m5')

      if (savedTaken) setTaken(JSON.parse(savedTaken))
      if (savedGeblokt) setGeblokt(JSON.parse(savedGeblokt))
      if (savedMeld) setMeld(JSON.parse(savedMeld))
    } catch (error) {
      console.error('Lokale opslag kon niet worden geladen.', error)
    }

    setKlaar(true)
  }, [])

  useEffect(() => {
    if (klaar) localStorage.setItem('t5', JSON.stringify(taken))
  }, [taken, klaar])

  useEffect(() => {
    if (klaar) localStorage.setItem('g5', JSON.stringify(geblokt))
  }, [geblokt, klaar])

  useEffect(() => {
    if (klaar) localStorage.setItem('m5', JSON.stringify(meld))
  }, [meld, klaar])

  function login() {
    if (pin === PIN_L) {
      setRol('leidinggevende')
      setPinErr('')
    } else if (pin === PIN_T) {
      setRol('transporteur')
      setPinErr('')
    } else {
      setPinErr('Onjuiste pincode.')
    }
    setPin('')
  }

  function voegToe() {
    if (!nieuw.titel) return

    setTaken((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        ...nieuw,
        status: 'gepland',
        aangemaakt: new Date().toISOString(),
        door: rol,
        bron: rol === 'transporteur' ? 'zelf' : 'leidinggevende',
        log: [{ a: 'aangemaakt', d: rol, w: new Date().toISOString() }],
      },
    ])

    setNieuw({
      titel: '',
      omschrijving: '',
      van: '',
      naar: '',
      week,
      dag: 0,
      prioriteit: 'normaal',
    })
  }

  function updStatus(id, status) {
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

    setModal(null)
  }

  function blokkeer() {
    if (!blokForm.week || geblokt.find((item) => item.week === blokForm.week)) return
    setGeblokt((prev) => [...prev, { ...blokForm }])
    setBlokForm({ week: '', reden: '' })
  }

  function isGeblokt(wk) {
    return Boolean(geblokt.find((item) => item.week === wk))
  }

  function nieuweM() {
    return meld.filter((item) => !item.gelezen).length
  }

  function leesM() {
    setMeld((prev) => prev.map((item) => ({ ...item, gelezen: true })))
  }

  function genRapport() {
    let filtered = taken

    if (rapp.type === 'week') {
      filtered = taken.filter((taak) => taak.week === rapp.week)
    } else {
      const [jr, mn] = rapp.maand.split('-').map(Number)
      filtered = taken.filter((taak) => {
        const ma = getMaandag(taak.week)
        return ma.getFullYear() === jr && ma.getMonth() + 1 === mn
      })
    }

    const ps = {}
    Object.keys(STATUS).forEach((status) => {
      ps[status] = filtered.filter((taak) => taak.status === status).length
    })

    setRappData({
      taken: filtered,
      ps,
      ld: filtered.filter((taak) => taak.bron === 'leidinggevende').length,
      zelf: filtered.filter((taak) => taak.bron === 'zelf').length,
      totaal: filtered.length,
    })
  }

  const navTabs =
    rol === 'leidinggevende'
      ? [
          { k: 'planning', l: 'Planning' },
          { k: 'taken', l: 'Taken' },
          { k: 'blokkeer', l: 'Weken blokkeren' },
          { k: 'rapportage', l: 'Rapportage' },
        ]
      : [
          { k: 'planning', l: 'Planning' },
          { k: 'taken', l: 'Taak toevoegen' },
          { k: 'rapportage', l: 'Rapportage' },
        ]

  const pagina = {
    planning: 'Weekplanning',
    taken: rol === 'leidinggevende' ? 'Opdrachten beheren' : 'Taak toevoegen',
    blokkeer: 'Weken blokkeren',
    rapportage: 'Rapportage',
  }

  if (!klaar) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 500,
          color: '#9CA3AF',
          fontSize: 13,
        }}
      >
        Laden...
      </div>
    )
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
            padding: 36,
            width: '100%',
            maxWidth: 320,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: '#2563EB',
                borderRadius: 12,
                margin: '0 auto 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>Transportplanner</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
              Bibliotheek Kop van Noord-Holland
            </div>
          </div>
          <Label>Pincode</Label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') login()
            }}
            placeholder="Voer uw pincode in"
            style={{ ...inp, marginBottom: 10 }}
          />
          {pinErr && <div style={{ fontSize: 12, color: '#DC2626', marginBottom: 8 }}>{pinErr}</div>}
          <button
            onClick={login}
            style={{
              width: '100%',
              background: '#2563EB',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 0',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Inloggen
          </button>
          <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 14 }}>
            Leidinggevende: 1234 | Transporteur: 5678
          </div>
        </div>
      </div>
    )
  }

  const dagData = weekDagen(week)
  const weekTaken = taken.filter((taak) => taak.week === week)
  const gebloktNu = isGeblokt(week)

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
          background: '#1E2433',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '22px 18px 16px', borderBottom: '1px solid #2D3448' }}>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Transportplanner</div>
          <div style={{ color: '#8892A4', fontSize: 11, marginTop: 3 }}>Bibliotheek KNH</div>
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
                color: tab === item.k ? '#fff' : '#8892A4',
                background: tab === item.k ? '#2563EB' : 'transparent',
              }}
            >
              {item.l}
            </div>
          ))}
        </nav>
        <div style={{ padding: '12px 10px', borderTop: '1px solid #2D3448' }}>
          <div style={{ background: '#2D3448', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
            <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
              {rol === 'leidinggevende' ? 'Leidinggevende' : 'Transporteur'}
            </div>
            <div style={{ color: '#8892A4', fontSize: 11, marginTop: 2 }}>Ingelogd</div>
          </div>
          <button
            onClick={() => {
              setRol(null)
              setTab('planning')
            }}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid #2D3448',
              color: '#8892A4',
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
              {tab === 'planning' ? weekRange(week) : 'Bibliotheek Kop van Noord-Holland'}
            </div>
          </div>
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
        </div>

        <div style={{ padding: 20, flex: 1, overflowY: 'auto' }}>
          {tab === 'planning' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Week:</span>
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
                      {weekNr(wk)} - {weekRange(wk)}
                    </option>
                  ))}
                </select>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['gepland', 'onderweg', 'afgerond'].map((status) => {
                    const m = STATUS[status]
                    const cnt = weekTaken.filter((taak) => taak.status === status).length

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
                  <span style={{ fontSize: 15 }}>Slot</span>
                  <span style={{ fontSize: 13, color: '#92400E' }}>
                    <strong>Geblokkeerde week</strong> -{' '}
                    {geblokt.find((item) => item.week === week)?.reden || 'geen reden opgegeven'}
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
                                {taak.prioriteit === 'hoog' && (
                                  <span style={{ fontSize: 9, color: '#D97706', fontWeight: 600 }}>Hoog</span>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: 3, marginTop: 5, flexWrap: 'wrap' }}>
                                {rol === 'transporteur' && taak.status === 'gepland' && (
                                  <Btn variant="primary" onClick={() => updStatus(taak.id, 'onderweg')}>
                                    Start
                                  </Btn>
                                )}
                                {rol === 'transporteur' && taak.status === 'onderweg' && (
                                  <Btn variant="success" onClick={() => updStatus(taak.id, 'afgerond')}>
                                    Klaar
                                  </Btn>
                                )}
                                {rol === 'transporteur' &&
                                  (taak.status === 'gepland' || taak.status === 'verplaatst') && (
                                    <Btn
                                      variant="ghost"
                                      onClick={() => {
                                        setModal(taak)
                                        setVerplW(week)
                                        setVerplD(0)
                                      }}
                                    >
                                      Verplaats
                                    </Btn>
                                  )}
                                {rol === 'leidinggevende' && (
                                  <Btn variant="danger" onClick={() => setTaken((prev) => prev.filter((x) => x.id !== taak.id))}>
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
            </div>
          )}

          {tab === 'taken' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
              <Card>
                <CardHead title={rol === 'leidinggevende' ? 'Nieuwe opdracht' : 'Taak toevoegen'} />
                <div style={{ padding: 18, display: 'grid', gap: 12 }}>
                  <div>
                    <Label>Titel *</Label>
                    <input
                      value={nieuw.titel}
                      onChange={(e) => setNieuw((prev) => ({ ...prev, titel: e.target.value }))}
                      placeholder="Bijv. Boeken transporteren"
                      style={inp}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
                  </div>
                  <div>
                    <Label>Omschrijving</Label>
                    <textarea
                      value={nieuw.omschrijving}
                      onChange={(e) => setNieuw((prev) => ({ ...prev, omschrijving: e.target.value }))}
                      placeholder="Optionele toelichting..."
                      rows={2}
                      style={{ ...inp, resize: 'vertical' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div>
                      <Label>Week</Label>
                      <select
                        value={nieuw.week}
                        onChange={(e) => setNieuw((prev) => ({ ...prev, week: e.target.value }))}
                        style={inp}
                      >
                        {WEKEN.map((wk) => (
                          <option key={wk} value={wk}>
                            {weekNr(wk)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Dag</Label>
                      <select
                        value={nieuw.dag}
                        onChange={(e) => setNieuw((prev) => ({ ...prev, dag: Number(e.target.value) }))}
                        style={inp}
                      >
                        {DAGEN.map((dag, i) => (
                          <option key={dag} value={i}>
                            {dag}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Prioriteit</Label>
                      <select
                        value={nieuw.prioriteit}
                        onChange={(e) => setNieuw((prev) => ({ ...prev, prioriteit: e.target.value }))}
                        style={inp}
                      >
                        <option value="normaal">Normaal</option>
                        <option value="hoog">Hoog</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={voegToe}
                    style={{
                      background: '#2563EB',
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
                    Taak toevoegen
                  </button>
                </div>
              </Card>

              <Card>
                <CardHead title="Alle taken" sub={`${taken.length} totaal`} />
                <div style={{ maxHeight: 440, overflowY: 'auto' }}>
                  {taken.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>
                      Nog geen taken.
                    </div>
                  )}
                  {taken
                    .slice()
                    .reverse()
                    .map((taak) => (
                      <div
                        key={taak.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 18px',
                          borderBottom: '1px solid #F3F4F6',
                          gap: 10,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{taak.titel}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                            {weekNr(taak.week)} | {DAGEN[taak.dag]} |{' '}
                            {taak.bron === 'leidinggevende' ? 'Opdracht' : 'Eigen'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Pill status={taak.status} />
                          {rol === 'leidinggevende' && (
                            <Btn variant="danger" onClick={() => setTaken((prev) => prev.filter((x) => x.id !== taak.id))}>
                              X
                            </Btn>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            </div>
          )}

          {tab === 'blokkeer' && rol === 'leidinggevende' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
              <Card>
                <CardHead title="Week blokkeren" />
                <div style={{ padding: 18, display: 'grid', gap: 12 }}>
                  <div>
                    <Label>Week</Label>
                    <select
                      value={blokForm.week}
                      onChange={(e) => setBlokForm((prev) => ({ ...prev, week: e.target.value }))}
                      style={inp}
                    >
                      <option value="">Kies week...</option>
                      {WEKEN.map((wk) => (
                        <option key={wk} value={wk}>
                          {weekNr(wk)} - {weekRange(wk)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Reden</Label>
                    <input
                      value={blokForm.reden}
                      onChange={(e) => setBlokForm((prev) => ({ ...prev, reden: e.target.value }))}
                      placeholder="bijv. Zomervakantie"
                      style={inp}
                    />
                  </div>
                  <button
                    onClick={blokkeer}
                    style={{
                      background: '#2563EB',
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
                    Week blokkeren
                  </button>
                </div>
              </Card>

              <Card>
                <CardHead title="Geblokkeerde weken" sub={`${geblokt.length} weken`} />
                <div style={{ padding: 16 }}>
                  {geblokt.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 24, color: '#9CA3AF', fontSize: 13 }}>
                      Geen geblokkeerde weken.
                    </div>
                  )}
                  {geblokt.map((item) => (
                    <div
                      key={item.week}
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
                        </div>
                        {item.reden && <div style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>{item.reden}</div>}
                      </div>
                      <Btn variant="ghost" onClick={() => setGeblokt((prev) => prev.filter((x) => x.week !== item.week))}>
                        Deblokkeer
                      </Btn>
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
                    {['week', 'maand'].map((type) => (
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
                        {type === 'week' ? 'Per week' : 'Per maand'}
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
                          {weekNr(wk)} - {weekRange(wk)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="month"
                      value={rapp.maand}
                      onChange={(e) => setRapp((prev) => ({ ...prev, maand: e.target.value }))}
                      style={{ ...inp, width: 'auto', padding: '7px 12px' }}
                    />
                  )}
                  <button
                    onClick={genRapport}
                    style={{
                      background: '#2563EB',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 18px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Genereer rapport
                  </button>
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
                      { l: 'Onderweg', v: rappData.ps.onderweg, c: '#B45309' },
                      { l: 'Opdrachten', v: rappData.ld, c: '#111827' },
                      { l: 'Eigen taken', v: rappData.zelf, c: '#7C3AED' },
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
                            {taak.bron === 'leidinggevende' ? 'Opdracht' : 'Eigen'}
                          </span>
                          <Pill status={taak.status} />
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
              maxWidth: 340,
              boxShadow: '0 20px 60px rgba(0,0,0,.15)',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Taak verplaatsen</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 18 }}>"{modal.titel}"</div>
            <div style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
              <div>
                <Label>Naar week</Label>
                <select value={verplW} onChange={(e) => setVerplW(e.target.value)} style={inp}>
                  <option value="">Kies week...</option>
                  {WEKEN.map((wk) => (
                    <option key={wk} value={wk}>
                      {weekNr(wk)} - {weekRange(wk)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Dag</Label>
                <select value={verplD} onChange={(e) => setVerplD(Number(e.target.value))} style={inp}>
                  {DAGEN.map((dag, i) => (
                    <option key={dag} value={i}>
                      {dag}
                    </option>
                  ))}
                </select>
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
    </div>
  )
}
