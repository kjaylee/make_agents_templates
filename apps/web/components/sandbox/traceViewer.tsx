'use client'

import { useCallback, useMemo, useState } from 'react'
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
import { User, Flame, Hammer, Check, X } from '@phosphor-icons/react'
import type { SandboxEvent, ToolCallData, ToolResultData, AssistantData } from '@/lib/managedAgents'

// ── Node data types ──

interface UserNodeData { label: string; input: string; [key: string]: unknown }
interface AssistantNodeData { label: string; text: string; tokens: number; [key: string]: unknown }
interface ToolCallNodeData { label: string; name: string; input: Record<string, unknown>; isRunning: boolean; [key: string]: unknown }
interface ToolResultNodeData { label: string; output: string; duration_ms: number; success: boolean; [key: string]: unknown }

// ── Custom Nodes ──

function UserNode({ data }: NodeProps<Node<UserNodeData>>) {
  return (
    <div className="min-w-[160px] rounded border-2 border-ink-900 bg-bone-50 px-4 py-3 shadow-sm">
      <Handle type="source" position={Position.Right} className="!bg-ink-900" />
      <div className="flex items-center gap-2">
        <User size={16} weight="bold" className="text-ink-900" />
        <span className="text-xs font-medium text-ink-900">{data.label}</span>
      </div>
      <p className="mt-1 line-clamp-2 text-[11px] text-ink-500">{data.input}</p>
    </div>
  )
}

function AssistantNode({ data }: NodeProps<Node<AssistantNodeData>>) {
  return (
    <div className="min-w-[200px] max-w-[280px] rounded border-2 border-ember-500 bg-bone-50 px-4 py-3 shadow-sm">
      <Handle type="target" position={Position.Left} className="!bg-ember-500" />
      <Handle type="source" position={Position.Right} className="!bg-ember-500" />
      <div className="flex items-center gap-2">
        <Flame size={16} weight="duotone" className="text-ember-500" />
        <span className="text-xs font-medium text-ink-900">{data.label}</span>
        {data.tokens > 0 && (
          <span className="ml-auto font-mono text-[10px] text-ink-300">{data.tokens}t</span>
        )}
      </div>
      <p className="mt-1 line-clamp-3 text-[11px] text-ink-500">{data.text}</p>
    </div>
  )
}

function ToolCallNode({ data }: NodeProps<Node<ToolCallNodeData>>) {
  return (
    <div className={`min-w-[160px] rounded border-2 border-iron-600 bg-bone-50 px-4 py-3 shadow-sm ${data.isRunning ? 'animate-ember-pulse' : ''}`}>
      <Handle type="target" position={Position.Left} className="!bg-iron-600" />
      <Handle type="source" position={Position.Right} className="!bg-iron-600" />
      <div className="flex items-center gap-2">
        <Hammer size={16} weight="duotone" className="text-iron-600" />
        <span className="text-xs font-medium text-ink-900">{data.name}</span>
      </div>
      <pre className="mt-1 max-h-[60px] overflow-hidden text-[10px] text-ink-500">
        {JSON.stringify(data.input, null, 1)}
      </pre>
    </div>
  )
}

function ToolResultNode({ data }: NodeProps<Node<ToolResultNodeData>>) {
  const borderColor = data.success ? 'border-jade-500' : 'border-rust-500'
  const Icon = data.success ? Check : X
  const iconColor = data.success ? 'text-jade-500' : 'text-rust-500'

  return (
    <div className={`min-w-[160px] rounded border-2 ${borderColor} bg-bone-50 px-4 py-3 shadow-sm`}>
      <Handle type="target" position={Position.Left} className={data.success ? '!bg-jade-500' : '!bg-rust-500'} />
      <Handle type="source" position={Position.Right} className={data.success ? '!bg-jade-500' : '!bg-rust-500'} />
      <div className="flex items-center gap-2">
        <Icon size={16} weight="bold" className={iconColor} />
        <span className="text-xs font-medium text-ink-900">{data.label}</span>
        <span className="ml-auto font-mono text-[10px] text-ink-300">{data.duration_ms}ms</span>
      </div>
      <pre className="mt-1 max-h-[60px] overflow-hidden text-[10px] text-ink-500">
        {data.output.length > 120 ? `${data.output.slice(0, 120)}...` : data.output}
      </pre>
    </div>
  )
}

