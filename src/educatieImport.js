import * as XLSX from 'xlsx'

function schoon(value) {
  return String(value ?? '').trim()
}

function sleutel(value) {
  return schoon(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function cel(row, headers, namen) {
  const keys = namen.map(sleutel)
  const index = headers.findIndex((header) => keys.includes(sleutel(header)))
  return index >= 0 ? schoon(row[index]) : ''
}

function vindHeaderRij(rows) {
  return rows.findIndex((row) => {
    const headers = row.map(sleutel)
    return (
      (headers.includes('soort') && (headers.includes('school') || headers.includes('speelzalen'))) ||
      (headers.includes('titel') && headers.includes('speelzalen') && headers.includes('afhaallocatie'))
    )
  })
}

function bestemmingLabel(item) {
  const naam = item.school || item.speelzaal
  if (!naam) return item.plaats || item.afhaallocatie || ''
  const plaats = item.plaats || item.afhaallocatie
  return plaats ? `${naam} (${plaats})` : naam
}

function titelLabel(item) {
  const onderwerp = item.thema || item.titel
  if (item.soort && onderwerp) return `${item.soort} - ${onderwerp}`
  return item.soort || onderwerp || 'Educatie'
}

export function leesEducatieExcel(bestand) {
  return bestand.arrayBuffer().then((buffer) => {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const rijen = []

    workbook.SheetNames.forEach((sheetNaam) => {
      const sheet = workbook.Sheets[sheetNaam]
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
      const headerIndex = vindHeaderRij(rows)
      if (headerIndex < 0) return

      const headers = rows[headerIndex].map(schoon)
      const isKinderopvang = headers.map(sleutel).includes('speelzalen')

      rows.slice(headerIndex + 1).forEach((row, index) => {
        const item = {
          soort: cel(row, headers, ['Soort']) || (isKinderopvang ? schoon(row[0]) : ''),
          thema: cel(row, headers, ['Thema']),
          titel: cel(row, headers, ['Titel']),
          groep: cel(row, headers, ['Groep']),
          leerlingenaantal: cel(row, headers, ['Leerlingenaantal']),
          school: cel(row, headers, ['School']),
          plaats: cel(row, headers, ['Plaats']),
          speelzaal: cel(row, headers, ['Speelzalen']),
          afhaallocatie: cel(row, headers, ['Afhaallocatie']),
          sheet: sheetNaam,
          rij: headerIndex + index + 2,
          type: isKinderopvang ? 'Kinderopvang' : 'Schoollijst',
        }

        if (!item.soort && !item.thema && !item.titel && !item.school && !item.speelzaal) return

        rijen.push({
          ...item,
          id: `${sheetNaam}-${item.rij}-${rijen.length}`,
          titelWeergave: titelLabel(item),
          bestemming: bestemmingLabel(item),
        })
      })
    })

    return rijen
  })
}

export function maakEducatieLijst(rijen, { schooljaar, periode, bestandNaam, toelichting = '', bestaandId = null }) {
  const nu = new Date().toISOString()

  return {
    id: bestaandId || `${Date.now()}`,
    titel: `Educatie lijst - ${periode}`,
    schooljaar,
    periode,
    bestandNaam,
    toelichting,
    status: 'nieuw',
    aangemaakt: nu,
    bijgewerkt: nu,
    rijen: rijen.map((item, index) => ({
      id: item.id || `${Date.now()}-${index}`,
      ...item,
      titelWeergave: item.titelWeergave || titelLabel(item),
      bestemming: item.bestemming || bestemmingLabel(item),
    })),
  }
}

function omschrijvingVoorRij(item, lijst) {
  return [
    `Schooljaar: ${lijst.schooljaar}`,
    `Periode: ${lijst.periode}`,
    item.type ? `Lijst: ${item.type}` : '',
    item.groep ? `Groep: ${item.groep}` : '',
    item.leerlingenaantal ? `Leerlingenaantal: ${item.leerlingenaantal}` : '',
    item.school ? `School: ${item.school}` : '',
    item.speelzaal ? `Speelzaal: ${item.speelzaal}` : '',
    item.plaats ? `Plaats: ${item.plaats}` : '',
    item.afhaallocatie ? `Afhaallocatie: ${item.afhaallocatie}` : '',
    lijst.toelichting ? `Extra toelichting: ${lijst.toelichting}` : '',
    lijst.bestandNaam ? `Bestand: ${lijst.bestandNaam}` : '',
  ].filter(Boolean).join('\n')
}

export function maakTakenUitEducatieLijst(lijst, { week, dag, door }) {
  const nu = new Date().toISOString()

  return (lijst.rijen || []).map((item, index) => {
    return {
      id: `${Date.now()}-${index}`,
      titel: item.titelWeergave,
      omschrijving: omschrijvingVoorRij(item, lijst),
      reden: '',
      aantal: '',
      tijd: '',
      van: 'Educatie',
      naar: item.bestemming,
      week,
      dag,
      prioriteit: 'normaal',
      status: 'gepland',
      aangemaakt: nu,
      door,
      bron: 'educatie',
      educatieLijstId: lijst.id,
      educatieRijId: item.id,
      log: [{ a: 'aangemaakt uit educatie lijst', d: door, w: nu }],
    }
  })
}
