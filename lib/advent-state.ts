// Modelo de datos compartido entre el Cloudflare Worker y el modo local del navegador.
// Funciones puras: reciben el estado y devuelven uno nuevo.

export interface OpenedGift {
  gift_id: number
  opened_at: string
}

export interface Comment {
  id: string
  gift_id: number
  comment: string
  author_name: string
  created_at: string
}

export interface AdventState {
  opened: OpenedGift[]
  likes: Record<string, boolean>
  comments: Comment[]
}

export const MAX_COMMENT_LENGTH = 500
export const MAX_AUTHOR_LENGTH = 40

export function emptyState(): AdventState {
  return { opened: [], likes: {}, comments: [] }
}

// Acepta datos guardados con forma parcial o corrupta
export function normalizeState(raw: unknown): AdventState {
  const s = (raw && typeof raw === "object" ? raw : {}) as Partial<AdventState>
  return {
    opened: Array.isArray(s.opened) ? s.opened : [],
    likes: s.likes && typeof s.likes === "object" ? s.likes : {},
    comments: Array.isArray(s.comments) ? s.comments : [],
  }
}

export function isValidGiftId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 31
}

export function openGift(state: AdventState, giftId: number, now = new Date()): AdventState {
  const opened = state.opened.filter((g) => g.gift_id !== giftId)
  opened.push({ gift_id: giftId, opened_at: now.toISOString() })
  return { ...state, opened }
}

export function toggleLike(state: AdventState, giftId: number): { state: AdventState; liked: boolean } {
  const liked = !state.likes[String(giftId)]
  return { state: { ...state, likes: { ...state.likes, [String(giftId)]: liked } }, liked }
}

export function addComment(
  state: AdventState,
  giftId: number,
  text: string,
  authorName: string,
  id: string,
  now = new Date()
): { state: AdventState; comment: Comment } {
  const comment: Comment = {
    id,
    gift_id: giftId,
    comment: text.trim().slice(0, MAX_COMMENT_LENGTH),
    author_name: (authorName.trim() || "Ale").slice(0, MAX_AUTHOR_LENGTH),
    created_at: now.toISOString(),
  }
  return { state: { ...state, comments: [...state.comments, comment] }, comment }
}

export function deleteComment(state: AdventState, commentId: string): AdventState {
  return { ...state, comments: state.comments.filter((c) => c.id !== commentId) }
}

// ===== Lecturas =====

export function openedGiftIds(state: AdventState): Set<number> {
  return new Set([...state.opened].sort((a, b) => a.opened_at.localeCompare(b.opened_at)).map((g) => g.gift_id))
}

export function lastOpenedDate(state: AdventState): string | null {
  if (state.opened.length === 0) return null
  return state.opened.reduce((max, g) => (g.opened_at > max ? g.opened_at : max), state.opened[0].opened_at)
}

export function commentsFor(state: AdventState, giftId: number): Comment[] {
  return state.comments
    .filter((c) => c.gift_id === giftId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export function isLiked(state: AdventState, giftId: number): boolean {
  return Boolean(state.likes[String(giftId)])
}
