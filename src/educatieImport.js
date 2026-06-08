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
      (headers.includes('titel') && headers.includes('speelzalen') && headers.some((header) => header.startsWith('afhaallocatie')))
    )
  })
}

function tekstUitWerkboek(workbook, rowsBySheet) {
  return workbook.SheetNames
    .flatMap((sheetNaam) => rowsBySheet[sheetNaam] || [])
    .slice(0, 10)
    .flat()
    .map(schoon)
    .filter(Boolean)
    .join(' ')
}

function richtingUitTekst(tekst) {
  const key = sleutel(tekst)
  const brengIndex = key.search(/brengen|breng/)
  const haalIndex = key.search(/ophalen|haallijst|halen/)
  if (brengIndex >= 0 && haalIndex >= 0) return haalIndex < brengIndex ? 'halen' : 'brengen'
  if (haalIndex >= 0) return 'halen'
  if (brengIndex >= 0) return 'brengen'
  return 'brengen'
}

function sectieUitRij(row) {
  const waarden = row.map(schoon).filter(Boolean)
  if (waarden.length === 0) return ''
  const eerste = waarden[0]
  const key = sleutel(eerste)
  const alleenKop = waarden.length <= 2

  if (key.includes('naar vestigingen') || key === 'regio') return 'regio'
  if (alleenKop && key.includes('den helder')) return 'den helder'
  if (alleenKop && key.includes('julianadorp')) return 'julianadorp'
  if (alleenKop && key.includes('regio')) return 'regio'
  return ''
}

function startSectie(rows, headerIndex) {
  for (let index = headerIndex - 1; index >= 0; index -= 1) {
    const sectie = sectieUitRij(rows[index] || [])
    if (sectie) return sectie
  }
  return ''
}

function isLegeOfOpmerkingRij(item) {
  return !item.soort && !item.thema && !item.titel && !item.school && !item.speelzaal
}

function vestigingVoorAfhaallocatie(value) {
  const key = sleutel(value)
  if (!key) return ''
  if (key.includes('anna') || key === 'ap') return 'Bibliotheek Anna Paulowna'
  if (key.includes('schagen')) return 'Bibliotheek Schagen'
  if (key.includes('hippo') || key.includes('hippolytushoef') || key.includes('den oever')) return 'Bibliotheek Hippolytushoef'
  if (key.includes('wieringerwerf')) return 'Bibliotheek Wieringerwerf'
  if (key.includes('middenmeer')) return 'Bibliotheek Middenmeer'
  if (key.includes('nieuwe niedorp')) return 'Bibliotheek Nieuwe Niedorp'
  if (key.includes('tuitjenhorn')) return 'Bibliotheek Tuitjenhorn'
  if (key.includes('jul')) return ''
  if (key.includes('den helder') || key === 'dh') return ''
  return ''
}

function isDirecteKinderopvangLocatie(item) {
  const key = sleutel(`${item.sectie} ${item.afhaallocatie}`)
  return key.includes('den helder') || key.includes('julianadorp') || key === 'dh' || key === 'jul'
}

function bestemmingLabel(item) {
  if (item.type === 'Kinderopvang') {
    if (isDirecteKinderopvangLocatie(item)) return item.speelzaal || item.afhaallocatie || ''
    return vestigingVoorAfhaallocatie(item.afhaallocatie) || item.afhaallocatie || item.speelzaal || ''
  }

  const naam = item.school || item.speelzaal
  if (!naam) return item.plaats || item.afhaallocatie || ''
  const plaats = item.plaats || item.afhaallocatie
  return plaats ? `${naam} (${plaats})` : naam
}

function titelLabel(item) {
  const soort = item.soort || 'Educatie'
  const locatie = item.bestemming || bestemmingLabel(item) || item.school || item.speelzaal
  return locatie ? `${locatie} - ${soort}` : soort
}

function onderwerpLabel(item) {
  return item.thema || item.titel || ''
}

function routeVoorRij(item) {
  const bestemming = item.bestemming || bestemmingLabel(item)
  if (item.richting === 'halen') return { van: bestemming, naar: 'School 7 Educatie' }
  return { van: 'School 7 Educatie', naar: bestemming }
}

export function leesEducatieExcel(bestand) {
  return bestand.arrayBuffer().then((buffer) => {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const rowsBySheet = {}
    workbook.SheetNames.forEach((sheetNaam) => {
      rowsBySheet[sheetNaam] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNaam], { header: 1, defval: '' })
    })
    const richting = richtingUitTekst(`${bestand?.name || ''} ${tekstUitWerkboek(workbook, rowsBySheet)}`)
    const rijen = []

    workbook.SheetNames.forEach((sheetNaam) => {
      const rows = rowsBySheet[sheetNaam]
      const headerIndex = vindHeaderRij(rows)
      if (headerIndex < 0) return

      const headers = rows[headerIndex].map(schoon)
      const isKinderopvang = headers.map(sleutel).includes('speelzalen')
      let sectie = startSectie(rows, headerIndex)

      rows.slice(headerIndex + 1).forEach((row, index) => {
        const nieuweSectie = sectieUitRij(row)
        if (nieuweSectie) {
          sectie = nieuweSectie
          return
        }

        const item = {
          soort: cel(row, headers, ['Soort']) || (isKinderopvang ? schoon(row[0]) : ''),
          thema: cel(row, headers, ['Thema']),
          titel: cel(row, headers, ['Titel']),
          groep: cel(row, headers, ['Groep']),
          leerlingenaantal: cel(row, headers, ['Leerlingenaantal']),
          school: cel(row, headers, ['School']),
          plaats: cel(row, headers, ['Plaats']),
          speelzaal: cel(row, headers, ['Speelzalen', 'Speelzaal']),
          afhaallocatie: cel(row, headers, ['Afhaallocatie', 'Afhaallocaties']),
          sheet: sheetNaam,
          rij: headerIndex + index + 2,
          type: isKinderopvang ? 'Kinderopvang' : 'Schoollijst',
          sectie,
          richting,
        }

        if (isLegeOfOpmerkingRij(item)) return

        const bestemming = bestemmingLabel(item)
        const route = routeVoorRij({ ...item, bestemming })

        rijen.push({
          ...item,
          id: `${sheetNaam}-${item.rij}-${rijen.length}`,
          onderwerp: onderwerpLabel(item),
          bestemming,
          van: route.van,
          naar: route.naar,
          titelWeergave: titelLabel({ ...item, bestemming }),
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
      onderwerp: item.onderwerp || onderwerpLabel(item),
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
    item.sectie ? `Blok: ${item.sectie}` : '',
    item.richting ? `Richting: ${item.richting}` : '',
    item.onderwerp ? `Titel/thema: ${item.onderwerp}` : '',
    lijst.toelichting ? `Extra toelichting: ${lijst.toelichting}` : '',
    lijst.bestandNaam ? `Bestand: ${lijst.bestandNaam}` : '',
  ].filter(Boolean).join('\n')
}

export function maakTakenUitEducatieLijst(lijst, { week, dag, door }) {
  const nu = new Date().toISOString()

  return (lijst.rijen || []).map((item, index) => {
    const route = routeVoorRij(item)

    return {
      id: `${Date.now()}-${index}`,
      titel: item.titelWeergave,
      omschrijving: omschrijvingVoorRij(item, lijst),
      reden: '',
      aantal: '',
      tijd: '',
      van: route.van,
      naar: route.naar,
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
