"use client"

import { Bot, User } from "lucide-react"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import type { Conversation, Message } from "@/lib/chat-data"

function MessageRow({ message }: { message: Message }) {
  const isUser = message.role === "user"
  const tokens = isUser ? message.promptTokens : message.completionTokens
  return (
    <div className="flex gap-3 px-6 py-5">
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md",
          isUser ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground",
        )}
        aria-hidden="true"
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {isUser ? "You" : "Assistant"}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {tokens} {isUser ? "prompt" : "completion"} tok
          </span>
        </div>
        <p className="text-pretty text-sm leading-relaxed text-foreground/90">{message.content}</p>
      </div>
    </div>
  )
}

interface Props {
  conversation: Conversation
  pending: boolean
}

export function ChatThread({ conversation, pending }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation.messages.length, pending])

  return (
    <div className="flex-1 overflow-y-auto">
      {conversation.messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center px-6 text-center">
          <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="size-5" aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Start a new conversation</h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Send a message below. Token usage and estimated cost update live in the sidebar.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {conversation.messages.map((m) => (
            <MessageRow key={m.id} message={m} />
          ))}
          {pending && (
            <div className="flex gap-3 px-6 py-5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Bot className="size-4" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-1 pt-2" aria-label="Assistant is typing">
                <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="size-2 animate-bounce rounded-full bg-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
