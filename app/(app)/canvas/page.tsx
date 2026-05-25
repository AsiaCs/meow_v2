"use client"

import { useCallback } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Type, Image as ImageIcon, Sparkles } from "lucide-react"
import { useCanvasStore } from "@/lib/canvas/store"
import { PromptNode } from "@/components/canvas/nodes/prompt"
import { ImageNode } from "@/components/canvas/nodes/image"

const nodeTypes = {
  prompt: PromptNode,
  image: ImageNode,
}

function isValidConnection(c: { sourceHandle?: string | null; targetHandle?: string | null }) {
  const srcKind = c.sourceHandle?.split(":")[0]
  const tgtKind = c.targetHandle?.split(":")[0]
  return !!srcKind && srcKind === tgtKind
}

function AgentDock() {
  const addNode = useCanvasStore((s) => s.addNode)
  const { screenToFlowPosition } = useReactFlow()

  const onAdd = useCallback(
    (kind: "prompt" | "image") => {
      const pos = screenToFlowPosition({ x: 300, y: 200 })
      addNode(kind, { x: pos.x + Math.random() * 40, y: pos.y + Math.random() * 40 })
    },
    [addNode, screenToFlowPosition],
  )

  return (
    <aside className="absolute left-4 top-4 z-20 flex flex-col gap-2 rounded-2xl border border-white/[0.08] bg-bg-card/95 backdrop-blur-md p-2 shadow-xl">
      <DockButton icon={Type} label="Prompt" onClick={() => onAdd("prompt")} />
      <DockButton icon={ImageIcon} label="Image" onClick={() => onAdd("image")} />
    </aside>
  )
}

function DockButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="group flex h-11 w-11 items-center justify-center rounded-xl hover:bg-white/[0.06] text-text-secondary hover:text-text-primary transition-colors"
    >
      <Icon size={18} strokeWidth={1.5} />
    </button>
  )
}

function Header() {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-white/[0.08] bg-bg-card/95 backdrop-blur-md px-4 py-2 shadow-xl">
      <Sparkles size={14} className="text-purple-light" />
      <span className="text-xs font-semibold text-text-primary font-display">Canvas</span>
      <span className="text-[10px] uppercase tracking-wider text-text-muted ml-2">creative agents</span>
    </div>
  )
}

function CanvasInner() {
  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)
  const onNodesChange = useCanvasStore((s) => s.onNodesChange)
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange)
  const onConnect = useCanvasStore((s) => s.onConnect)

  return (
    <div className="relative h-[calc(100dvh-5rem)] md:h-dvh w-full bg-bg-base">
      <Header />
      <AgentDock />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          style: { stroke: "rgba(168,85,247,0.7)", strokeWidth: 2 },
        }}
        fitView
      >
        <Background gap={24} size={1} color="rgba(255,255,255,0.04)" />
        <Controls className="!bg-bg-card !border-white/[0.06] !text-text-secondary [&>button]:!bg-bg-card [&>button]:!border-white/[0.06] [&>button>svg]:!fill-current" />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(0,0,0,0.5)"
          className="!bg-bg-card !border !border-white/[0.06] !rounded-xl"
          nodeColor={() => "rgba(168,85,247,0.6)"}
        />
      </ReactFlow>
    </div>
  )
}

export default function CanvasPage() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  )
}
