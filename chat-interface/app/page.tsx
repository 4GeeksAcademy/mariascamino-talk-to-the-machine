"use client"

import { useCallback, useMemo, useState } from "react"
import { ChatHeader } from "@/components/chat-header"
import { ChatInput } from "@/components/chat-input"
import { ChatThread } from "@/components/chat-thread"
import { ConversationList } from "@/components/conversation-list"
import { TokenStats } from "@/components/token-stats"
import {
  createId,
  estimateTokens,
  generateReply,
  initialConversations,
  type Conversation,
  type Message,
  type ModelId,
} from "@/lib/chat-data"

export default function Page() {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [activeId, setActiveId] = useState(initialConversations[0].id)
  const [pending, setPending] = useState(false)

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? conversations[0],
    [conversations, activeId],
  )

  const updateConversation = useCallback(
    (id: string, updater: (c: Conversation) => Conversation) => {
      setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)))
    },
    [],
  )

  const handleNew = useCallback(() => {
    const conv: Conversation = {
      id: createId("conv"),
      title: "New chat",
      model: active?.model ?? "gpt-4o",
      messages: [],
      updatedAt: Date.now(),
    }
    setConversations((prev) => [conv, ...prev])
    setActiveId(conv.id)
  }, [active?.model])

  const handleModelChange = useCallback(
    (model: ModelId) => {
      updateConversation(activeId, (c) => ({ ...c, model }))
    },
    [activeId, updateConversation],
  )

  const handleSend = useCallback(
    (text: string) => {
      if (pending) return
      const conv = conversations.find((c) => c.id === activeId)
      if (!conv) return

      const priorTokens = conv.messages.reduce(
        (sum, m) => sum + m.promptTokens + m.completionTokens,
        0,
      )
      const userTokens = estimateTokens(text)
      // Prompt tokens sent = full running context + the new message.
      const promptTokens = priorTokens + userTokens

      const userMessage: Message = {
        id: createId("m"),
        role: "user",
        content: text,
        promptTokens,
        completionTokens: 0,
        createdAt: Date.now(),
      }

      const isFirst = conv.messages.length === 0
      updateConversation(activeId, (c) => ({
        ...c,
        title: isFirst ? text.slice(0, 40) + (text.length > 40 ? "…" : "") : c.title,
        messages: [...c.messages, userMessage],
        updatedAt: Date.now(),
      }))

      setPending(true)
      window.setTimeout(() => {
        const replyText = generateReply(conv.messages.length + text.length)
        const assistantMessage: Message = {
          id: createId("m"),
          role: "assistant",
          content: replyText,
          promptTokens,
          completionTokens: estimateTokens(replyText),
          createdAt: Date.now(),
        }
        updateConversation(activeId, (c) => ({
          ...c,
          messages: [...c.messages, assistantMessage],
          updatedAt: Date.now(),
        }))
        setPending(false)
      }, 900)
    },
    [activeId, conversations, pending, updateConversation],
  )

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={handleNew}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <ChatHeader conversation={active} onModelChange={handleModelChange} />
        <ChatThread conversation={active} pending={pending} />
        <ChatInput onSend={handleSend} disabled={pending} />
      </main>
      <TokenStats conversation={active} />
    </div>
  )
}