// ── Node type registry ──

const nodeTypes: NodeTypes = {
  userNode: UserNode,
  assistantNode: AssistantNode,
  toolCallNode: ToolCallNode,
  toolResultNode: ToolResultNode,
}

// ── Main component ──

interface TraceViewerProps {
  events: SandboxEvent[]
  isRunning: boolean
}

export function TraceViewer({ events, isRunning }: TraceViewerProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const { nodes, edges } = useMemo(() => {
    const ns: Node[] = []
    const es: Edge[] = []

    if (events.length === 0) return { nodes: ns, edges: es }

    // X/Y positioning
    let x = 0
    const xStep = 280
    const y = 100

    // Track last node for edges
    let lastNodeId: string | null = null

    // User input node (first node)
    const userNodeId = 'user-input'
    ns.push({
      id: userNodeId,
      type: 'userNode',
      position: { x, y },
      data: { label: 'User', input: 'Sample input' },
    })
    lastNodeId = userNodeId
    x += xStep

    let toolCallCounter = 0
    let assistantCounter = 0

    for (const event of events) {
      switch (event.type) {
        case 'tool_call': {
          const d = event.data as ToolCallData
          const nodeId = `tool-call-${toolCallCounter}`
          const isLast = isRunning && event === events[events.length - 1]

          ns.push({
            id: nodeId,
            type: 'toolCallNode',
            position: { x, y },
            data: { label: d.name, name: d.name, input: d.input, isRunning: isLast },
          })

          if (lastNodeId) {
            es.push({
              id: `e-${lastNodeId}-${nodeId}`,
              source: lastNodeId,
              target: nodeId,
              animated: true,
              style: { stroke: '#B8A99C' },
            })
          }

          lastNodeId = nodeId
          x += xStep
          toolCallCounter += 1
          break
        }
        case 'tool_result': {
          const d = event.data as ToolResultData
          const nodeId = `tool-result-${d.id}`

          ns.push({
            id: nodeId,
            type: 'toolResultNode',
            position: { x, y },
            data: { label: 'Result', output: d.output, duration_ms: d.duration_ms, success: d.success },
          })

          if (lastNodeId) {
            es.push({
              id: `e-${lastNodeId}-${nodeId}`,
              source: lastNodeId,
              target: nodeId,
              animated: true,
              style: { stroke: '#B8A99C' },
            })
          }

          lastNodeId = nodeId
          x += xStep
          break
        }
        case 'assistant': {
          const d = event.data as AssistantData
          const nodeId = `assistant-${assistantCounter}`

          ns.push({
            id: nodeId,
            type: 'assistantNode',
            position: { x, y },
            data: { label: 'Assistant', text: d.text, tokens: d.tokens },
          })

          if (lastNodeId) {
            es.push({
              id: `e-${lastNodeId}-${nodeId}`,
              source: lastNodeId,
              target: nodeId,
              animated: true,
              style: { stroke: '#B8A99C' },
            })
          }

          lastNodeId = nodeId
          x += xStep
          assistantCounter += 1
          break
        }
      }
    }

    return { nodes: ns, edges: es }
  }, [events, isRunning])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(selectedNode === node.id ? null : node.id)
  }, [selectedNode])

  if (events.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-bone-100">
        <div className="text-center">
          <Flame size={48} weight="duotone" className="mx-auto mb-4 text-ink-300" />
          <p className="text-sm text-ink-300">Run your agent to see the execution trace</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
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

      {/* Selected node detail popover */}
      {selectedNode && (() => {
        const node = nodes.find((n) => n.id === selectedNode)
        if (!node) return null
        return (
          <div className="absolute bottom-16 right-4 z-50 max-h-[300px] w-[360px] overflow-auto rounded border border-bone-200 bg-bone-50 p-4 shadow-ember">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-ink-900">Node Detail</span>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="text-ink-300 hover:text-ink-700"
              >
                <X size={14} />
              </button>
            </div>
            <pre className="overflow-auto text-[11px] text-ink-500">
              {JSON.stringify(node.data, null, 2)}
            </pre>
          </div>
        )
      })()}
    </div>
  )
}
