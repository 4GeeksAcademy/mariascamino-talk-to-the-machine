"use client"

import { useCallback, useEffect, useState } from "react"
import { ChatHeader } from "@/components/chat-header"
import { ChatInput } from "@/components/chat-input"
import { ChatThread } from "@/components/chat-thread"
import { ConversationList } from "@/components/conversation-list"
import { TokenStats } from "@/components/token-stats"
import {
  createEmptyConversation,
  createId,
  DEFAULT_MODEL,
  type Conversation,
  type Message,
  type ModelId,
} from "@/lib/chat-data"

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY
const STORAGE_KEY = "groq-chat-console:v1"

export default function Page() {
  // Start EMPTY on both server and client. The real conversation (which
  // needs Date.now()/localStorage, both client-only) is created inside the
  // effect below. This avoids the hydration mismatch the v0 preview showed.
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string>("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // Load saved history from localStorage on mount (or start fresh).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as { conversations: Conversation[]; activeId: string }
        if (parsed.conversations?.length) {
          setConversations(parsed.conversations)
          setActiveId(parsed.activeId ?? parsed.conversations[0].id)
          setHydrated(true)
          return
        }
      }
    } catch (e) {
      console.warn("No se pudo leer el historial guardado:", e)
    }
    const fresh = createEmptyConversation()
    setConversations([fresh])
    setActiveId(fresh.id)
    setHydrated(true)
  }, [])

  // Save to localStorage every time the conversations change.
  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ conversations, activeId }))
  }, [conversations, activeId, hydrated])

  const active = conversations.find((c) => c.id === activeId) ?? conversations[0]

  const updateConversation = useCallback(
    (id: string, updater: (c: Conversation) => Conversation) => {
      setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)))
    },
    [],
  )

  const handleNew = useCallback(() => {
    const conv = createEmptyConversation(active?.model ?? DEFAULT_MODEL)
    setConversations((prev) => [conv, ...prev])
    setActiveId(conv.id)
  }, [active?.model])

  const handleModelChange = useCallback(
    (model: ModelId) => {
      if (!active) return
      updateConversation(active.id, (c) => ({ ...c, model }))
    },
    [active, updateConversation],
  )

  // Requirement: resets the message state AND wipes localStorage.
  const handleClear = useCallback(() => {
    const fresh = createEmptyConversation(active?.model ?? DEFAULT_MODEL)
    setConversations([fresh])
    setActiveId(fresh.id)
    setError(null)
    window.localStorage.removeItem(STORAGE_KEY)
  }, [active?.model])

  const handleSend = useCallback(
    async (text: string) => {
      if (pending || !active) return

      if (!GROQ_API_KEY) {
        setError(
          "Falta la API key de Groq. Agrega NEXT_PUBLIC_GROQ_API_KEY en .env.local y reinicia el servidor (npm run dev).",
        )
        return
      }

      const userMessage: Message = {
        id: createId("m"),
        role: "user",
        content: text,
        promptTokens: 0,
        completionTokens: 0,
        createdAt: Date.now(),
      }

      const isFirst = active.messages.length === 0
      const nextHistory = [...active.messages, userMessage]

      updateConversation(active.id, (c) => ({
        ...c,
        title: isFirst ? text.slice(0, 40) + (text.length > 40 ? "…" : "") : c.title,
        messages: nextHistory,
        updatedAt: Date.now(),
      }))

      setPending(true)
      setError(null)
      const startTime = performance.now()

      try {
        const response = await fetch(GROQ_ENDPOINT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: active.model,
            // Groq's API is stateless: send the FULL history every time.
            messages: nextHistory.map(({ role, content }) => ({ role, content })),
          }),
        })

        if (!response.ok) {
          const body = await response.json().catch(() => null)
          const detail = body?.error?.message
          throw new Error(
            detail
              ? `Groq respondió con un error (${response.status}): ${detail}`
              : `Groq respondió con un error (${response.status}). Intenta de nuevo en unos segundos.`,
          )
        }

        const data = await response.json()
        const elapsedMs = performance.now() - startTime
        const reply = data.choices?.[0]?.message?.content ?? "(sin contenido)"

        const usage = data.usage ?? {}
        const promptTokens = usage.prompt_tokens ?? 0
        const completionTokens = usage.completion_tokens ?? 0
        const totalTokens = usage.total_tokens ?? promptTokens + completionTokens
        const tokensPerSecond = completionTokens > 0 ? completionTokens / (elapsedMs / 1000) : 0

        const assistantMessage: Message = {
          id: createId("m"),
          role: "assistant",
          content: reply,
          promptTokens,
          completionTokens,
          createdAt: Date.now(),
        }

        updateConversation(active.id, (c) => ({
          ...c,
          messages: [
            ...c.messages.map((m) => (m.id === userMessage.id ? { ...m, promptTokens } : m)),
            assistantMessage,
          ],
          updatedAt: Date.now(),
          usage: {
            promptTokens: c.usage.promptTokens + promptTokens,
            completionTokens: c.usage.completionTokens + completionTokens,
            totalTokens: c.usage.totalTokens + totalTokens,
          },
          lastCall: {
            model: data.model || active.model,
            responseTimeMs: elapsedMs,
            tokensPerSecond,
            promptTokens,
            completionTokens,
            totalTokens,
          },
        }))
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo contactar a Groq. Revisa tu conexión e intenta de nuevo.",
        )
      } finally {
        setPending(false)
      }
    },
    [active, pending, updateConversation],
  )

  if (!hydrated || !active) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-sm text-muted-foreground">
        Cargando…
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <ConversationList
        conversations={conversations}
        activeId={active.id}
        onSelect={setActiveId}
        onNew={handleNew}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <ChatHeader conversation={active} onModelChange={handleModelChange} onClear={handleClear} />
        <ChatThread conversation={active} pending={pending} />
        {error && (
          <div className="mx-6 mb-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            ⚠️ {error}
          </div>
        )}
        <ChatInput onSend={handleSend} disabled={pending} />
      </main>
      <TokenStats conversation={active} />
    </div>
  )
}
