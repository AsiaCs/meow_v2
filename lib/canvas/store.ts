"use client"

import { create } from "zustand"
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react"

export type AgentKind = "prompt" | "image"
export type NodeStatus = "idle" | "queued" | "running" | "done" | "failed"

export type AgentNodeData = {
  kind: AgentKind
  status: NodeStatus
  progress?: number
  // Prompt node
  prompt?: string
  // Image node
  artifactUrl?: string
  error?: string
} & Record<string, unknown>

export type FlowNode = Node<AgentNodeData>

interface CanvasState {
  nodes: FlowNode[]
  edges: Edge[]
  selectedId: string | null
  addNode(kind: AgentKind, position: { x: number; y: number }): void
  setSelected(id: string | null): void
  onNodesChange(changes: NodeChange[]): void
  onEdgesChange(changes: EdgeChange[]): void
  onConnect(c: Connection): void
  patchData(id: string, patch: Partial<AgentNodeData>): void
  setPrompt(id: string, prompt: string): void
  runImage(id: string): Promise<void>
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function initialNodes(): FlowNode[] {
  return [
    {
      id: "prompt-1",
      type: "prompt",
      position: { x: 80, y: 200 },
      data: { kind: "prompt", status: "idle", prompt: "a futuristic city skyline at dusk, hyper detailed, neon" },
    },
    {
      id: "image-1",
      type: "image",
      position: { x: 480, y: 160 },
      data: { kind: "image", status: "idle" },
    },
  ]
}

function initialEdges(): Edge[] {
  return [
    { id: "e1", source: "prompt-1", target: "image-1", sourceHandle: "text:out", targetHandle: "text:in" },
  ]
}

export const useCanvasStore = create<CanvasState>()((set, get) => ({
  nodes: initialNodes(),
  edges: initialEdges(),
  selectedId: null,

  addNode(kind, position) {
    const id = `${kind}-${uid()}`
    set((s) => ({
      nodes: [
        ...s.nodes,
        {
          id,
          type: kind,
          position,
          data: { kind, status: "idle", ...(kind === "prompt" ? { prompt: "" } : {}) },
        },
      ],
    }))
  },

  setSelected(id) {
    set({ selectedId: id })
  },

  onNodesChange(changes) {
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) as FlowNode[] }))
  },
  onEdgesChange(changes) {
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) }))
  },
  onConnect(c) {
    if (!c.source || !c.target) return
    set((s) => ({
      edges: [
        ...s.edges,
        {
          id: `${c.source}->${c.target}-${uid()}`,
          source: c.source!,
          target: c.target!,
          sourceHandle: c.sourceHandle ?? null,
          targetHandle: c.targetHandle ?? null,
        },
      ],
    }))
  },

  patchData(id, patch) {
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
    }))
  },

  setPrompt(id, prompt) {
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, prompt } } : n)),
    }))
  },

  async runImage(id) {
    const { nodes, edges, patchData } = get()
    const node = nodes.find((n) => n.id === id)
    if (!node || node.data.kind !== "image") return

    // Resolve the prompt from the upstream prompt node
    const parentEdge = edges.find((e) => e.target === id)
    const parent = parentEdge ? nodes.find((n) => n.id === parentEdge.source) : null
    const prompt = parent?.data.prompt?.trim()
    if (!prompt) {
      patchData(id, { status: "failed", error: "Connect a Prompt node with text." })
      return
    }

    patchData(id, { status: "running", progress: 0.05, error: undefined, artifactUrl: undefined })

    try {
      const res = await fetch("/api/canvas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      const text = await res.text()
      if (!res.ok) {
        patchData(id, { status: "failed", error: text.slice(0, 200) })
        return
      }
      const data = JSON.parse(text) as { url?: string; error?: string }
      if (!data.url) {
        patchData(id, { status: "failed", error: data.error ?? "no image returned" })
        return
      }
      patchData(id, { status: "done", progress: 1, artifactUrl: data.url })
    } catch (e) {
      patchData(id, { status: "failed", error: e instanceof Error ? e.message : "network error" })
    }
  },
}))
