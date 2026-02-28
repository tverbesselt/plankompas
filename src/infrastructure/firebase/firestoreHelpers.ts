/**
 * Herbruikbare CRUD-helpers voor Firestore.
 * Worden gebruikt door alle FirestoreXxxRepository-klassen.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  type QueryConstraint,
} from 'firebase/firestore'
import { firestore } from './firebaseConfig'

/** Collectie-referentie */
export function col(name: string) {
  return collection(firestore, name)
}

/** Document-referentie */
export function docRef(collectionName: string, id: string) {
  return doc(firestore, collectionName, id)
}

/** Eén document ophalen op ID — geeft undefined als niet gevonden */
export async function getById<T>(collectionName: string, id: string): Promise<T | undefined> {
  const snap = await getDoc(docRef(collectionName, id))
  return snap.exists() ? (snap.data() as T) : undefined
}

/** Alle documenten in een collectie ophalen */
export async function getAll<T>(collectionName: string): Promise<T[]> {
  const snap = await getDocs(col(collectionName))
  return snap.docs.map(d => d.data() as T)
}

/** Query met where/orderBy/limit constraints */
export async function queryDocs<T>(collectionName: string, ...constraints: QueryConstraint[]): Promise<T[]> {
  const q = query(col(collectionName), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as T)
}

/** Document opslaan (upsert) — volledige vervanging */
export async function saveDoc<T extends { id: string }>(collectionName: string, entity: T): Promise<void> {
  await setDoc(docRef(collectionName, entity.id), entity as Record<string, unknown>)
}

/** Eén document verwijderen */
export async function deleteById(collectionName: string, id: string): Promise<void> {
  await deleteDoc(docRef(collectionName, id))
}

/** Batch-delete: alle documenten waar field == value */
export async function deleteWhere(collectionName: string, field: string, value: string): Promise<void> {
  const q = query(col(collectionName), where(field, '==', value))
  const snap = await getDocs(q)
  if (snap.empty) return

  // Firestore batches max 500 operaties
  const batches: ReturnType<typeof writeBatch>[] = []
  let batch = writeBatch(firestore)
  let count = 0
  for (const d of snap.docs) {
    batch.delete(d.ref)
    count++
    if (count % 500 === 0) {
      batches.push(batch)
      batch = writeBatch(firestore)
    }
  }
  batches.push(batch)
  await Promise.all(batches.map(b => b.commit()))
}
