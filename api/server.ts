/**
 * PlanKompas – lokale REST API server
 * Run: npx tsx api/server.ts
 * Port: 3001
 *
 * Endpoints:
 *   Plans:        GET|POST /api/plans  ·  GET|PUT|DELETE /api/plans/:id
 *   SDs:          GET|POST /api/sds    ·  GET|PUT|DELETE /api/sds/:id    (?planId=)
 *   ODs:          GET|POST /api/ods    ·  GET|PUT|DELETE /api/ods/:id    (?planId= | ?sdId=)
 *   Actions:      GET|POST /api/actions ·  GET|PUT|DELETE /api/actions/:id (?planId= | ?odId=)
 *   Users:        GET|POST /api/users  ·  GET|PUT|DELETE /api/users/:id
 *   WorkDomains:  GET|POST /api/work-domains  ·  GET|PUT|DELETE /api/work-domains/:id
 *   WorkStreams:  GET|POST /api/work-streams  ·  GET|PUT|DELETE /api/work-streams/:id (?domainId=)
 *   DailyTasks:  GET|POST /api/daily-tasks   ·  GET|PUT|DELETE /api/daily-tasks/:id  (?streamId= | ?assignee=)
 *   TaskItems:   GET|POST /api/task-items    ·  GET|PUT|DELETE /api/task-items/:id   (?taskId=)
 *   Audit:       POST /api/audit  ·  GET /api/audit (?entityId= | ?limit=)
 */
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DB_FILE = join(__dirname, 'db.json')
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001

// ─── DB schema & helpers ──────────────────────────────────────────────────────

type Row = Record<string, unknown>

interface DB {
  plans: Row[]
  strategicObjectives: Row[]
  operationalObjectives: Row[]
  actions: Row[]
  fiches: Row[]
  ficheItems: Row[]
  users: Row[]
  auditLogs: Row[]
  workDomains: Row[]
  workStreams: Row[]
  dailyTasks: Row[]
  taskItems: Row[]
}

const EMPTY_DB: DB = {
  plans: [], strategicObjectives: [], operationalObjectives: [],
  actions: [], fiches: [], ficheItems: [], users: [], auditLogs: [],
  workDomains: [], workStreams: [], dailyTasks: [], taskItems: [],
}

function loadDB(): DB {
  try {
    if (!existsSync(DB_FILE)) { writeFileSync(DB_FILE, JSON.stringify(EMPTY_DB, null, 2)); return { ...EMPTY_DB } }
    return JSON.parse(readFileSync(DB_FILE, 'utf-8'))
  } catch { return { ...EMPTY_DB } }
}

function saveDB(db: DB): void {
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
}

function now(): string { return new Date().toISOString() }
function id(): string { return randomUUID() }

// ─── Express setup ────────────────────────────────────────────────────────────

const app = express()
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173', '*'] }))
app.use(express.json())

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api', (_req, res) => {
  res.json({ name: 'PlanKompas API', version: '1.0.0', db: DB_FILE })
})

// ─── Plans ────────────────────────────────────────────────────────────────────

app.get('/api/plans', (_req, res) => {
  res.json(loadDB().plans)
})

app.get('/api/plans/:id', (req, res) => {
  const row = loadDB().plans.find(p => p.id === req.params.id)
  row ? res.json(row) : res.status(404).json({ error: 'Not found' })
})

app.post('/api/plans', (req, res) => {
  const db = loadDB()
  const row = { id: id(), createdAt: now(), updatedAt: now(), ...req.body }
  db.plans.push(row)
  saveDB(db)
  res.status(201).json(row)
})

