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

const STATE_KEY = "state"

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

async function loadState(env: Env): Promise<AdventState> {
  const raw = await env.ADVENT_KV.get(STATE_KEY)
  if (!raw) return emptyState()
  try {
    return normalizeState(JSON.parse(raw))
  } catch {
    return emptyState()
  }
}

async function saveState(env: Env, state: AdventState) {
  await env.ADVENT_KV.put(STATE_KEY, JSON.stringify(state))
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

    try {
      // Estado completo (es pequeño: 4 regalos y unos cuantos comentarios)
      if (request.method === "GET" && path === "/api/state") {
        return json(await loadState(env), 200, cors)
      }

      if (request.method === "POST" && path === "/api/open") {
        const { giftId } = await readBody(request)
        if (!isValidGiftId(giftId)) return json({ error: "giftId inválido" }, 400, cors)
        const state = openGift(await loadState(env), giftId)
        await saveState(env, state)
        return json({ ok: true, state }, 200, cors)
      }

      if (request.method === "POST" && path === "/api/like") {
        const { giftId } = await readBody(request)
        if (!isValidGiftId(giftId)) return json({ error: "giftId inválido" }, 400, cors)
        const result = toggleLike(await loadState(env), giftId)
        await saveState(env, result.state)
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
        const result = addComment(await loadState(env), giftId, comment, author, crypto.randomUUID())
        await saveState(env, result.state)
        return json({ comment: result.comment }, 201, cors)
      }

      const deleteMatch = path.match(/^\/api\/comments\/([\w-]{1,64})$/)
      if (request.method === "DELETE" && deleteMatch) {
        const state = deleteComment(await loadState(env), deleteMatch[1])
        await saveState(env, state)
        return json({ ok: true }, 200, cors)
      }

      // Volver a cerrar los regalos: solo con el secreto RESET_TOKEN
      if (request.method === "POST" && path === "/api/reset") {
        const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "")
        if (!env.RESET_TOKEN || token !== env.RESET_TOKEN) return json({ error: "no autorizado" }, 401, cors)
        await saveState(env, { ...(await loadState(env)), opened: [] })
        return json({ ok: true }, 200, cors)
      }

      return json({ error: "no encontrado" }, 404, cors)
    } catch (error) {
      console.error(error)
      return json({ error: "error interno" }, 500, cors)
    }
  },
}
