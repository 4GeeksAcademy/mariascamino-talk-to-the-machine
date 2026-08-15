export type Role = "user" | "assistant"

export interface Message {
  id: string
  role: Role
  content: string
  // Tokens billed by Groq for the API call this message belongs to.
  // User message -> prompt tokens Groq counted for that turn.
  // Assistant message -> completion tokens Groq generated for that turn.
  promptTokens: number
  completionTokens: number
  createdAt: number
}

export interface UsageTotals {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface LastCallMetrics {
  model: string
  responseTimeMs: number
  tokensPerSecond: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface Conversation {
  id: string
  title: string
  model: ModelId
  messages: Message[]
  updatedAt: number
  // Cumulative usage for this conversation, taken directly from Groq's
  // `usage` object on every response — never re-derived from the message
  // list, so it can't get double-counted.
  usage: UsageTotals
  lastCall: LastCallMetrics | null
}

// Real Llama 3 model ids available on Groq's free tier.
export type ModelId = "llama-3.1-8b-instant" | "llama-3.3-70b-versatile"

export interface ModelInfo {
  id: ModelId
  label: string
  contextWindow: number
  /** USD per 1M tokens */
  inputPrice: number
  outputPrice: number
}

export const MODELS: Record<ModelId, ModelInfo> = {
  "llama-3.1-8b-instant": {
    id: "llama-3.1-8b-instant",
    label: "Llama 3.1 8B Instant",
    contextWindow: 131072,
    inputPrice: 0.05,
    outputPrice: 0.08,
  },
  "llama-3.3-70b-versatile": {
    id: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B Versatile",
    contextWindow: 131072,
    inputPrice: 0.59,
    outputPrice: 0.79,
  },
}

export const DEFAULT_MODEL: ModelId = "llama-3.1-8b-instant"

/**
 * Rough LIVE estimate shown in the input box while typing, before the
 * message is sent. The real, billed counts always come from Groq's
 * `usage` object once a response arrives — this is only a preview and is
 * never used for the accumulated totals.
 */
export function estimateTokens(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  const byChars = Math.ceil(trimmed.length / 4)
  const byWords = Math.ceil(trimmed.split(/\s+/).length * 1.3)
  return Math.max(1, Math.round((byChars + byWords) / 2))
}

export function costForUsage(usage: UsageTotals, model: ModelInfo): number {
  return (
    (usage.promptTokens / 1_000_000) * model.inputPrice +
    (usage.completionTokens / 1_000_000) * model.outputPrice
  )
}

let idCounter = 0
export function createId(prefix = "id"): string {
  idCounter += 1
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`
}

/**
 * Always call this from a useEffect (client-only), never from a
 * top-level useState initializer that also runs during SSR — it uses
 * Date.now(), which would produce a different value on the server than
 * on the client and trigger a hydration mismatch.
 */
export function createEmptyConversation(model: ModelId = DEFAULT_MODEL): Conversation {
  return {
    id: createId("conv"),
    title: "New chat",
    model,
    messages: [],
    updatedAt: Date.now(),
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    lastCall: null,
  }
}
