"use client"

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { useCanvasStore, type AgentNodeData } from "@/lib/canvas/store"
import { Type } from "lucide-react"

export function PromptNode({ id, data }: NodeProps<Node<AgentNodeData>>) {
  const setPrompt = useCanvasStore((s) => s.setPrompt)

  return (
    <div className="w-[260px] rounded-2xl border border-white/[0.08] bg-bg-card p-3 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Type size={12} className="text-text-muted" />
          <span className="text-[10px] uppercase tracking-wider text-text-muted">prompt</span>
        </div>
      </div>
      <textarea
        value={data.prompt ?? ""}
        onChange={(e) => setPrompt(id, e.target.value)}
        placeholder="Describe what you want to generate…"
        rows={4}
        className="w-full resize-none rounded-lg bg-bg-base border border-white/[0.06] px-2.5 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/20 nodrag"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="text:out"
        className="!w-3 !h-3 !bg-purple !border-2 !border-bg-card"
      />
    </div>
  )
}
