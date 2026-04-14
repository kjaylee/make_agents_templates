'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { editor as MonacoEditorType } from 'monaco-editor'
import type { LintNote } from '@forge/engine/types'
import { templateSchema } from '@forge/schema/validators'
import { parse as parseYaml } from 'yaml'
import { Badge } from '@/components/ui/badge'
import { ClipboardText, Check, Rocket } from '@phosphor-icons/react'

const MonacoEditorComponent = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-bone-100 p-8">
      <p className="text-sm text-ink-300">Loading editor...</p>
    </div>
  ),
})

interface MonacoEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  lintNotes?: LintNote[]
  lintScore?: number | null
  isStreaming?: boolean
}

function defineForgeTheme(monaco: typeof import('monaco-editor')) {
  monaco.editor.defineTheme('forge-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'B63F0E' },
      { token: 'type', foreground: 'B63F0E' },
      { token: 'string', foreground: '4A9B7F' },
      { token: 'string.yaml', foreground: '4A9B7F' },
      { token: 'number', foreground: 'B63F0E' },
      { token: 'tag', foreground: '3D4D58' },
      { token: 'key', foreground: '3D4D58' },
      { token: 'comment', foreground: 'B8A99C' },
    ],
    colors: {
      'editor.background': '#FFFDF8',
      'editor.foreground': '#2F2722',
      'editor.lineHighlightBackground': '#FCE8DC',
      'editorLineNumber.foreground': '#B8A99C',
      'editorLineNumber.activeForeground': '#2F2722',
      'editor.selectionBackground': '#FCE8DC80',
      'editorCursor.foreground': '#B63F0E',
    },
  })
}

export function MonacoEditor({
  value,
  onChange,
  readOnly = false,
  lintNotes = [],
  lintScore = null,
  isStreaming = false,
}: MonacoEditorProps) {
  const editorRef = useRef<MonacoEditorType.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [copied, setCopied] = useState(false)

  const handleEditorMount = useCallback(
    (editor: MonacoEditorType.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
      editorRef.current = editor
      monacoRef.current = monaco
      defineForgeTheme(monaco)
      monaco.editor.setTheme('forge-light')
    },
    []
  )

  const handleChange = useCallback(
    (val: string | undefined) => {
      if (!val || !onChange) return

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        onChange(val)

        // Validate YAML against templateSchema
        const monaco = monacoRef.current
        const editor = editorRef.current
        if (!monaco || !editor) return

        const model = editor.getModel()
        if (!model) return

        try {
          const parsed = parseYaml(val)
          const result = templateSchema.safeParse(parsed)

          if (!result.success) {
            const markers: MonacoEditorType.IMarkerData[] = result.error.issues.map(
              (issue) => ({
                severity: monaco.MarkerSeverity.Error,
                message: `${issue.path.join('.')}: ${issue.message}`,
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 1,
              })
            )
            monaco.editor.setModelMarkers(model, 'forge-validator', markers)
          } else {
            monaco.editor.setModelMarkers(model, 'forge-validator', [])
          }
        } catch (e) {
          const model = editor.getModel()
          if (model) {
            monaco.editor.setModelMarkers(model, 'forge-validator', [
              {
                severity: monaco.MarkerSeverity.Error,
                message: `YAML parse error: ${e instanceof Error ? e.message : String(e)}`,
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 1,
              },
            ])
          }
        }
      }, 300)
    },
    [onChange]
  )

  // Set lint note markers from engine
  useEffect(() => {
    const monaco = monacoRef.current
    const editor = editorRef.current
    if (!monaco || !editor) return

    const model = editor.getModel()
    if (!model) return

    const markers: MonacoEditorType.IMarkerData[] = lintNotes.map((note) => ({
      severity:
        note.severity === 'error'
          ? monaco.MarkerSeverity.Error
          : note.severity === 'warn'
            ? monaco.MarkerSeverity.Warning
            : monaco.MarkerSeverity.Info,
      message: `[${note.code}] ${note.message}`,
      startLineNumber: note.line ?? 1,
      startColumn: 1,
      endLineNumber: note.line ?? 1,
      endColumn: 1000,
    }))

    monaco.editor.setModelMarkers(model, 'forge-linter', markers)
  }, [lintNotes])

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming && editorRef.current) {
      const model = editorRef.current.getModel()
      if (model) {
        const lineCount = model.getLineCount()
        editorRef.current.revealLine(lineCount)
      }
    }
  }, [value, isStreaming])

  const handleCopy = useCallback(async () => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [value])

  const lintVariant =
    lintScore !== null
      ? lintScore >= 80
        ? ('success' as const)
        : lintScore >= 50
          ? ('default' as const)
          : ('error' as const)
      : ('default' as const)

  if (!value && !isStreaming) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-bone-100 p-8">
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          className="mb-6 text-ink-300"
        >
          <path
            d="M8 48h48v4a4 4 0 01-4 4H12a4 4 0 01-4-4v-4z"
            fill="currentColor"
            opacity="0.3"
          />
          <path
            d="M16 36h32a4 4 0 014 4v8H12v-8a4 4 0 014-4z"
            fill="currentColor"
            opacity="0.5"
          />
          <path
            d="M20 24h24a8 8 0 018 8v4H12v-4a8 8 0 018-8z"
            fill="currentColor"
            opacity="0.7"
          />
          <rect x="28" y="8" width="8" height="16" rx="2" fill="currentColor" />
        </svg>
        <p className="text-center text-sm text-ink-300">
          Your agent will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col bg-bone-50">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2 border-b border-bone-200 px-4 py-2">
        {lintScore !== null && (
          <Badge variant={lintVariant}>
            {lintScore} / 100
            {lintNotes.length > 0 &&
              ` \u00b7 ${lintNotes.length} suggestion${lintNotes.length !== 1 ? 's' : ''}`}
          </Badge>
        )}
        <button
          type="button"
          onClick={handleCopy}
          disabled={!value}
          className="rounded p-1.5 text-ink-500 transition-colors hover:bg-bone-200 hover:text-ink-700 disabled:opacity-30"
          aria-label="Copy YAML"
        >
          {copied ? (
            <Check size={18} weight="bold" className="text-jade-500" />
          ) : (
            <ClipboardText size={18} weight="duotone" />
          )}
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <MonacoEditorComponent
          height="100%"
          language="yaml"
          theme="forge-light"
          value={value}
          onChange={handleChange}
          options={{
            readOnly: readOnly || isStreaming,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            padding: { top: 16 },
            renderLineHighlight: 'line',
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
          onMount={handleEditorMount}
        />
      </div>

      {/* Ship to Console CTA */}
      {value && !isStreaming && (
        <div className="border-t border-bone-200 px-4 py-3">
          <a
            href="#"
            onClick={(e) => { e.preventDefault() }}
            className="inline-flex w-full items-center justify-center gap-2 rounded border border-bone-200 bg-bone-100 px-4 py-2 text-sm font-medium text-ink-700 shadow-anvil transition-colors hover:bg-bone-200 hover:text-ink-900"
          >
            <Rocket size={16} weight="duotone" />
            Deploy agent
          </a>
        </div>
      )}
    </div>
  )
}
