"use client"

import { ArrowDownToLine, ArrowUpFromLine, Clock, Coins, Gauge, Zap } from "lucide-react"
import { MODELS, costForUsage, type Conversation } from "@/lib/chat-data"

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
  const { usage, lastCall } = conversation

  const totalCost = costForUsage(usage, model)

  // Current context size = the last API call's prompt + completion tokens
  // (that call already included the full history up to that point).
  const contextUsed = lastCall ? lastCall.promptTokens + lastCall.completionTokens : 0
  const contextPct = Math.min(100, (contextUsed / model.contextWindow) * 100)

  const promptPct = usage.totalTokens ? (usage.promptTokens / usage.totalTokens) * 100 : 0
  const completionPct = usage.totalTokens ? (usage.completionTokens / usage.totalTokens) * 100 : 0

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
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Total tokens
          </p>
          <p className="mt-1 font-mono text-4xl font-semibold tabular-nums text-foreground">
            {usage.totalTokens.toLocaleString()}
          </p>
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

        <div className="grid grid-cols-2 gap-2.5">
          <StatCard
            icon={<ArrowUpFromLine className="size-3.5" aria-hidden="true" />}
            label="Prompt"
            value={usage.promptTokens.toLocaleString()}
            sub={`$${model.inputPrice}/M`}
          />
          <StatCard
            icon={<ArrowDownToLine className="size-3.5" aria-hidden="true" />}
            label="Completion"
            value={usage.completionTokens.toLocaleString()}
            sub={`$${model.outputPrice}/M`}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <StatCard
            icon={<Clock className="size-3.5" aria-hidden="true" />}
            label="Response time"
            value={lastCall ? `${Math.round(lastCall.responseTimeMs)} ms` : "—"}
          />
          <StatCard
            icon={<Zap className="size-3.5" aria-hidden="true" />}
            label="Tokens / sec"
            value={lastCall ? lastCall.tokensPerSecond.toFixed(1) : "—"}
          />
        </div>

        <StatCard
          icon={<Coins className="size-3.5" aria-hidden="true" />}
          label="Estimated cost"
          value={`$${totalCost.toFixed(4)}`}
          sub={`${model.label} pricing`}
        />

        <div className="rounded-lg border border-border bg-card p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Context window
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {contextPct > 0 && contextPct < 1 ? "<1" : Math.round(contextPct)}%
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${contextUsed ? Math.max(contextPct, 1.5) : 0}%` }}
              aria-hidden="true"
            />
          </div>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            {contextUsed.toLocaleString()} / {model.contextWindow.toLocaleString()} tok
          </p>
        </div>

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
