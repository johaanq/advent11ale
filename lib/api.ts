// Acceso a datos de Advent11Ale.
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
const LOCAL_KEY = "advent11ale-state"
const POLL_MS = 6000

export const isRemote = API_URL !== ""

// ===== Almacenamiento =====

function readLocal(): AdventState {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? normalizeState(JSON.parse(raw)) : emptyState()
  } catch {
    return emptyState()
  }
}

function writeLocal(state: AdventState) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state))
  } catch {
    // Almacenamiento no disponible (modo privado, etc.)
  }
  notifyLocalChange()
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`)
  return res.json() as Promise<T>
}

// Evita pedir el estado varias veces a la vez
let inflight: Promise<AdventState> | null = null

async function fetchState(): Promise<AdventState> {
  if (!isRemote) return readLocal()
  if (!inflight) {
    inflight = request<AdventState>("/api/state")
      .then(normalizeState)
      .finally(() => {
        setTimeout(() => (inflight = null), 300)
      })
  }
  return inflight
}

// ===== Suscripciones (sondeo periódico en lugar de tiempo real) =====

const localListeners = new Set<() => void>()
function notifyLocalChange() {
  localListeners.forEach((fn) => fn())
}

function subscribe<T>(select: (state: AdventState) => T, callback: (value: T) => void) {
  let last = ""
  let stopped = false

  const check = async () => {
    try {
      const value = select(await fetchState())
      const key = JSON.stringify(value instanceof Set ? [...value] : value)
      if (!stopped && key !== last) {
        last = key
        callback(value)
      }
    } catch {
      // Error de red: se reintenta en el siguiente ciclo
    }
  }

  // Primer valor de referencia sin disparar el callback (ya se cargó al montar)
  fetchState()
    .then((s) => {
      const v = select(s)
      last = JSON.stringify(v instanceof Set ? [...v] : v)
    })
    .catch(() => {})

  const interval = isRemote ? setInterval(check, POLL_MS) : null
  const onFocus = () => check()
  const onStorage = (e: StorageEvent) => e.key === LOCAL_KEY && check()
  window.addEventListener("focus", onFocus)
  window.addEventListener("storage", onStorage)
  localListeners.add(check)

  return () => {
    stopped = true
    if (interval) clearInterval(interval)
    window.removeEventListener("focus", onFocus)
    window.removeEventListener("storage", onStorage)
    localListeners.delete(check)
  }
}

// ===== Regalos =====

export async function getOpenedGifts(): Promise<Set<number>> {
  try {
    return openedGiftIds(await fetchState())
  } catch (error) {
    console.error("Error al obtener regalos abiertos:", error)
    return new Set()
  }
}

export async function getLastGiftOpenedDate(): Promise<string | null> {
  try {
    return lastOpenedDate(await fetchState())
  } catch (error) {
    console.error("Error al obtener última fecha:", error)
    return null
  }
}

export async function openGift(giftId: number): Promise<boolean> {
  try {
    if (isRemote) {
      await request("/api/open", { method: "POST", body: JSON.stringify({ giftId }) })
    } else {
      writeLocal(openGiftInState(readLocal(), giftId))
    }
    return true
  } catch (error) {
    console.error("Error al abrir regalo:", error)
    return false
  }
}

export function subscribeToOpenedGifts(callback: (giftIds: Set<number>) => void) {
  return subscribe(openedGiftIds, callback)
}

// Vuelve a cerrar todos los regalos (likes y comentarios se conservan).
// En modo remoto requiere el RESET_TOKEN del Worker.
export async function resetOpenedGifts(token?: string): Promise<boolean> {
  try {
    if (isRemote) {
      await request("/api/reset", { method: "POST", headers: { Authorization: `Bearer ${token ?? ""}` } })
    } else {
      writeLocal({ ...readLocal(), opened: [] })
    }
    return true
  } catch (error) {
    console.error("Error al reiniciar:", error)
    return false
  }
}

// ===== Likes =====

export async function getLikeStatus(giftId: number): Promise<boolean> {
  try {
    return isLiked(await fetchState(), giftId)
  } catch (error) {
    console.error("Error getting like status:", error)
    return false
  }
}

export async function toggleLike(giftId: number): Promise<boolean> {
  try {
    if (isRemote) {
      const { liked } = await request<{ liked: boolean }>("/api/like", {
        method: "POST",
        body: JSON.stringify({ giftId }),
      })
      return liked
    }
    const result = toggleLikeInState(readLocal(), giftId)
    writeLocal(result.state)
    return result.liked
  } catch (error) {
    console.error("Error toggling like:", error)
    return false
  }
}

export function subscribeToLikes(giftId: number, callback: (liked: boolean) => void) {
  return subscribe((s) => isLiked(s, giftId), callback)
}

// ===== Comentarios =====

export async function getComments(giftId: number): Promise<Comment[]> {
  try {
    return commentsFor(await fetchState(), giftId)
  } catch (error) {
    console.error("Error getting comments:", error)
    return []
  }
}

export async function addComment(giftId: number, comment: string, authorName: string = "Ale"): Promise<boolean> {
  try {
    if (isRemote) {
      await request("/api/comments", {
        method: "POST",
        body: JSON.stringify({ giftId, comment, authorName }),
      })
      // Refrescar para que el comentario aparezca enseguida
      inflight = null
      localListeners.forEach((fn) => fn())
    } else {
      const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now())
      writeLocal(addCommentToState(readLocal(), giftId, comment, authorName, id).state)
    }
    return true
  } catch (error) {
    console.error("Error adding comment:", error)
    return false
  }
}

export async function deleteComment(commentId: string): Promise<boolean> {
  try {
    if (isRemote) {
      await request(`/api/comments/${encodeURIComponent(commentId)}`, { method: "DELETE" })
      inflight = null
      localListeners.forEach((fn) => fn())
    } else {
      writeLocal(deleteCommentFromState(readLocal(), commentId))
    }
    return true
  } catch (error) {
    console.error("Error deleting comment:", error)
    return false
  }
}

export function subscribeToComments(giftId: number, callback: (comments: Comment[]) => void) {
  return subscribe((s) => commentsFor(s, giftId), callback)
}
