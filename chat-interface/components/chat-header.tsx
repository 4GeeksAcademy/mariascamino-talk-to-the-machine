"use client"

import { ChevronDown } from "lucide-react"
import { MODELS, type Conversation, type ModelId } from "@/lib/chat-data"

interface Props {
  conversation: Conversation
  onModelChange: (model: ModelId) => void
}

export function ChatHeader({ conversation, onModelChange }: Props) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold text-foreground">{conversation.title}</h1>
        <p className="text-xs text-muted-foreground">
          {conversation.messages.length} messages
        </p>
      </div>
      <div className="relative">
        <label htmlFor="model-select" className="sr-only">
          Select model
        </label>
        <select
          id="model-select"
          value={conversation.model}
          onChange={(e) => onModelChange(e.target.value as ModelId)}
          className="appearance-none rounded-md border border-border bg-background py-1.5 pl-3 pr-8 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
        >
          {Object.values(MODELS).map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    </header>
  )
}
