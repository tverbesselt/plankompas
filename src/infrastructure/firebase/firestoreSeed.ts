/**
 * Seed demodata in Firestore — spiegelt src/infrastructure/db/seed.ts
 */
import { v4 as uuid } from 'uuid'
import { writeBatch } from 'firebase/firestore'
import { firestore } from './firebaseConfig'
import { docRef, getAll } from './firestoreHelpers'
import type { Plan, StrategicObjective, OperationalObjective, Action, User, WorkDomain, WorkStream, DailyTask } from '@/domain/types'

const now = new Date().toISOString()
const SYSTEM = 'system'

export async function seedFirestore() {
  const existing = await getAll<Plan>('plans')
  if (existing.length > 0) return // Already seeded

  const planId = uuid()
  const sd1Id = uuid(), sd2Id = uuid()
  const od1Id = uuid(), od2Id = uuid(), od3Id = uuid(), od4Id = uuid()

  const plan: Plan = {
    id: planId, title: 'Actieplan 2025–2026', startYear: 2025, endYear: 2026,
    description: 'Strategisch actieplan voor het schooljaar 2025–2026',
    isActive: true, createdAt: now, updatedAt: now, createdBy: SYSTEM,
  }

  const sds: StrategicObjective[] = [
    {
      id: sd1Id, planId, nr: '1', pijler: 'Onderwijs & Kwaliteit', dienst: 'Pedagogische dienst',
      rubriek: 'Leerresultaten',
      probleem: 'Het slagingspercentage in taalcursussen ligt onder het gewenste niveau.',
      doel: 'Het slagingspercentage in taalcursussen met 10% verhogen tegen einde schooljaar.',
      meting: 'Slagingspercentage per cursus meten via rapport juni 2026.',
      typeGoal: 'SD', verantwoordelijken: ['Jan Peeters'], uitvoerders: ['Jan Peeters', 'Marie Claes'],
      startDate: '2025-09-01', endDate: '2026-06-30', adjustedEndDate: '',
      status: 'in_uitvoering', notes: '', createdAt: now, updatedAt: now, createdBy: SYSTEM, updatedBy: '',
    },
    {
      id: sd2Id, planId, nr: '2', pijler: 'Organisatie & Personeel', dienst: 'HR',
      rubriek: 'Professionele ontwikkeling',
      probleem: 'Nascholing wordt onvoldoende systematisch bijgehouden.',
      doel: 'Een systematisch nascholingsbeleid uitwerken voor alle personeelsleden.',
      meting: 'Jaarlijks nascholingsplan aanwezig + 90% deelname.',
      typeGoal: 'SD', verantwoordelijken: ['Sofie Vermeersch'], uitvoerders: ['Sofie Vermeersch', 'Directie'],
      startDate: '2025-09-01', endDate: '2026-06-30', adjustedEndDate: '',
      status: 'niet_gestart', notes: '', createdAt: now, updatedAt: now, createdBy: SYSTEM, updatedBy: '',
    },
  ]

  const ods: OperationalObjective[] = [
    { id: od1Id, planId, sdId: sd1Id, nr: '1.1', probleem: 'Lesmateriaal sluit onvoldoende aan bij de leefwereld van cursisten.', doel: 'Vernieuwd en aantrekkelijk lesmateriaal ontwikkelen voor NT2-cursussen.', meting: 'Nieuw materiaal beschikbaar voor sept 2025, tevredenheidsscore > 7/10.', typeGoal: 'OD', verantwoordelijken: ['Marie Claes'], uitvoerders: ['Marie Claes', 'Peter Janssen'], startDate: '2025-09-01', endDate: '2026-01-31', adjustedEndDate: '', status: 'in_uitvoering', notes: '', createdAt: now, updatedAt: now, createdBy: SYSTEM, updatedBy: '' },
    { id: od2Id, planId, sdId: sd1Id, nr: '1.2', probleem: 'Differentiatie binnen cursusgroepen is moeilijk.', doel: 'Differentiatiestrategie implementeren in alle taalcursussen.', meting: 'Alle lesgevers volgen bijscholing differentiatie voor feb 2026.', typeGoal: 'OD', verantwoordelijken: ['Jan Peeters'], uitvoerders: ['Jan Peeters'], startDate: '2026-01-01', endDate: '2026-06-30', adjustedEndDate: '', status: 'niet_gestart', notes: '', createdAt: now, updatedAt: now, createdBy: SYSTEM, updatedBy: '' },
    { id: od3Id, planId, sdId: sd2Id, nr: '2.1', probleem: 'Nascholingsbehoeften worden niet structureel bevraagd.', doel: 'Jaarlijkse bevraging nascholingsbehoeften organiseren.', meting: 'Bevraging afgenomen voor okt 2025, rapport klaar nov 2025.', typeGoal: 'OD', verantwoordelijken: ['Sofie Vermeersch'], uitvoerders: ['Sofie Vermeersch'], startDate: '2025-09-01', endDate: '2025-11-30', adjustedEndDate: '', status: 'niet_gestart', notes: '', createdAt: now, updatedAt: now, createdBy: SYSTEM, updatedBy: '' },
    { id: od4Id, planId, sdId: sd2Id, nr: '2.2', probleem: 'Er is geen overzicht van gevolgde nascholingen.', doel: 'Centraal register nascholingen opzetten en bijhouden.', meting: 'Register operationeel voor jan 2026, maandelijks bijgewerkt.', typeGoal: 'OD', verantwoordelijken: ['Sofie Vermeersch'], uitvoerders: ['Sofie Vermeersch', 'Secretariaat'], startDate: '2025-11-01', endDate: '2026-06-30', adjustedEndDate: '', status: 'niet_gestart', notes: '', createdAt: now, updatedAt: now, createdBy: SYSTEM, updatedBy: '' },
  ]

  const actions: Action[] = [
    { id: uuid(), planId, odId: od1Id, title: 'Inventariseren huidig lesmateriaal', verantwoordelijke: 'Marie Claes', uitvoerders: ['Marie Claes'], startDate: '2025-09-01', endDate: '2025-10-01', adjustedEndDate: '', status: 'afgerond', opmerkingen: 'Inventaris afgewerkt op 28 sept.', createdAt: now, updatedAt: now, createdBy: SYSTEM, updatedBy: '' },
    { id: uuid(), planId, odId: od1Id, title: 'Nieuw materiaal ontwerpen (NT2 module 1-3)', verantwoordelijke: 'Marie Claes', uitvoerders: ['Marie Claes', 'Peter Janssen'], startDate: '2025-10-01', endDate: '2025-12-15', adjustedEndDate: '', status: 'in_uitvoering', opmerkingen: '', createdAt: now, updatedAt: now, createdBy: SYSTEM, updatedBy: '' },
    { id: uuid(), planId, odId: od1Id, title: 'Piloottest nieuw materiaal', verantwoordelijke: 'Marie Claes', uitvoerders: ['Marie Claes', 'Peter Janssen'], startDate: '2026-01-05', endDate: '2026-01-31', adjustedEndDate: '', status: 'niet_gestart', opmerkingen: '', createdAt: now, updatedAt: now, createdBy: SYSTEM, updatedBy: '' },
    { id: uuid(), planId, odId: od2Id, title: 'Bijscholing differentiatie organiseren', verantwoordelijke: 'Jan Peeters', uitvoerders: ['Jan Peeters'], startDate: '2026-01-15', endDate: '2026-02-28', adjustedEndDate: '', status: 'niet_gestart', opmerkingen: '', createdAt: now, updatedAt: now, createdBy: SYSTEM, updatedBy: '' },
    { id: uuid(), planId, odId: od3Id, title: 'Vragenlijst nascholingsbehoeften opstellen', verantwoordelijke: 'Sofie Vermeersch', uitvoerders: ['Sofie Vermeersch'], startDate: '2025-09-01', endDate: '2025-09-30', adjustedEndDate: '', status: 'niet_gestart', opmerkingen: '', createdAt: now, updatedAt: now, createdBy: SYSTEM, updatedBy: '' },
    { id: uuid(), planId, odId: od4Id, title: 'Softwaretool selecteren voor register', verantwoordelijke: 'Sofie Vermeersch', uitvoerders: ['Sofie Vermeersch'], startDate: '2025-11-01', endDate: '2025-11-30', adjustedEndDate: '2025-12-15', status: 'uitgesteld', opmerkingen: 'Vertraging door leveranciersprobleem.', createdAt: now, updatedAt: now, createdBy: SYSTEM, updatedBy: '' },
  ]

  const users: User[] = [
    { id: 'admin-user', name: 'Admin Gebruiker', email: 'admin@cvo.be', role: 'admin', scopes: [], isActive: true },
    { id: 'jan-peeters', name: 'Jan Peeters', email: 'jan.peeters@cvo.be', role: 'verantwoordelijke', scopes: [planId], isActive: true },
    { id: 'marie-claes', name: 'Marie Claes', email: 'marie.claes@cvo.be', role: 'editor', scopes: [planId], isActive: true },
    { id: 'sofie-vermeersch', name: 'Sofie Vermeersch', email: 'sofie.vermeersch@cvo.be', role: 'verantwoordelijke', scopes: [planId], isActive: true },
  ]

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const batch = writeBatch(firestore)
  batch.set(docRef('plans', plan.id), plan as any)
  for (const sd of sds)     batch.set(docRef('strategicObjectives', sd.id), sd as any)
  for (const od of ods)     batch.set(docRef('operationalObjectives', od.id), od as any)
  for (const a of actions)  batch.set(docRef('actions', a.id), a as any)
  for (const u of users)    batch.set(docRef('users', u.id), u as any)
  await batch.commit()
  /* eslint-enable @typescript-eslint/no-explicit-any */
  console.log('✅ Firestore seeded with demo data (plans, SDs, ODs, actions, users)')
}

