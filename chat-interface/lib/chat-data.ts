export type Role = "user" | "assistant"

export interface Message {
  id: string
  role: Role
  content: string
  promptTokens: number
  completionTokens: number
  createdAt: number
}

export interface Conversation {
  id: string
  title: string
  model: ModelId
  messages: Message[]
  updatedAt: number
}

export type ModelId = "gpt-4o" | "claude-sonnet" | "llama-3.1-70b"

export interface ModelInfo {
  id: ModelId
  label: string
  contextWindow: number
  /** USD per 1M tokens */
  inputPrice: number
  outputPrice: number
}

export const MODELS: Record<ModelId, ModelInfo> = {
  "gpt-4o": {
    id: "gpt-4o",
    label: "GPT-4o",
    contextWindow: 128000,
    inputPrice: 2.5,
    outputPrice: 10,
  },
  "claude-sonnet": {
    id: "claude-sonnet",
    label: "Claude Sonnet",
    contextWindow: 200000,
    inputPrice: 3,
    outputPrice: 15,
  },
  "llama-3.1-70b": {
    id: "llama-3.1-70b",
    label: "Llama 3.1 70B",
    contextWindow: 131072,
    inputPrice: 0.59,
    outputPrice: 0.79,
  },
}

/**
 * Rough token estimator. ~4 chars per token is the common heuristic used to
 * approximate BPE tokenization for English text.
 */
export function estimateTokens(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  const byChars = Math.ceil(trimmed.length / 4)
  const byWords = Math.ceil(trimmed.split(/\s+/).length * 1.3)
  return Math.max(1, Math.round((byChars + byWords) / 2))
}

export function costForMessage(message: Message, model: ModelInfo): number {
  return (
    (message.promptTokens / 1_000_000) * model.inputPrice +
    (message.completionTokens / 1_000_000) * model.outputPrice
  )
}

let idCounter = 0
export function createId(prefix = "id"): string {
  idCounter += 1
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`
}

const now = Date.now()

export const initialConversations: Conversation[] = [
  {
    id: "conv_react_perf",
    title: "React render performance",
    model: "gpt-4o",
    updatedAt: now - 1000 * 60 * 4,
    messages: [
      {
        id: "m1",
        role: "user",
        content: "My React list re-renders on every keystroke. How do I stop that?",
        promptTokens: 18,
        completionTokens: 0,
        createdAt: now - 1000 * 60 * 12,
      },
      {
        id: "m2",
        role: "assistant",
        content:
          "A few things usually cause this. First, memoize the list with React.memo so it only re-renders when its props change. Second, keep the input's value in a separate component so typing doesn't re-render siblings. Third, pass stable callbacks with useCallback. Want me to show a before/after for your component?",
        promptTokens: 18,
        completionTokens: 74,
        createdAt: now - 1000 * 60 * 11,
      },
      {
        id: "m3",
        role: "user",
        content: "Yes, show a before and after.",
        promptTokens: 110,
        completionTokens: 0,
        createdAt: now - 1000 * 60 * 5,
      },
      {
        id: "m4",
        role: "assistant",
        content:
          "Before: the input and the list live in the same component, so setState on every keystroke re-renders the whole tree. After: split the input into its own component and wrap the list in React.memo. Now typing only updates the input, and the list re-renders solely when the items array actually changes.",
        promptTokens: 110,
        completionTokens: 82,
        createdAt: now - 1000 * 60 * 4,
      },
    ],
  },
  {
    id: "conv_sql_index",
    title: "Postgres index strategy",
    model: "claude-sonnet",
    updatedAt: now - 1000 * 60 * 60 * 3,
    messages: [
      {
        id: "n1",
        role: "user",
        content: "Should I add a composite index on (user_id, created_at) for my feed query?",
        promptTokens: 24,
        completionTokens: 0,
        createdAt: now - 1000 * 60 * 60 * 3,
      },
      {
        id: "n2",
        role: "assistant",
        content:
          "Yes — if you filter by user_id and order by created_at, a composite index on (user_id, created_at DESC) lets Postgres satisfy both the filter and the sort from one index, avoiding a separate sort step. Put the equality column first, the range/sort column second.",
        promptTokens: 24,
        completionTokens: 66,
        createdAt: now - 1000 * 60 * 60 * 3 + 4000,
      },
    ],
  },
  {
    id: "conv_copy",
    title: "Landing page headline ideas",
    model: "llama-3.1-70b",
    updatedAt: now - 1000 * 60 * 60 * 26,
    messages: [
      {
        id: "p1",
        role: "user",
        content: "Give me 3 headline options for a developer analytics tool.",
        promptTokens: 16,
        completionTokens: 0,
        createdAt: now - 1000 * 60 * 60 * 26,
      },
      {
        id: "p2",
        role: "assistant",
        content:
          "1) Ship faster, guess less. 2) The metrics your code has been hiding. 3) Every request, measured. Want them punchier or more corporate?",
        promptTokens: 16,
        completionTokens: 38,
        createdAt: now - 1000 * 60 * 60 * 26 + 3000,
      },
    ],
  },
]

const SAMPLE_REPLIES = [
  "Good question. The short version: isolate the state that changes often, memoize the parts that don't, and measure with the React Profiler before optimizing further.",
  "Here's how I'd approach it. Break the problem into the smallest reproducible case first, then apply the fix incrementally so you can confirm each step actually helps.",
  "That trade-off comes down to read vs. write frequency. If you read far more than you write, denormalizing and indexing aggressively usually wins.",
  "You can do this in a few lines. Keep the logic pure, push side effects to the edges, and it becomes much easier to test and reason about.",
  "Absolutely. I'd start with the data model since everything else depends on it, then layer the API and UI on top once the shape is stable.",
]

export function generateReply(seed: number): string {
  return SAMPLE_REPLIES[seed % SAMPLE_REPLIES.length]
}
