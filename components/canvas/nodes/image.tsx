"use client"

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { useCanvasStore, type AgentNodeData } from "@/lib/canvas/store"
import { Image as ImageIcon, Loader2, Play, AlertTriangle, Check, RotateCw } from "lucide-react"

export function ImageNode({ id, data }: NodeProps<Node<AgentNodeData>>) {
  const run = useCanvasStore((s) => s.runImage)

  const StatusIcon =
    data.status === "running" ? Loader2 :
    data.status === "done" ? Check :
    data.status === "failed" ? AlertTriangle :
    Play

  return (
    <div className="w-[260px] rounded-2xl border border-white/[0.08] bg-bg-card p-3 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <ImageIcon size={12} className="text-text-muted" />
          <span className="text-[10px] uppercase tracking-wider text-text-muted">image</span>
        </div>
        <StatusIcon
          size={12}
          className={
            data.status === "running" ? "animate-spin text-purple-light" :
            data.status === "done" ? "text-green-400" :
            data.status === "failed" ? "text-red-400" : "text-text-muted"
          }
        />
      </div>

      <div className="aspect-square rounded-xl bg-white/[0.04] overflow-hidden mb-2 border border-white/[0.06]">
        {data.artifactUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.artifactUrl} alt="" className="w-full h-full object-cover" />
        ) : data.status === "running" ? (
          <div className="h-full w-full bg-gradient-to-br from-white/[0.06] to-white/[0.02] animate-pulse" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-text-muted text-[11px]">
            no image yet
          </div>
        )}
      </div>

      {data.error && (
        <p className="text-[10px] text-red-400 mb-2 line-clamp-2">{data.error}</p>
      )}

      <button
        onClick={() => run(id)}
        disabled={data.status === "running" || data.status === "queued"}
        className="w-full nodrag rounded-lg py-1.5 text-xs font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        style={{ background: "var(--gradient-brand)" }}
      >
        {data.status === "done" ? (
          <>
            <RotateCw size={11} strokeWidth={2} />
            Re-generate
          </>
        ) : data.status === "running" ? (
          <>
            <Loader2 size={11} className="animate-spin" />
            Generating…
          </>
        ) : (
          "Generate"
        )}
      </button>

      <Handle
        type="target"
        position={Position.Left}
        id="text:in"
        className="!w-3 !h-3 !bg-purple !border-2 !border-bg-card"
      />
    </div>
  )
}
