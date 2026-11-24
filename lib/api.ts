// Acceso a datos de Advent11Ale, separado por año (edición).
// - Con NEXT_PUBLIC_API_URL: usa el Cloudflare Worker (sincroniza entre dispositivos).
// - Sin ella: modo 100% local en el navegador (localStorage).

import {
  addComment as addCommentToState,
  commentsFor,
  deleteComment as deleteCommentFromState,
  emptyState,
  isLiked,
  lastOpenedDate,
  normalizeState,
  openedGiftIds,
  openGift as openGiftInState,
  toggleLike as toggleLikeInState,
  type AdventState,
  type Comment,
} from "./advent-state"

export type { Comment } from "./advent-state"

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "")
const POLL_MS = 6000

export const isRemote = API_URL !== ""

const localKey = (year: number) => `advent11ale-state-${year}`

// ===== Almacenamiento =====

function readLocal(year: number): AdventState {
  try {
    const raw = localStorage.getItem(localKey(year))
    return raw ? normalizeState(JSON.parse(raw)) : emptyState()
  } catch {
    return emptyState()
  }
}

function writeLocal(year: number, state: AdventState) {
  try {
    localStorage.setItem(localKey(year), JSON.stringify(state))
  } catch {
    // Almacenamiento no disponible (modo privado, etc.)
  }
  notifyChange()
}

async function request<T>(year: number, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}?year=${year}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`)
  return res.json() as Promise<T>
}

// Evita pedir el mismo estado varias veces a la vez
const inflight = new Map<number, Promise<AdventState>>()

async function fetchState(year: number): Promise<AdventState> {
  if (!isRemote) return readLocal(year)
  let pending = inflight.get(year)
  if (!pending) {
    pending = request<AdventState>(year, "/api/state")
      .then(normalizeState)
      .finally(() => setTimeout(() => inflight.delete(year), 300))
    inflight.set(year, pending)
  }
  return pending
}

// ===== Suscripciones (sondeo periódico en lugar de tiempo real) =====

const listeners = new Set<() => void>()
function notifyChange() {
  listeners.forEach((fn) => fn())
}
function refreshAfterWrite(year: number) {
  inflight.delete(year)
  notifyChange()
}

function serialize(value: unknown) {
  return JSON.stringify(value instanceof Set ? [...value] : value)
}

function subscribe<T>(year: number, select: (state: AdventState) => T, callback: (value: T) => void) {
  let last = ""
  let stopped = false

  const check = async () => {
    try {
      const value = select(await fetchState(year))
      const key = serialize(value)
      if (!stopped && key !== last) {
        last = key
        callback(value)
      }
    } catch {
      // Error de red: se reintenta en el siguiente ciclo
    }
  }

  // Valor de referencia sin disparar el callback (ya se cargó al montar)
  fetchState(year)
    .then((s) => (last = serialize(select(s))))
    .catch(() => {})

  const interval = isRemote ? setInterval(check, POLL_MS) : null
  const onFocus = () => check()
  const onStorage = (e: StorageEvent) => e.key === localKey(year) && check()
  window.addEventListener("focus", onFocus)
  window.addEventListener("storage", onStorage)
  listeners.add(check)

  return () => {
    stopped = true
    if (interval) clearInterval(interval)
    window.removeEventListener("focus", onFocus)
    window.removeEventListener("storage", onStorage)
    listeners.delete(check)
  }
}

// ===== Regalos =====

export async function getOpenedGifts(year: number): Promise<Set<number>> {
  try {
    return openedGiftIds(await fetchState(year))
  } catch (error) {
    console.error("Error al obtener regalos abiertos:", error)
    return new Set()
  }
}

export async function getLastGiftOpenedDate(year: number): Promise<string | null> {
  try {
    return lastOpenedDate(await fetchState(year))
  } catch (error) {
    console.error("Error al obtener última fecha:", error)
    return null
  }
}

export async function openGift(year: number, giftId: number): Promise<boolean> {
  try {
    if (isRemote) {
      await request(year, "/api/open", { method: "POST", body: JSON.stringify({ giftId }) })
      refreshAfterWrite(year)
    } else {
      writeLocal(year, openGiftInState(readLocal(year), giftId))
    }
    return true
  } catch (error) {
    console.error("Error al abrir regalo:", error)
    return false
  }
}

export function subscribeToOpenedGifts(year: number, callback: (giftIds: Set<number>) => void) {
  return subscribe(year, openedGiftIds, callback)
}

// Vuelve a cerrar todos los regalos del año (likes y comentarios se conservan).
// En modo remoto requiere el RESET_TOKEN del Worker.
export async function resetOpenedGifts(year: number, token?: string): Promise<boolean> {
  try {
    if (isRemote) {
      await request(year, "/api/reset", { method: "POST", headers: { Authorization: `Bearer ${token ?? ""}` } })
      refreshAfterWrite(year)
    } else {
      writeLocal(year, { ...readLocal(year), opened: [] })
    }
    return true
  } catch (error) {
    console.error("Error al reiniciar:", error)
    return false
  }
}

// ===== Likes =====

export async function getLikeStatus(year: number, giftId: number): Promise<boolean> {
  try {
    return isLiked(await fetchState(year), giftId)
  } catch (error) {
    console.error("Error getting like status:", error)
    return false
  }
}

export async function toggleLike(year: number, giftId: number): Promise<boolean> {
  try {
    if (isRemote) {
      const { liked } = await request<{ liked: boolean }>(year, "/api/like", {
        method: "POST",
        body: JSON.stringify({ giftId }),
      })
      refreshAfterWrite(year)
      return liked
    }
    const result = toggleLikeInState(readLocal(year), giftId)
    writeLocal(year, result.state)
    return result.liked
  } catch (error) {
    console.error("Error toggling like:", error)
    return false
  }
}

export function subscribeToLikes(year: number, giftId: number, callback: (liked: boolean) => void) {
  return subscribe(year, (s) => isLiked(s, giftId), callback)
}

// ===== Comentarios =====

export async function getComments(year: number, giftId: number): Promise<Comment[]> {
  try {
    return commentsFor(await fetchState(year), giftId)
  } catch (error) {
    console.error("Error getting comments:", error)
    return []
  }
}

export async function addComment(
  year: number,
  giftId: number,
  comment: string,
  authorName: string = "Ale"
): Promise<boolean> {
  try {
    if (isRemote) {
      await request(year, "/api/comments", {
        method: "POST",
        body: JSON.stringify({ giftId, comment, authorName }),
      })
      refreshAfterWrite(year)
    } else {
      const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now())
      writeLocal(year, addCommentToState(readLocal(year), giftId, comment, authorName, id).state)
    }
    return true
  } catch (error) {
    console.error("Error adding comment:", error)
    return false
  }
}

export async function deleteComment(year: number, commentId: string): Promise<boolean> {
  try {
    if (isRemote) {
      await request(year, `/api/comments/${encodeURIComponent(commentId)}`, { method: "DELETE" })
      refreshAfterWrite(year)
    } else {
      writeLocal(year, deleteCommentFromState(readLocal(year), commentId))
    }
    return true
  } catch (error) {
    console.error("Error deleting comment:", error)
    return false
  }
}

export function subscribeToComments(year: number, giftId: number, callback: (comments: Comment[]) => void) {
  return subscribe(year, (s) => commentsFor(s, giftId), callback)
}