export async function seedFirestoreDailyWork() {
  const existing = await getAll<WorkDomain>('workDomains')
  if (existing.length > 0) return

  const d1Id = uuid(), d2Id = uuid(), d3Id = uuid()
  const s1Id = uuid(), s2Id = uuid(), s3Id = uuid()
  const s4Id = uuid(), s5Id = uuid(), s6Id = uuid()

  const domains: WorkDomain[] = [
    { id: d1Id, name: 'Professionalisering', description: 'Nascholing, coaching en competentieontwikkeling van medewerkers', owner: 'Sofie Vermeersch', status: 'actief', createdAt: now, updatedAt: now, createdBy: SYSTEM },
    { id: d2Id, name: 'Leerlingenbegeleiding', description: 'Intake, doorstroom en opvolging van cursisten', owner: 'Jan Peeters', status: 'actief', createdAt: now, updatedAt: now, createdBy: SYSTEM },
    { id: d3Id, name: 'Kwaliteitszorg', description: 'Opvolging, evaluatie en continue verbetering van processen', owner: 'Admin Gebruiker', status: 'actief', createdAt: now, updatedAt: now, createdBy: SYSTEM },
  ]

  const streams: WorkStream[] = [
    { id: s1Id, domainId: d1Id, name: 'Nascholing plannen & opvolgen', type: 'periodiek', priority: 'hoog', verantwoordelijke: 'Sofie Vermeersch', createdAt: now, updatedAt: now },
    { id: s2Id, domainId: d1Id, name: 'Intervisie & coaching', type: 'continu', priority: 'normaal', verantwoordelijke: 'Sofie Vermeersch', createdAt: now, updatedAt: now },
    { id: s3Id, domainId: d2Id, name: 'Intake & doorstroom', type: 'continu', priority: 'hoog', verantwoordelijke: 'Jan Peeters', createdAt: now, updatedAt: now },
    { id: s4Id, domainId: d2Id, name: 'Attestering', type: 'periodiek', priority: 'normaal', verantwoordelijke: 'Marie Claes', createdAt: now, updatedAt: now },
    { id: s5Id, domainId: d3Id, name: 'Tevredenheidsmeting', type: 'periodiek', priority: 'normaal', verantwoordelijke: 'Admin Gebruiker', createdAt: now, updatedAt: now },
    { id: s6Id, domainId: d3Id, name: 'Zelfevaluatietraject', type: 'periodiek', priority: 'hoog', verantwoordelijke: 'Admin Gebruiker', createdAt: now, updatedAt: now },
  ]

  const tasks: DailyTask[] = [
    { id: uuid(), streamId: s1Id, title: 'Nascholingsbehoeften bevragen', description: 'Jaarlijkse bevraging via online formulier', assignees: ['Sofie Vermeersch'], startDate: '2025-09-01', deadline: '2025-09-30', status: 'afgerond', recurrence: 'geen', notes: 'Afgewerkt op 25 sept.', createdAt: now, updatedAt: now, createdBy: SYSTEM, updatedBy: '' },
    { id: uuid(), streamId: s1Id, title: 'Nascholingsplan 2025–2026 opstellen', description: 'Op basis van bevragingsresultaten jaarplan opmaken', assignees: ['Sofie Vermeersch'], startDate: '2025-10-01', deadline: '2025-10-31', status: 'bezig', recurrence: 'geen', notes: '', createdAt: now, updatedAt: now, createdBy: SYSTEM, updatedBy: '' },
    { id: uuid(), streamId: s2Id, title: 'Coachingsgesprekken inplannen', description: 'Maandelijkse coachingsgesprekken met lesgevers', assignees: ['Sofie Vermeersch', 'Jan Peeters'], startDate: '2025-09-15', deadline: '2026-06-30', status: 'bezig', recurrence: 'maandelijks', notes: '', createdAt: now, updatedAt: now, createdBy: SYSTEM, updatedBy: '' },
    { id: uuid(), streamId: s3Id, title: 'Intakegesprekken nieuwe cursisten semester 1', description: 'Intake en niveaubepaling voor nieuwe cursisten', assignees: ['Jan Peeters', 'Marie Claes'], startDate: '2025-09-01', deadline: '2025-09-30', status: 'afgerond', recurrence: 'geen', notes: '', createdAt: now, updatedAt: now, createdBy: SYSTEM, updatedBy: '' },
    { id: uuid(), streamId: s3Id, title: 'Doorstroomadvies semester 2', description: 'Individueel doorstroomadvies voor cursisten die doorstromen', assignees: ['Jan Peeters'], startDate: '2026-01-15', deadline: '2026-02-15', status: 'nieuw', recurrence: 'geen', notes: '', createdAt: now, updatedAt: now, createdBy: SYSTEM, updatedBy: '' },
    { id: uuid(), streamId: s4Id, title: 'Attesten opmaken juni 2026', description: 'Alle attesten van afgestudeerden opmaken en versturen', assignees: ['Marie Claes'], startDate: '2026-06-01', deadline: '2026-06-30', status: 'nieuw', recurrence: 'geen', notes: '', createdAt: now, updatedAt: now, createdBy: SYSTEM, updatedBy: '' },
    { id: uuid(), streamId: s5Id, title: 'Cursistentevredenheidsonderzoek', description: 'Jaarlijks tevredenheidsonderzoek bij cursisten', assignees: ['Admin Gebruiker'], startDate: '2025-12-01', deadline: '2026-01-31', status: 'wachtend', recurrence: 'geen', notes: 'Wacht op goedkeuring vragenlijst door directie', createdAt: now, updatedAt: now, createdBy: SYSTEM, updatedBy: '' },
    { id: uuid(), streamId: s6Id, title: 'Zelfevaluatietraject opstarten', description: 'Doorlopen van het zelfevaluatietraject conform GO!-kader', assignees: ['Admin Gebruiker', 'Sofie Vermeersch'], startDate: '2026-02-01', deadline: '2026-05-31', status: 'nieuw', recurrence: 'geen', notes: '', createdAt: now, updatedAt: now, createdBy: SYSTEM, updatedBy: '' },
  ]

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const batch = writeBatch(firestore)
  for (const d of domains)  batch.set(docRef('workDomains', d.id), d as any)
  for (const s of streams)  batch.set(docRef('workStreams', s.id), s as any)
  for (const t of tasks)    batch.set(docRef('dailyTasks', t.id), t as any)
  await batch.commit()
  /* eslint-enable @typescript-eslint/no-explicit-any */
  console.log('✅ Firestore seeded with daily work demo data (domains, streams, tasks)')
}
