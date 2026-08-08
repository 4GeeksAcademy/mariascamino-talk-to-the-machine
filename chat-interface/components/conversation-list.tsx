"use client"

import { MessagesSquare, Plus, Search } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { MODELS, type Conversation } from "@/lib/chat-data"

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.round(diff / 60000)
  if (min < 1) return "just now"
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  return `${day}d ago`
}

interface Props {
  conversations: Conversation[]
  activeId: string
  onSelect: (id: string) => void
  onNew: () => void
}

export function ConversationList({ conversations, activeId, onSelect, onNew }: Props) {
  const [query, setQuery] = useState("")

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(query.trim().toLowerCase()),
  )

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <MessagesSquare className="size-4" aria-hidden="true" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
          Token Console
        </span>
      </div>

      <div className="px-3">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" aria-hidden="true" />
          New chat
        </button>
      </div>

      <div className="px-3 pb-2 pt-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            aria-label="Search conversations"
            className="w-full rounded-md border border-sidebar-border bg-background py-2 pl-8 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-sidebar-ring"
          />
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4" aria-label="Conversation history">
        <p className="px-1 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          History
        </p>
        {filtered.length === 0 && (
          <p className="px-1 py-6 text-center text-sm text-muted-foreground">No chats found.</p>
        )}
        {filtered.map((c) => {
          const active = c.id === activeId
          const last = c.messages[c.messages.length - 1]
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "group w-full rounded-md px-2.5 py-2 text-left transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{c.title}</span>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {relativeTime(c.updatedAt)}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="rounded bg-background/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {MODELS[c.model].label}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {last ? last.content : "Empty conversation"}
                </span>
              </div>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
