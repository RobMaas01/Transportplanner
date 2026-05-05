import { AANVRAAG_STATUS, STATUS } from './constants'
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
