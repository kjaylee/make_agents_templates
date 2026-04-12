'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ReactFlow,
  type Node,
  type Edge,
  type NodeTypes,
  type NodeProps,
  Handle,
  Position,
  Background,
  Controls,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Crown, User, Flame } from '@phosphor-icons/react'

export interface LineageNode {
  id: string
  slug: string
  label: string
  author?: string
  kind: 'root' | 'fork' | 'version' | 'current'
  diffSummary?: string
}

export interface LineageEdge {
  id: string
  source: string
  target: string
}

interface LineageTreeProps {
  nodes: LineageNode[]
  edges: LineageEdge[]
  currentId: string
}

type NodeData = {
  label: string
  slug: string
  author?: string
  kind: LineageNode['kind']
  diffSummary?: string
  [key: string]: unknown
}

function RootNode({ data }: NodeProps<Node<NodeData>>) {
  return (
    <div className="group min-w-[180px] rounded border-2 border-ink-900 bg-bone-50 px-4 py-3 shadow-anvil">
      <Handle type="source" position={Position.Bottom} className="!bg-ink-900" />
      <div className="flex items-center gap-2">
        <Crown size={16} weight="duotone" className="text-ink-900" />
        <span className="text-xs font-medium text-ink-900">{data.label}</span>
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-ink-500">root</div>
      {data.diffSummary && (
        <div className="invisible absolute left-full top-0 ml-2 w-48 rounded border border-bone-200 bg-bone-50 p-2 text-[10px] text-ink-700 shadow-ember group-hover:visible">
          {data.diffSummary}
        </div>
      )}
    </div>
  )
}

function VersionNode({ data }: NodeProps<Node<NodeData>>) {
  return (
    <div className="group min-w-[160px] rounded border-2 border-ember-500 bg-bone-50 px-4 py-3 shadow-anvil">
      <Handle type="target" position={Position.Top} className="!bg-ember-500" />
      <Handle type="source" position={Position.Bottom} className="!bg-ember-500" />
      <div className="text-xs font-medium text-ink-900">{data.label}</div>
      {data.diffSummary && (
        <div className="invisible absolute left-full top-0 ml-2 w-48 rounded border border-bone-200 bg-bone-50 p-2 text-[10px] text-ink-700 shadow-ember group-hover:visible">
          {data.diffSummary}
        </div>
      )}
    </div>
  )
}

function ForkNode({ data }: NodeProps<Node<NodeData>>) {
  return (
    <div className="group min-w-[160px] rounded border-2 border-iron-600 bg-bone-50 px-4 py-3 shadow-anvil">
      <Handle type="target" position={Position.Top} className="!bg-iron-600" />
      <Handle type="source" position={Position.Bottom} className="!bg-iron-600" />
      <div className="flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-iron-600/10">
          <User size={11} weight="duotone" className="text-iron-600" />
        </div>
        <span className="text-xs font-medium text-ink-900">{data.label}</span>
      </div>
      {data.author && (
        <div className="mt-0.5 font-mono text-[10px] text-ink-500">@{data.author}</div>
      )}
      {data.diffSummary && (
        <div className="invisible absolute left-full top-0 ml-2 w-48 rounded border border-bone-200 bg-bone-50 p-2 text-[10px] text-ink-700 shadow-ember group-hover:visible">
          {data.diffSummary}
        </div>
      )}
    </div>
  )
}

function CurrentNode({ data }: NodeProps<Node<NodeData>>) {
  return (
    <div className="group relative min-w-[180px] animate-ember-pulse rounded border-2 border-ember-500 bg-bone-50 px-4 py-3 shadow-ember-lg">
      <Handle type="target" position={Position.Top} className="!bg-ember-500" />
      <div className="flex items-center gap-2">
        <Flame size={16} weight="duotone" className="text-ember-500" />
        <span className="text-xs font-medium text-ink-900">{data.label}</span>
      </div>
      <div className="mt-1 inline-block rounded bg-ember-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-bone-50">
        Current
      </div>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  rootNode: RootNode,
  versionNode: VersionNode,
  forkNode: ForkNode,
  currentNode: CurrentNode,
}

function nodeTypeFor(kind: LineageNode['kind']): string {
  switch (kind) {
    case 'root':
      return 'rootNode'
    case 'fork':
      return 'forkNode'
    case 'current':
      return 'currentNode'
    default:
      return 'versionNode'
  }
}

/**
 * Top-down lineage tree for an agent's fork graph.
 * Positions computed by simple level/BFS layout using edges.
 */
export function LineageTree({ nodes, edges, currentId }: LineageTreeProps) {
  const router = useRouter()

  const { rfNodes, rfEdges } = useMemo(() => {
    // Compute level (depth) per node via BFS from roots.
    const childrenOf = new Map<string, string[]>()
    const parentOf = new Map<string, string>()
    for (const e of edges) {
      childrenOf.set(e.source, [...(childrenOf.get(e.source) ?? []), e.target])
      parentOf.set(e.target, e.source)
    }
    const roots = nodes.filter((n) => !parentOf.has(n.id)).map((n) => n.id)

    const depth = new Map<string, number>()
    const queue: Array<{ id: string; d: number }> = roots.map((id) => ({ id, d: 0 }))
    while (queue.length > 0) {
      const { id, d } = queue.shift()!
      if (depth.has(id)) continue
      depth.set(id, d)
      for (const child of childrenOf.get(id) ?? []) {
        queue.push({ id: child, d: d + 1 })
      }
    }

    // Group by depth for x-positioning.
    const levels = new Map<number, string[]>()
    for (const [id, d] of depth) {
      levels.set(d, [...(levels.get(d) ?? []), id])
    }

    const yStep = 140
    const xStep = 220
    const positions = new Map<string, { x: number; y: number }>()
    for (const [d, ids] of levels) {
      const totalWidth = (ids.length - 1) * xStep
      const startX = -totalWidth / 2
      ids.forEach((id, i) => {
        positions.set(id, { x: startX + i * xStep, y: d * yStep })
      })
    }

    const rfNodes: Node<NodeData>[] = nodes.map((n) => {
      const pos = positions.get(n.id) ?? { x: 0, y: 0 }
      const kind = n.id === currentId ? 'current' : n.kind
      return {
        id: n.id,
        type: nodeTypeFor(kind),
        position: pos,
        data: {
          label: n.label,
          slug: n.slug,
          author: n.author,
          kind,
          diffSummary: n.diffSummary,
        },
      }
    })

    const rfEdges: Edge[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      style: { stroke: '#B8A99C', strokeWidth: 1.5 },
    }))

    return { rfNodes, rfEdges }
  }, [nodes, edges, currentId])

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    const data = node.data as NodeData
    if (data.slug) router.push(`/gallery/${data.slug}`)
  }

  return (
    <div className="h-[600px] w-full rounded border border-bone-200 bg-bone-50 shadow-anvil">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        className="bg-bone-100"
      >
        <Background color="#B8A99C" gap={20} size={1} />
        <Controls
          showInteractive={false}
          className="!border-bone-200 !bg-bone-50 !shadow-anvil [&>button]:!border-bone-200 [&>button]:!bg-bone-50 [&>button:hover]:!bg-bone-200"
        />
      </ReactFlow>
    </div>
  )
}
