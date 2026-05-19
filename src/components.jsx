import { AANVRAAG_STATUS, STATUS } from './constants'
import { inp } from './uiStyles'
import { maandLabel, verschuifMaand } from './utils'

export function MonthNav({ value, onChange, min }) {
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

export function YearNav({ value, onChange, min }) {
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

export function Pill({ status }) {
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

export function AanvraagPill({ status }) {
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

export function Btn({ onClick, children, variant, size = 'compact' }) {
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

export function Label({ children, required = false, optional = false }) {
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

export function FieldError({ children }) {
  if (!children) return null

  return <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 4 }}>{children}</div>
}

export function EducatieImportLayout({
  breedFormGrid,
  educatieImport,
  educatieImportKlaar,
  educatieMelding,
  isMobiel,
  setEducatieImport,
  setEducatieMelding,
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: breedFormGrid, gap: isMobiel ? 12 : 18 }}>
      <Card>
        <CardHead title="Import schoollijsten" sub="Voor lijsten van Educatie per schooljaar en periode" />
        <div style={{ padding: isMobiel ? 12 : 16, display: 'grid', gap: 12 }}>
          <div
            style={{
              background: '#F8F9FC',
              border: '1px solid #E5E9F0',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 12,
              color: '#6B7280',
              lineHeight: 1.45,
            }}
          >
            Deze import is alvast klaargezet. Zodra het voorbeeldbestand bekend is, wordt de Excel-verwerking gekoppeld.
          </div>
          <div>
            <Label required>Schooljaar</Label>
            <input
              value={educatieImport.schooljaar}
              onChange={(e) => {
                setEducatieImport((prev) => ({ ...prev, schooljaar: e.target.value }))
                setEducatieMelding('')
              }}
              placeholder="Bijv. 2026-2027"
              style={inp}
            />
          </div>
          <div>
            <Label required>Periode</Label>
            <input
              value={educatieImport.periode}
              onChange={(e) => {
                setEducatieImport((prev) => ({ ...prev, periode: e.target.value }))
                setEducatieMelding('')
              }}
              placeholder="Bijv. Periode 1"
              style={inp}
            />
          </div>
          <div>
            <Label>Excel bestand</Label>
            <label
              style={{
                border: '1px dashed #CBD5E1',
                borderRadius: 10,
                padding: '18px 14px',
                background: '#FCFCFD',
                display: 'grid',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                {educatieImport.bestandNaam || 'Kies Excelbestand'}
              </span>
              <span style={{ fontSize: 12, color: '#6B7280' }}>
                Ondersteuning voor .xlsx/.xls wordt gekoppeld zodra de lijst bekend is.
              </span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const bestand = e.target.files?.[0]
                  setEducatieImport((prev) => ({ ...prev, bestandNaam: bestand?.name || '' }))
                  setEducatieMelding('')
                }}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <button
            type="button"
            disabled={!educatieImportKlaar}
            onClick={() => {
              if (!educatieImportKlaar) return
              setEducatieMelding('Bestand staat klaar. Zodra het voorbeeldbestand bekend is, wordt de echte import hieraan gekoppeld.')
            }}
            style={{
              background: educatieImportKlaar ? '#1F7A4D' : '#E5E7EB',
              color: educatieImportKlaar ? '#fff' : '#9CA3AF',
              border: 'none',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: 700,
              cursor: educatieImportKlaar ? 'pointer' : 'not-allowed',
            }}
          >
            Import voorbereiden
          </button>
          {educatieMelding && (
            <div
              style={{
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 12,
                color: '#065F46',
                lineHeight: 1.4,
              }}
            >
              {educatieMelding}
            </div>
          )}
        </div>
      </Card>
      <Card>
        <CardHead title="Wat gebeurt hier straks?" />
        <div style={{ padding: isMobiel ? 12 : 16, display: 'grid', gap: 10 }}>
          {[
            'Excelbestand lezen',
            'Rijen controleren',
            'Taken of aanvragen klaarzetten',
            'Daarna pas definitief toevoegen',
          ].map((stap, index) => (
            <div
              key={stap}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                padding: '10px 12px',
                border: '1px solid #E5E9F0',
                borderRadius: 8,
                background: '#fff',
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#ECFDF5',
                  color: '#166534',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </span>
              <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{stap}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export function EducatieProjectenLayout({ isMobiel }) {
  return (
    <Card>
      <CardHead title="Projecten" />
      <div style={{ padding: isMobiel ? 18 : 24, display: 'grid', gap: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
          Nog geen projecten toegevoegd
        </div>
        <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.45, maxWidth: 560 }}>
          Dit onderdeel staat alvast klaar. Later kunnen hier losse educatieprojecten of handmatige projectaanvragen worden toegevoegd.
        </div>
      </div>
    </Card>
  )
}

export function DrukteWaarschuwing({ waarschuwing, compact = false }) {
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

export function ZelfdeVestigingWaarschuwing({ van, naar }) {
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

export function Card({ children, style }) {
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

export function CardHead({ title, sub }) {
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