app.put('/api/plans/:id', (req, res) => {
  const db = loadDB()
  const idx = db.plans.findIndex(p => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  db.plans[idx] = { ...db.plans[idx], ...req.body, id: req.params.id, updatedAt: now() }
  saveDB(db); res.json(db.plans[idx])
})

app.delete('/api/plans/:id', (req, res) => {
  const db = loadDB()
  db.plans = db.plans.filter(p => p.id !== req.params.id)
  saveDB(db); res.status(204).end()
})

// ─── Strategic Objectives (SDs) ───────────────────────────────────────────────

app.get('/api/sds', (req, res) => {
  let rows = loadDB().strategicObjectives
  if (req.query.planId) rows = rows.filter(r => r.planId === req.query.planId)
  res.json(rows)
})

app.get('/api/sds/:id', (req, res) => {
  const row = loadDB().strategicObjectives.find(r => r.id === req.params.id)
  row ? res.json(row) : res.status(404).json({ error: 'Not found' })
})

app.post('/api/sds', (req, res) => {
  const db = loadDB()
  const row = { id: id(), typeGoal: 'SD', createdAt: now(), updatedAt: now(), ...req.body }
  db.strategicObjectives.push(row)
  saveDB(db); res.status(201).json(row)
})

app.put('/api/sds/:id', (req, res) => {
  const db = loadDB()
  const idx = db.strategicObjectives.findIndex(r => r.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  db.strategicObjectives[idx] = { ...db.strategicObjectives[idx], ...req.body, id: req.params.id, updatedAt: now() }
  saveDB(db); res.json(db.strategicObjectives[idx])
})

app.delete('/api/sds/:id', (req, res) => {
  const db = loadDB()
  db.strategicObjectives = db.strategicObjectives.filter(r => r.id !== req.params.id)
  saveDB(db); res.status(204).end()
})

// ─── Operational Objectives (ODs) ─────────────────────────────────────────────

app.get('/api/ods', (req, res) => {
  let rows = loadDB().operationalObjectives
  if (req.query.planId) rows = rows.filter(r => r.planId === req.query.planId)
  if (req.query.sdId)   rows = rows.filter(r => r.sdId === req.query.sdId)
  res.json(rows)
})

app.get('/api/ods/:id', (req, res) => {
  const row = loadDB().operationalObjectives.find(r => r.id === req.params.id)
  row ? res.json(row) : res.status(404).json({ error: 'Not found' })
})

app.post('/api/ods', (req, res) => {
  const db = loadDB()
  const row = { id: id(), typeGoal: 'OD', createdAt: now(), updatedAt: now(), ...req.body }
  db.operationalObjectives.push(row)
  saveDB(db); res.status(201).json(row)
})

app.put('/api/ods/:id', (req, res) => {
  const db = loadDB()
  const idx = db.operationalObjectives.findIndex(r => r.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  db.operationalObjectives[idx] = { ...db.operationalObjectives[idx], ...req.body, id: req.params.id, updatedAt: now() }
  saveDB(db); res.json(db.operationalObjectives[idx])
})

app.delete('/api/ods/:id', (req, res) => {
  const db = loadDB()
  db.operationalObjectives = db.operationalObjectives.filter(r => r.id !== req.params.id)
  saveDB(db); res.status(204).end()
})

// ─── Actions ──────────────────────────────────────────────────────────────────

app.get('/api/actions', (req, res) => {
  let rows = loadDB().actions
  if (req.query.planId) rows = rows.filter(r => r.planId === req.query.planId)
  if (req.query.odId)   rows = rows.filter(r => r.odId === req.query.odId)
  res.json(rows)
})

app.get('/api/actions/:id', (req, res) => {
  const row = loadDB().actions.find(r => r.id === req.params.id)
  row ? res.json(row) : res.status(404).json({ error: 'Not found' })
})

app.post('/api/actions', (req, res) => {
  const db = loadDB()
  const row = { id: id(), createdAt: now(), updatedAt: now(), ...req.body }
  db.actions.push(row)
  saveDB(db); res.status(201).json(row)
})

app.put('/api/actions/:id', (req, res) => {
  const db = loadDB()
  const idx = db.actions.findIndex(r => r.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  db.actions[idx] = { ...db.actions[idx], ...req.body, id: req.params.id, updatedAt: now() }
  saveDB(db); res.json(db.actions[idx])
})

app.delete('/api/actions/:id', (req, res) => {
  const db = loadDB()
  db.actions = db.actions.filter(r => r.id !== req.params.id)
  saveDB(db); res.status(204).end()
})

// ─── Users ────────────────────────────────────────────────────────────────────

app.get('/api/users', (_req, res) => { res.json(loadDB().users) })

app.get('/api/users/:id', (req, res) => {
  const row = loadDB().users.find(r => r.id === req.params.id)
  row ? res.json(row) : res.status(404).json({ error: 'Not found' })
})

app.post('/api/users', (req, res) => {
  const db = loadDB()
  const row = { id: id(), ...req.body }
  db.users.push(row); saveDB(db); res.status(201).json(row)
})

app.put('/api/users/:id', (req, res) => {
  const db = loadDB()
  const idx = db.users.findIndex(r => r.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  db.users[idx] = { ...db.users[idx], ...req.body, id: req.params.id }
  saveDB(db); res.json(db.users[idx])
})

app.delete('/api/users/:id', (req, res) => {
  const db = loadDB()
  db.users = db.users.filter(r => r.id !== req.params.id)
  saveDB(db); res.status(204).end()
})

// ─── Work Domains ─────────────────────────────────────────────────────────────

app.get('/api/work-domains', (_req, res) => { res.json(loadDB().workDomains) })

app.get('/api/work-domains/:id', (req, res) => {
  const row = loadDB().workDomains.find(r => r.id === req.params.id)
  row ? res.json(row) : res.status(404).json({ error: 'Not found' })
})

app.post('/api/work-domains', (req, res) => {
  const db = loadDB()
  const row = { id: id(), createdAt: now(), updatedAt: now(), ...req.body }
  db.workDomains.push(row); saveDB(db); res.status(201).json(row)
})

app.put('/api/work-domains/:id', (req, res) => {
  const db = loadDB()
  const idx = db.workDomains.findIndex(r => r.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  db.workDomains[idx] = { ...db.workDomains[idx], ...req.body, id: req.params.id, updatedAt: now() }
  saveDB(db); res.json(db.workDomains[idx])
})

app.delete('/api/work-domains/:id', (req, res) => {
  const db = loadDB()
  // Cascade: remove streams + tasks when domain is deleted
  const streamIds = db.workStreams.filter(s => s.domainId === req.params.id).map(s => s.id)
  db.dailyTasks = db.dailyTasks.filter(t => !streamIds.includes(t.streamId as string))
  db.workStreams = db.workStreams.filter(s => s.domainId !== req.params.id)
  db.workDomains = db.workDomains.filter(r => r.id !== req.params.id)
  saveDB(db); res.status(204).end()
})

// ─── Work Streams ─────────────────────────────────────────────────────────────

app.get('/api/work-streams', (req, res) => {
  let rows = loadDB().workStreams
  if (req.query.domainId) rows = rows.filter(r => r.domainId === req.query.domainId)
  res.json(rows)
})

app.get('/api/work-streams/:id', (req, res) => {
  const row = loadDB().workStreams.find(r => r.id === req.params.id)
  row ? res.json(row) : res.status(404).json({ error: 'Not found' })
})

app.post('/api/work-streams', (req, res) => {
  const db = loadDB()
  const row = { id: id(), createdAt: now(), updatedAt: now(), ...req.body }
  db.workStreams.push(row); saveDB(db); res.status(201).json(row)
})

app.put('/api/work-streams/:id', (req, res) => {
  const db = loadDB()
  const idx = db.workStreams.findIndex(r => r.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  db.workStreams[idx] = { ...db.workStreams[idx], ...req.body, id: req.params.id, updatedAt: now() }
  saveDB(db); res.json(db.workStreams[idx])
})

app.delete('/api/work-streams/:id', (req, res) => {
  const db = loadDB()
  // Cascade: remove tasks when stream is deleted
  db.dailyTasks = db.dailyTasks.filter(t => t.streamId !== req.params.id)
  db.workStreams = db.workStreams.filter(r => r.id !== req.params.id)
  saveDB(db); res.status(204).end()
})

// ─── Daily Tasks ──────────────────────────────────────────────────────────────

app.get('/api/daily-tasks', (req, res) => {
  let rows = loadDB().dailyTasks
  if (req.query.streamId) rows = rows.filter(r => r.streamId === req.query.streamId)
  if (req.query.assignee) {
    const name = (req.query.assignee as string).toLowerCase()
    rows = rows.filter(r => (r.assignees as string[] ?? []).some(a => a.toLowerCase().includes(name)))
  }
  res.json(rows)
})

app.get('/api/daily-tasks/:id', (req, res) => {
  const row = loadDB().dailyTasks.find(r => r.id === req.params.id)
  row ? res.json(row) : res.status(404).json({ error: 'Not found' })
})

app.post('/api/daily-tasks', (req, res) => {
  const db = loadDB()
  const row = { id: id(), createdAt: now(), updatedAt: now(), ...req.body }
  db.dailyTasks.push(row); saveDB(db); res.status(201).json(row)
})

app.put('/api/daily-tasks/:id', (req, res) => {
  const db = loadDB()
  const idx = db.dailyTasks.findIndex(r => r.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  db.dailyTasks[idx] = { ...db.dailyTasks[idx], ...req.body, id: req.params.id, updatedAt: now() }
  saveDB(db); res.json(db.dailyTasks[idx])
})

app.delete('/api/daily-tasks/:id', (req, res) => {
  const db = loadDB()
  db.taskItems = db.taskItems.filter(t => t.taskId !== req.params.id)
  db.dailyTasks = db.dailyTasks.filter(r => r.id !== req.params.id)
  saveDB(db); res.status(204).end()
})

// ─── Task Items ───────────────────────────────────────────────────────────────

app.get('/api/task-items', (req, res) => {
  let rows = loadDB().taskItems
  if (req.query.taskId) rows = rows.filter(r => r.taskId === req.query.taskId)
  res.json(rows)
})

app.get('/api/task-items/:id', (req, res) => {
  const row = loadDB().taskItems.find(r => r.id === req.params.id)
  row ? res.json(row) : res.status(404).json({ error: 'Not found' })
})

app.post('/api/task-items', (req, res) => {
  const db = loadDB()
  const row = { id: id(), ...req.body }
  db.taskItems.push(row); saveDB(db); res.status(201).json(row)
})

app.put('/api/task-items/:id', (req, res) => {
  const db = loadDB()
  const idx = db.taskItems.findIndex(r => r.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  db.taskItems[idx] = { ...db.taskItems[idx], ...req.body, id: req.params.id }
  saveDB(db); res.json(db.taskItems[idx])
})

app.delete('/api/task-items/:id', (req, res) => {
  const db = loadDB()
  db.taskItems = db.taskItems.filter(r => r.id !== req.params.id)
  saveDB(db); res.status(204).end()
})

// ─── Fiches ───────────────────────────────────────────────────────────────────

app.get('/api/fiches', (req, res) => {
  let rows = loadDB().fiches
  if (req.query.planId)    rows = rows.filter(r => r.planId === req.query.planId)
  if (req.query.scopeType) rows = rows.filter(r => r.scopeType === req.query.scopeType)
  if (req.query.scopeId)   rows = rows.filter(r => r.scopeId === req.query.scopeId)
  res.json(rows)
})

app.get('/api/fiches/:id', (req, res) => {
  const row = loadDB().fiches.find(r => r.id === req.params.id)
  row ? res.json(row) : res.status(404).json({ error: 'Not found' })
})

app.post('/api/fiches', (req, res) => {
  const db = loadDB()
  const row = { id: id(), createdAt: now(), updatedAt: now(), ...req.body }
  db.fiches.push(row); saveDB(db); res.status(201).json(row)
})

app.put('/api/fiches/:id', (req, res) => {
  const db = loadDB()
  const idx = db.fiches.findIndex(r => r.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  db.fiches[idx] = { ...db.fiches[idx], ...req.body, id: req.params.id, updatedAt: now() }
  saveDB(db); res.json(db.fiches[idx])
})

app.delete('/api/fiches/:id', (req, res) => {
  const db = loadDB()
  db.ficheItems = db.ficheItems.filter(fi => fi.ficheId !== req.params.id)
  db.fiches = db.fiches.filter(r => r.id !== req.params.id)
  saveDB(db); res.status(204).end()
})

// ─── Fiche Items ──────────────────────────────────────────────────────────────

app.get('/api/fiche-items', (req, res) => {
  let rows = loadDB().ficheItems
  if (req.query.ficheId) rows = rows.filter(r => r.ficheId === req.query.ficheId)
  res.json(rows)
})

app.post('/api/fiche-items', (req, res) => {
  const db = loadDB()
  const row = { id: id(), createdAt: now(), updatedAt: now(), ...req.body }
  db.ficheItems.push(row); saveDB(db); res.status(201).json(row)
})

app.put('/api/fiche-items/:id', (req, res) => {
  const db = loadDB()
  const idx = db.ficheItems.findIndex(r => r.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  db.ficheItems[idx] = { ...db.ficheItems[idx], ...req.body, id: req.params.id, updatedAt: now() }
  saveDB(db); res.json(db.ficheItems[idx])
})

app.delete('/api/fiche-items/:id', (req, res) => {
  const db = loadDB()
  db.ficheItems = db.ficheItems.filter(r => r.id !== req.params.id)
  saveDB(db); res.status(204).end()
})

// ─── Audit log ────────────────────────────────────────────────────────────────

app.get('/api/audit', (req, res) => {
  let rows = loadDB().auditLogs
  if (req.query.entityId) rows = rows.filter(r => r.entityId === req.query.entityId)
  const limit = req.query.limit ? Number(req.query.limit) : 100
  res.json(rows.slice(-limit).reverse())
})

app.post('/api/audit', (req, res) => {
  const db = loadDB()
  const row = { id: id(), performedAt: now(), ...req.body }
  db.auditLogs.push(row); saveDB(db); res.status(201).json(row)
})

// ─── Error handler ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: err.message })
})

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n✅ PlanKompas API server draait op http://localhost:${PORT}`)
  console.log(`📁 Database: ${DB_FILE}`)
  console.log(`\nEndpoints:`)
  console.log(`  GET  /api/plans            → alle plannen`)
  console.log(`  POST /api/plans            → nieuw plan aanmaken`)
  console.log(`  GET  /api/sds?planId=...   → strategische doelen per plan`)
  console.log(`  POST /api/sds              → nieuw SD aanmaken`)
  console.log(`  GET  /api/ods?planId=...   → operationele doelen per plan`)
  console.log(`  POST /api/ods              → nieuw OD aanmaken`)
  console.log(`  GET  /api/actions?planId=... → acties per plan`)
  console.log(`  POST /api/actions          → nieuwe actie aanmaken`)
  console.log(`  GET  /api/daily-tasks      → alle dagelijkse taken`)
  console.log(`  POST /api/daily-tasks      → nieuwe taak aanmaken`)
  console.log(`  GET  /api/users            → alle gebruikers`)
  console.log(`  GET  /api/audit            → auditlog`)
  console.log(`  GET  /api               → API info\n`)
})
