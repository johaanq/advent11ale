// API de Advent11Ale en Cloudflare Workers + KV.
// Guarda regalos abiertos, likes y comentarios en una sola clave de KV.

import {
  addComment,
  deleteComment,
  isValidGiftId,
  MAX_AUTHOR_LENGTH,
  MAX_COMMENT_LENGTH,
  normalizeState,
  openGift,
  toggleLike,
  emptyState,
  type AdventState,
} from "../../lib/advent-state"

// Tipos mínimos para no depender de @cloudflare/workers-types
interface KVNamespace {
  get(key: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
}

interface Env {
  ADVENT_KV: KVNamespace
  // Orígenes permitidos separados por coma, o "*" para cualquiera
  ALLOWED_ORIGINS?: string
  // Secreto para POST /api/reset (wrangler secret put RESET_TOKEN)
  RESET_TOKEN?: string
}

// Una clave por año: "state:2026", "state:2025", ...
const stateKey = (year: number) => `state:${year}`

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS ?? "*").split(",").map((s) => s.trim())
  const origin = request.headers.get("Origin") ?? ""
  const allowOrigin = allowed.includes("*") ? "*" : allowed.includes(origin) ? origin : allowed[0] ?? ""
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  }
}

function json(data: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...cors },
  })
}

async function loadState(env: Env, key: string): Promise<AdventState> {
  const raw = await env.ADVENT_KV.get(key)
  if (!raw) return emptyState()
  try {
    return normalizeState(JSON.parse(raw))
  } catch {
    return emptyState()
  }
}

async function saveState(env: Env, key: string, state: AdventState) {
  await env.ADVENT_KV.put(key, JSON.stringify(state))
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json()
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request, env)
    const url = new URL(request.url)
    const path = url.pathname.replace(/\/+$/, "")

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors })

    // Cada edición (año) tiene sus propios datos
    const year = Number(url.searchParams.get("year"))
    if (!Number.isInteger(year) || year < 2020 || year > 2100) {
      return json({ error: "year inválido" }, 400, cors)
    }
    const key = stateKey(year)

    try {
      // Estado completo del año (es pequeño: unos regalos y comentarios)
      if (request.method === "GET" && path === "/api/state") {
        return json(await loadState(env, key), 200, cors)
      }

      if (request.method === "POST" && path === "/api/open") {
        const { giftId } = await readBody(request)
        if (!isValidGiftId(giftId)) return json({ error: "giftId inválido" }, 400, cors)
        const state = openGift(await loadState(env, key), giftId)
        await saveState(env, key, state)
        return json({ ok: true, state }, 200, cors)
      }

      if (request.method === "POST" && path === "/api/like") {
        const { giftId } = await readBody(request)
        if (!isValidGiftId(giftId)) return json({ error: "giftId inválido" }, 400, cors)
        const result = toggleLike(await loadState(env, key), giftId)
        await saveState(env, key, result.state)
        return json({ liked: result.liked }, 200, cors)
      }

      if (request.method === "POST" && path === "/api/comments") {
        const { giftId, comment, authorName } = await readBody(request)
        if (!isValidGiftId(giftId)) return json({ error: "giftId inválido" }, 400, cors)
        if (typeof comment !== "string" || !comment.trim() || comment.length > MAX_COMMENT_LENGTH) {
          return json({ error: "comentario inválido" }, 400, cors)
        }
        const author =
          typeof authorName === "string" && authorName.length <= MAX_AUTHOR_LENGTH ? authorName : "Ale"
        const result = addComment(await loadState(env, key), giftId, comment, author, crypto.randomUUID())
        await saveState(env, key, result.state)
        return json({ comment: result.comment }, 201, cors)
      }

      const deleteMatch = path.match(/^\/api\/comments\/([\w-]{1,64})$/)
      if (request.method === "DELETE" && deleteMatch) {
        const state = deleteComment(await loadState(env, key), deleteMatch[1])
        await saveState(env, key, state)
        return json({ ok: true }, 200, cors)
      }

      // Volver a cerrar los regalos: solo con el secreto RESET_TOKEN
      if (request.method === "POST" && path === "/api/reset") {
        const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "")
        if (!env.RESET_TOKEN || token !== env.RESET_TOKEN) return json({ error: "no autorizado" }, 401, cors)
        await saveState(env, key, { ...(await loadState(env, key)), opened: [] })
        return json({ ok: true }, 200, cors)
      }

      return json({ error: "no encontrado" }, 404, cors)
    } catch (error) {
      console.error(error)
      return json({ error: "error interno" }, 500, cors)
    }
  },
}
