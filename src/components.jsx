import { AANVRAAG_STATUS, DAGEN_KORT, STATUS, VESTIGINGEN } from './constants'
import { leesEducatieExcel } from './educatieImport'
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
  educatieLijsten,
  educatieMelding,
  isMobiel,
  onDeleteList,
  onDeleteRow,
  onEditList,
  onImportRows,
  onUpdateRow,
  setEducatieImport,
  setEducatieMelding,
}) {
  const rijen = educatieImport.rijen || []
  const isBewerking = Boolean(educatieImport.editId)

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
            Kies het Excelbestand. De app toont eerst een controlelijst; daarna sla je alles op als één Educatie lijst.
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
                Geschikt voor de lijsten Brengen Bert en Brengen kinderopvang.
              </span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={async (e) => {
                  const bestand = e.target.files?.[0]
                  setEducatieMelding('')
                  if (!bestand) {
                    setEducatieImport((prev) => ({ ...prev, bestandNaam: '', rijen: [] }))
                    return
                  }
                  try {
                    const gelezenRijen = await leesEducatieExcel(bestand)
                    setEducatieImport((prev) => ({
                      ...prev,
                      bestandNaam: bestand.name,
                      rijen: gelezenRijen,
                    }))
                    setEducatieMelding(
                      gelezenRijen.length
                        ? `${gelezenRijen.length} regels gevonden. Controleer de lijst en voeg daarna toe.`
                        : 'Geen herkenbare regels gevonden in dit bestand.',
                    )
                  } catch (error) {
                    console.error('Educatiebestand kon niet worden gelezen.', error)
                    setEducatieImport((prev) => ({ ...prev, bestandNaam: bestand.name, rijen: [] }))
                    setEducatieMelding('Dit Excelbestand kon niet worden gelezen.')
                  }
                }}
                style={{ display: 'none' }}
              />
            </label>
            {educatieImport.bestandNaam && (
              <button
                type="button"
                onClick={() => {
                  setEducatieImport((prev) => ({ ...prev, bestandNaam: '', rijen: [] }))
                  setEducatieMelding('Excelbestand verwijderd uit deze import.')
                }}
                style={{
                  marginTop: 8,
                  border: '1px solid #FECACA',
                  background: '#FEF2F2',
                  color: '#991B1B',
                  borderRadius: 8,
                  padding: '7px 10px',
                  fontSize: 12,
                  fontWeight: 650,
                  cursor: 'pointer',
                }}
              >
                Excelbestand verwijderen
              </button>
            )}
          </div>
          <div>
            <Label>Extra toelichting</Label>
            <textarea
              value={educatieImport.toelichting || ''}
              onChange={(e) => {
                setEducatieImport((prev) => ({ ...prev, toelichting: e.target.value }))
                setEducatieMelding('')
              }}
              placeholder="Bijv. bijzonderheden over deze Educatie lijst."
              rows={3}
              style={{ ...inp, resize: 'vertical' }}
            />
          </div>
          {rijen.length > 0 && (
            <div
              style={{
                border: '1px solid #E5E9F0',
                borderRadius: 10,
                overflow: 'hidden',
                background: '#fff',
              }}
            >
              <div
                style={{
                  padding: '9px 11px',
                  background: '#F8F9FC',
                  borderBottom: '1px solid #E5E9F0',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#374151',
                }}
              >
                Controlelijst ({rijen.length})
              </div>
              <div style={{ display: 'grid', maxHeight: 260, overflow: 'auto' }}>
                {rijen.map((item, index) => (
                  <div
                    key={`${item.sheet}-${item.rij}-${index}`}
                    style={{
                      padding: '9px 11px',
                      borderBottom: index === rijen.length - 1 ? 'none' : '1px solid #F1F5F9',
                      display: 'grid',
                      gap: 2,
                    }}
                  >
                    <div style={{ display: 'grid', gap: 6 }}>
                      <input
                        value={item.titelWeergave || ''}
                        onChange={(e) => onUpdateRow(item.id, 'titelWeergave', e.target.value)}
                        style={{ ...inp, fontSize: 12, minHeight: 34 }}
                        aria-label="Titel educatieregel"
                      />
                      <input
                        value={item.bestemming || ''}
                        onChange={(e) => onUpdateRow(item.id, 'bestemming', e.target.value)}
                        placeholder="Bestemming"
                        style={{ ...inp, fontSize: 12, minHeight: 34 }}
                        aria-label="Bestemming educatieregel"
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                        <div style={{ fontSize: 11, color: '#6B7280' }}>
                          {item.groep ? `Groep ${item.groep}` : item.type || 'Educatie'}
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteRow(item.id)}
                          style={{
                            border: '1px solid #FECACA',
                            background: '#FEF2F2',
                            color: '#991B1B',
                            borderRadius: 7,
                            padding: '5px 8px',
                            fontSize: 11,
                            fontWeight: 650,
                            cursor: 'pointer',
                          }}
                        >
                          Verwijder regel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            type="button"
            disabled={!educatieImportKlaar}
            onClick={() => {
              if (!educatieImportKlaar) return
              onImportRows()
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
            {isBewerking ? 'Lijst opslaan' : 'Educatie lijst opslaan'}
          </button>
          {isBewerking && (
            <button
              type="button"
              onClick={() => {
                setEducatieImport({ editId: null, schooljaar: '', periode: '', bestandNaam: '', toelichting: '', rijen: [] })
                setEducatieMelding('')
              }}
              style={{
                background: '#F3F4F6',
                color: '#374151',
                border: '1px solid #E5E9F0',
                borderRadius: 8,
                padding: '9px 12px',
                fontSize: 12,
                fontWeight: 650,
                cursor: 'pointer',
              }}
            >
              Bewerken annuleren
            </button>
          )}
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
        <CardHead title="Educatie lijsten" sub={`${educatieLijsten.length} lijst(en)`} />
        <div style={{ padding: isMobiel ? 12 : 16, display: 'grid', gap: 10 }}>
          {educatieLijsten.length === 0 && (
            <div style={{ color: '#9CA3AF', fontSize: 13, padding: '10px 2px' }}>Nog geen Educatie lijsten.</div>
          )}
          {educatieLijsten.map((lijst) => (
            <div
              key={lijst.id}
              style={{
                padding: '10px 12px',
                border: '1px solid #E5E9F0',
                borderRadius: 8,
                background: '#fff',
                display: 'grid',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{lijst.titel || 'Educatie lijst'}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                    {lijst.schooljaar} | {lijst.periode} | {(lijst.rijen || []).length} regels
                  </div>
                  {lijst.toelichting && (
                    <div style={{ fontSize: 12, color: '#374151', marginTop: 4 }}>{lijst.toelichting}</div>
                  )}
                  {lijst.status === 'ingepland' && (
                    <div style={{ fontSize: 11, color: '#065F46', marginTop: 3, fontWeight: 650 }}>Ingepland</div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => onEditList(lijst)}
                  style={{
                    border: '1px solid #E5E9F0',
                    background: '#F3F4F6',
                    color: '#374151',
                    borderRadius: 7,
                    padding: '6px 10px',
                    fontSize: 11,
                    fontWeight: 650,
                    cursor: 'pointer',
                  }}
                >
                  Bewerken
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Definitief verwijderen? Deze Educatie lijst kan niet meer worden teruggehaald.')) onDeleteList(lijst.id)
                  }}
                  style={{
                    border: '1px solid #FECACA',
                    background: '#FEF2F2',
                    color: '#991B1B',
                    borderRadius: 7,
                    padding: '6px 10px',
                    fontSize: 11,
                    fontWeight: 650,
                    cursor: 'pointer',
                  }}
                >
                  Verwijderen
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export function EducatieProjectenLayout({
  educatieProjectForm,
  educatieProjecten,
  isMobiel,
  onDeleteProject,
  onEditProject,
  onSaveProjecten,
  projectMelding,
  setEducatieProjectForm,
  setProjectMelding,
}) {
  const locatieOpties = ['School 7 Educatie', ...VESTIGINGEN]
  const projectKlaar =
    educatieProjectForm.van &&
    educatieProjectForm.naar &&
    educatieProjectForm.naam.trim()

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobiel ? '1fr' : 'minmax(0, 1.2fr) minmax(320px, .8fr)', gap: isMobiel ? 12 : 18 }}>
      <Card>
        <CardHead title="Projecten" sub="Handmatig invoeren" />
        <div style={{ padding: isMobiel ? 12 : 16, display: 'grid', gap: 12 }}>
          <div>
            <Label required>Naam project</Label>
            <input
              value={educatieProjectForm.naam}
              onChange={(e) => {
                setEducatieProjectForm((prev) => ({ ...prev, naam: e.target.value }))
                setProjectMelding('')
              }}
              placeholder="Bijv. Kinderboekenweek"
              style={inp}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobiel ? '1fr' : '1fr 1fr', gap: 10 }}>
            <div>
              <Label>Week uitvoeren</Label>
              <input
                type="week"
                value={educatieProjectForm.week}
                onChange={(e) => setEducatieProjectForm((prev) => ({ ...prev, week: e.target.value }))}
                style={inp}
              />
            </div>
            <div>
              <Label>Dag</Label>
              <select
                value={educatieProjectForm.dag}
                disabled={!educatieProjectForm.week}
                onChange={(e) => setEducatieProjectForm((prev) => ({ ...prev, dag: e.target.value }))}
                style={{ ...inp, background: educatieProjectForm.week ? '#fff' : '#F9FAFB' }}
              >
                <option value="flexibel">{educatieProjectForm.week ? 'Flexibel in die week' : 'Eerst week kiezen'}</option>
                {DAGEN_KORT.map((dag, index) => (
                  <option key={dag} value={index}>{dag}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobiel ? '1fr' : '1fr 1fr', gap: 10 }}>
            <div>
              <Label required>Van locatie</Label>
              <select
                value={educatieProjectForm.van}
                onChange={(e) => setEducatieProjectForm((prev) => ({ ...prev, van: e.target.value }))}
                style={inp}
              >
                {locatieOpties.map((locatie) => <option key={locatie} value={locatie}>{locatie}</option>)}
              </select>
            </div>
            <div>
              <Label required>Naar locatie</Label>
              <select
                value={educatieProjectForm.naar}
                onChange={(e) => setEducatieProjectForm((prev) => ({ ...prev, naar: e.target.value }))}
                style={inp}
              >
                <option value="">Kies...</option>
                {locatieOpties.map((locatie) => <option key={locatie} value={locatie}>{locatie}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label>Extra toelichting</Label>
            <textarea
              value={educatieProjectForm.toelichting}
              onChange={(e) => setEducatieProjectForm((prev) => ({ ...prev, toelichting: e.target.value }))}
              placeholder="Bijv. bijzonderheden voor transport."
              rows={3}
              style={{ ...inp, resize: 'vertical' }}
            />
          </div>

          <button
            type="button"
            disabled={!projectKlaar}
            onClick={onSaveProjecten}
            style={{
              background: projectKlaar ? '#1F7A4D' : '#E5E7EB',
              color: projectKlaar ? '#fff' : '#9CA3AF',
              border: 'none',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: 700,
              cursor: projectKlaar ? 'pointer' : 'not-allowed',
            }}
          >
            {educatieProjectForm.editId ? 'Projectlijst opslaan' : 'Projectlijst toevoegen'}
          </button>
          {educatieProjectForm.editId && (
            <button
              type="button"
              onClick={() => {
                setEducatieProjectForm({
                  mode: 'handmatig',
                  editId: null,
                  naam: '',
                  bestandNaam: '',
                  week: '',
                  dag: 'flexibel',
                  van: 'School 7 Educatie',
                  naar: '',
                  toelichting: '',
                })
                setProjectMelding('')
              }}
              style={{
                background: '#F3F4F6',
                color: '#374151',
                border: '1px solid #E5E9F0',
                borderRadius: 8,
                padding: '9px 12px',
                fontSize: 12,
                fontWeight: 650,
                cursor: 'pointer',
              }}
            >
              Bewerken annuleren
            </button>
          )}
          {projectMelding && (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#065F46' }}>
              {projectMelding}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHead title="Toegevoegde projectlijsten" sub={`${educatieProjecten.length} lijst(en)`} />
        <div style={{ padding: isMobiel ? 12 : 16, display: 'grid', gap: 10 }}>
          {educatieProjecten.length === 0 && (
            <div style={{ color: '#9CA3AF', fontSize: 13, padding: '10px 2px' }}>Nog geen projectlijsten toegevoegd.</div>
          )}
          {educatieProjecten.map((project) => (
            <div key={project.id} style={{ border: '1px solid #E5E9F0', borderRadius: 8, padding: '10px 12px', display: 'grid', gap: 7 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                {project.titel || project.naam || project.bestandNaam || 'Projectlijst'}
              </div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>
                {project.geplandeWeek || project.week
                  ? `${project.geplandeWeek || project.week} | ${(project.geplandeDag ?? project.dag) === null || (project.geplandeDag ?? project.dag) === undefined ? 'hele week' : DAGEN_KORT[Number(project.geplandeDag ?? project.dag)]} | `
                  : 'Nog niet ingepland | '}
                {project.van} naar {project.naar}
              </div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>
                {(project.projecten || [{ naam: project.naam }]).filter((item) => item?.naam).length} regel(s)
                {project.status ? ` | ${project.status}` : ''}
              </div>
              {project.toelichting && <div style={{ fontSize: 12, color: '#374151' }}>{project.toelichting}</div>}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => onEditProject(project)}
                  style={{
                    border: '1px solid #E5E9F0',
                    background: '#F3F4F6',
                    color: '#374151',
                    borderRadius: 7,
                    padding: '6px 10px',
                    fontSize: 11,
                    fontWeight: 650,
                    cursor: 'pointer',
                  }}
                >
                  Bewerken
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Project verwijderen?')) onDeleteProject(project.id)
                  }}
                  style={{
                    border: '1px solid #FECACA',
                    background: '#FEF2F2',
                    color: '#991B1B',
                    borderRadius: 7,
                    padding: '6px 10px',
                    fontSize: 11,
                    fontWeight: 650,
                    cursor: 'pointer',
                  }}
                >
                  Verwijderen
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export function DrukteWaarschuwing({ waarschuwing, compact = false }) {
  if (!waarschuwing) return null
  const lijstDrukte = waarschuwing.educatie || waarschuwing.project
  const kleuren = lijstDrukte
    ? { bg: '#ECFDF5', border: '#A7F3D0', color: '#065F46' }
    : { bg: '#FFF7ED', border: '#FED7AA', color: '#92400E' }

  return (
    <div
      style={{
        background: kleuren.bg,
        border: `1px solid ${kleuren.border}`,
        borderRadius: 8,
        padding: compact ? '7px 9px' : '9px 11px',
        fontSize: 12,
        color: kleuren.color,
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
