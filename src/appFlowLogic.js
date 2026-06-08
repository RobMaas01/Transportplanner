import { PIN_BERT } from './constants.js'

export function isBeheerPinJuist(code) {
  return String(code) === PIN_BERT
}

export function maakTaakUitAanvraag(item, { week, dag, door, id = Date.now().toString(), aangemaakt = new Date().toISOString() }) {
  return {
    id,
    titel: item.titel,
    omschrijving: item.omschrijving,
    reden: item.reden || '',
    aantal: item.aantal || '',
    tijd: item.tijd || '',
    van: item.van,
    naar: item.naar,
    week,
    dag,
    prioriteit: item.prioriteit,
    status: 'gepland',
    aangemaakt,
    door,
    bron: 'aanvraag',
    aanvraagId: item.id,
    log: [{ a: 'aangemaakt uit aanvraag', d: door, w: aangemaakt }],
  }
}

export function markeerAanvraagIngepland(item, { week, dag, door, behandeld = new Date().toISOString() }) {
  return {
    ...item,
    status: 'ingepland',
    geplandeWeek: week,
    geplandeDag: dag,
    behandeld,
    log: [...(item.log || []), { a: 'doorgezet naar planning', d: door, w: behandeld }],
  }
}

export function verwijderEducatieLijstItems(lijsten, id) {
  return lijsten.filter((lijst) => lijst.id !== id)
}

export function verwijderEducatieLijstTaken(taken, id) {
  return taken.filter((taak) => taak.educatieLijstId !== id)
}

export function verwijderEducatieProjectItems(projecten, id) {
  return projecten.filter((item) => item.id !== id)
}

export function verwijderEducatieProjectTaken(taken, id) {
  return taken.filter((taak) => taak.educatieProjectLijstId !== id && taak.educatieProjectId !== id)
}
