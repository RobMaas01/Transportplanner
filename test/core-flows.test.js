import test from 'node:test'
import assert from 'node:assert/strict'

import {
  isBeheerPinJuist,
  maakTaakUitAanvraag,
  markeerAanvraagIngepland,
  verwijderEducatieLijstItems,
  verwijderEducatieLijstTaken,
  verwijderEducatieProjectItems,
  verwijderEducatieProjectTaken,
} from '../src/appFlowLogic.js'
import { maakEducatieLijst, maakTakenUitEducatieLijst } from '../src/educatieImport.js'
import {
  aanvraagMomentLabel,
  maakDashboardData,
  maakRapportData,
  standaardAanvraag,
} from '../src/utils.js'

test('aanvragen kunnen flexibel of zonder vaste datum worden vastgelegd', () => {
  assert.equal(standaardAanvraag().week, 'zsm')
  assert.equal(standaardAanvraag().dag, -1)
  assert.equal(aanvraagMomentLabel({ week: 'zelf', dag: -1 }), 'Geen vaste datum')
  assert.equal(aanvraagMomentLabel({ week: '2026-W10', dag: -1 }), 'Week 10 - 02-03-2026 - 06-03-2026, dag flexibel')
})

test('beheerlogin accepteert alleen de juiste pincode', () => {
  assert.equal(isBeheerPinJuist('2378'), true)
  assert.equal(isBeheerPinJuist(2378), true)
  assert.equal(isBeheerPinJuist('0000'), false)
})

test('aanvraag doorzetten maakt een geplande taak en markeert de aanvraag ingepland', () => {
  const aanvraag = {
    id: 'aanvraag-1',
    titel: 'Extra kratten',
    omschrijving: 'Voor vestiging Schagen',
    reden: 'Voorraad',
    aantal: '4',
    tijd: '',
    van: 'Bibliotheek School 7',
    naar: 'Bibliotheek Schagen',
    prioriteit: 'hoog',
    log: [{ a: 'ingediend', d: 'Bente', w: '2026-01-01T09:00:00.000Z' }],
  }

  const taak = maakTaakUitAanvraag(aanvraag, {
    week: '2026-W10',
    dag: 2,
    door: 'transporteur',
    id: 'taak-1',
    aangemaakt: '2026-01-02T09:00:00.000Z',
  })
  const ingepland = markeerAanvraagIngepland(aanvraag, {
    week: '2026-W10',
    dag: 2,
    door: 'transporteur',
    behandeld: '2026-01-02T09:05:00.000Z',
  })

  assert.deepEqual(taak, {
    id: 'taak-1',
    titel: 'Extra kratten',
    omschrijving: 'Voor vestiging Schagen',
    reden: 'Voorraad',
    aantal: '4',
    tijd: '',
    van: 'Bibliotheek School 7',
    naar: 'Bibliotheek Schagen',
    week: '2026-W10',
    dag: 2,
    prioriteit: 'hoog',
    status: 'gepland',
    aangemaakt: '2026-01-02T09:00:00.000Z',
    door: 'transporteur',
    bron: 'aanvraag',
    aanvraagId: 'aanvraag-1',
    log: [{ a: 'aangemaakt uit aanvraag', d: 'transporteur', w: '2026-01-02T09:00:00.000Z' }],
  })
  assert.equal(ingepland.status, 'ingepland')
  assert.equal(ingepland.geplandeWeek, '2026-W10')
  assert.equal(ingepland.geplandeDag, 2)
  assert.equal(ingepland.log.at(-1).a, 'doorgezet naar planning')
})

test('educatie-import maakt een aanvraaglijst en geplande taken', () => {
  const lijst = maakEducatieLijst(
    [
      {
        id: 'rij-1',
        soort: 'Boekenpakket',
        thema: 'Lezen',
        school: 'De Horizon',
        plaats: 'Schagen',
        type: 'Schoollijst',
        richting: 'brengen',
      },
    ],
    {
      schooljaar: '2026-2027',
      periode: 'P1',
      bestandNaam: 'educatie.xlsx',
      toelichting: 'Pilot',
      bestaandId: 'lijst-1',
    },
  )
  const taken = maakTakenUitEducatieLijst(lijst, { week: '2026-W12', dag: 1, door: 'educatie' })

  assert.equal(lijst.id, 'lijst-1')
  assert.equal(lijst.titel, 'Educatie lijst - P1')
  assert.equal(lijst.status, 'nieuw')
  assert.equal(lijst.rijen[0].titelWeergave, 'De Horizon (Schagen) - Boekenpakket')
  assert.equal(taken.length, 1)
  assert.equal(taken[0].bron, 'educatie')
  assert.equal(taken[0].educatieLijstId, 'lijst-1')
  assert.equal(taken[0].van, 'School 7 Educatie')
  assert.equal(taken[0].naar, 'De Horizon (Schagen)')
})

test('educatie en project verwijderen haalt de items definitief uit lijsten en planning', () => {
  const educatieLijsten = [{ id: 'lijst-1' }, { id: 'lijst-2' }]
  const projecten = [{ id: 'project-1' }, { id: 'project-2' }]
  const taken = [
    { id: 'taak-1', educatieLijstId: 'lijst-1' },
    { id: 'taak-2', educatieProjectLijstId: 'project-1' },
    { id: 'taak-3', educatieProjectId: 'project-1' },
    { id: 'taak-4', titel: 'Losse taak' },
  ]

  assert.deepEqual(verwijderEducatieLijstItems(educatieLijsten, 'lijst-1'), [{ id: 'lijst-2' }])
  assert.deepEqual(verwijderEducatieLijstTaken(taken, 'lijst-1').map((taak) => taak.id), ['taak-2', 'taak-3', 'taak-4'])
  assert.deepEqual(verwijderEducatieProjectItems(projecten, 'project-1'), [{ id: 'project-2' }])
  assert.deepEqual(verwijderEducatieProjectTaken(taken, 'project-1').map((taak) => taak.id), ['taak-1', 'taak-4'])
})

test('rapportage en dashboard negeren verwijderde taken en tellen open aanvragen', () => {
  const taken = [
    { id: 'taak-1', titel: 'Extra sorteren', week: '2026-W10', dag: 0, status: 'gepland', bron: 'aanvraag', tijd: '45', van: 'A', naar: 'B', prioriteit: 'hoog' },
    { id: 'taak-2', titel: 'Extra kratten', week: '2026-W10', dag: 1, status: 'afgerond', bron: 'zelf', aantal: '3' },
    { id: 'taak-3', titel: 'Oud', week: '2026-W10', dag: 2, status: 'verwijderd', bron: 'aanvraag' },
  ]
  const aanvragen = [
    { id: 'aanvraag-1', week: 'zelf', status: 'nieuw' },
    { id: 'aanvraag-2', week: 'zsm', status: 'info' },
    { id: 'aanvraag-3', week: '2026-W10', status: 'verwijderd' },
  ]
  const rapp = { type: 'week', week: '2026-W10' }

  const rapport = maakRapportData(taken, rapp)
  const dashboard = maakDashboardData(taken, aanvragen, rapp)

  assert.equal(rapport.totaal, 2)
  assert.equal(rapport.ps.gepland, 1)
  assert.equal(rapport.ps.afgerond, 1)
  assert.equal(rapport.aanvragen, 1)
  assert.equal(dashboard.totaal, 2)
  assert.equal(dashboard.openAanvragen, 2)
  assert.equal(dashboard.hogePrioriteit, 1)
  assert.equal(dashboard.sorteerTijdMin, 45)
})
