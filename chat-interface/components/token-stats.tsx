"use client"

import { ArrowDownToLine, ArrowUpFromLine, Coins, Gauge } from "lucide-react"
import { MODELS, costForMessage, type Conversation } from "@/lib/chat-data"

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1.5 font-mono text-lg font-semibold tabular-nums text-foreground">{value}</p>
      {sub && <p className="font-mono text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

export function TokenStats({ conversation }: { conversation: Conversation }) {
  const model = MODELS[conversation.model]

  const promptTokens = conversation.messages.reduce((sum, m) => sum + m.promptTokens, 0)
  const completionTokens = conversation.messages.reduce((sum, m) => sum + m.completionTokens, 0)
  const totalTokens = promptTokens + completionTokens

  const totalCost = conversation.messages.reduce((sum, m) => sum + costForMessage(m, model), 0)

  const contextUsed = conversation.messages.length
    ? Math.max(
        ...conversation.messages.map((m) => m.promptTokens + m.completionTokens),
        conversation.messages[conversation.messages.length - 1]?.promptTokens ?? 0,
      )
    : 0
  const contextPct = Math.min(100, (contextUsed / model.contextWindow) * 100)

  const promptPct = totalTokens ? (promptTokens / totalTokens) * 100 : 0
  const completionPct = totalTokens ? (completionTokens / totalTokens) * 100 : 0

  const exchanges = conversation.messages.filter((m) => m.role === "assistant").length

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col overflow-y-auto border-l border-border bg-background">
      <div className="border-b border-border px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Gauge className="size-4 text-primary" aria-hidden="true" />
          Token Usage
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {model.label} · {exchanges} {exchanges === 1 ? "response" : "responses"}
        </p>
      </div>

      <div className="space-y-5 px-5 py-5">
        {/* Total tokens hero */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Total tokens
          </p>
          <p className="mt-1 font-mono text-4xl font-semibold tabular-nums text-foreground">
            {totalTokens.toLocaleString()}
          </p>
          {/* Split bar: prompt vs completion */}
          <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-chart-1 transition-all duration-500"
              style={{ width: `${promptPct}%` }}
              aria-hidden="true"
            />
            <div
              className="h-full bg-chart-5 transition-all duration-500"
              style={{ width: `${completionPct}%` }}
              aria-hidden="true"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full bg-chart-1" aria-hidden="true" />
              Prompt {Math.round(promptPct)}%
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full bg-chart-5" aria-hidden="true" />
              Completion {Math.round(completionPct)}%
            </span>
          </div>
        </div>

        {/* Breakdown cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard
            icon={<ArrowUpFromLine className="size-3.5" aria-hidden="true" />}
            label="Prompt"
            value={promptTokens.toLocaleString()}
            sub={`$${model.inputPrice}/M`}
          />
          <StatCard
            icon={<ArrowDownToLine className="size-3.5" aria-hidden="true" />}
            label="Completion"
            value={completionTokens.toLocaleString()}
            sub={`$${model.outputPrice}/M`}
          />
        </div>

        <StatCard
          icon={<Coins className="size-3.5" aria-hidden="true" />}
          label="Estimated cost"
          value={`$${totalCost.toFixed(4)}`}
          sub={`${MODELS[conversation.model].label} pricing`}
        />

        {/* Context window meter */}
        <div className="rounded-lg border border-border bg-card p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Context window
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {contextPct < 1 ? "<1" : Math.round(contextPct)}%
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.max(contextPct, 1.5)}%` }}
              aria-hidden="true"
            />
          </div>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            {contextUsed.toLocaleString()} / {model.contextWindow.toLocaleString()} tok
          </p>
        </div>

        {/* Per-message log */}
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Per-message log
          </p>
          <div className="space-y-1.5">
            {conversation.messages.length === 0 && (
              <p className="text-xs text-muted-foreground">No messages yet.</p>
            )}
            {conversation.messages.map((m, i) => {
              const t = m.role === "user" ? m.promptTokens : m.completionTokens
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-2 rounded-md bg-card px-2.5 py-1.5"
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={
                        m.role === "user"
                          ? "text-xs font-medium text-chart-1"
                          : "text-xs font-medium text-primary"
                      }
                    >
                      {m.role === "user" ? "prompt" : "output"}
                    </span>
                  </span>
                  <span className="font-mono text-xs tabular-nums text-foreground">
                    {t.toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
