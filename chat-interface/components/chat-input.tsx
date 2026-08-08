"use client"

import { CornerDownLeft, SendHorizontal } from "lucide-react"
import { useState } from "react"
import { estimateTokens } from "@/lib/chat-data"

interface Props {
  onSend: (text: string) => void
  disabled: boolean
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("")
  const tokens = estimateTokens(value)

  function submit() {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue("")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="border-t border-border bg-card px-6 py-4">
      <div className="relative rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-ring">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="Send a message…  (Enter to send, Shift+Enter for newline)"
          aria-label="Message input"
          className="max-h-40 w-full resize-none bg-transparent px-3.5 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between gap-2 px-3 pb-2.5">
          <span className="font-mono text-[11px] text-muted-foreground">
            ~{tokens} tok
          </span>
          <button
            onClick={submit}
            disabled={disabled || !value.trim()}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
            <SendHorizontal className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
        <CornerDownLeft className="size-3" aria-hidden="true" />
        Token counts are estimates for demo purposes.
      </p>
    </div>
  )
}
