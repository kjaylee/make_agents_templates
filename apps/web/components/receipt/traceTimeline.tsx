import { Hammer, ChatCircle, Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export interface TraceStep {
  time: string
  icon: 'tool' | 'assistant' | 'check'
  description: string
  duration?: string
}

interface TraceTimelineProps {
  steps: TraceStep[]
  className?: string
}

function StepIcon({ icon }: { icon: TraceStep['icon'] }) {
  if (icon === 'tool') {
    return <Hammer size={12} weight="duotone" className="text-iron-600" />
  }
  if (icon === 'assistant') {
    return <ChatCircle size={12} weight="duotone" className="text-ember-500" />
  }
  return <Check size={12} weight="bold" className="text-jade-500" />
}

/**
 * Vertical trace timeline — used inside Ember Receipt.
 * Different from horizontal TraceViewer (react-flow).
 */
export function TraceTimeline({ steps, className }: TraceTimelineProps) {
  return (
    <div className={cn('relative pl-5', className)}>
      {/* vertical line */}
      <div className="absolute left-[7px] top-1 bottom-1 w-px bg-iron-600/60" aria-hidden="true" />
      <ul className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="relative flex items-center gap-3 text-[11px]">
            <div className="absolute -left-5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-iron-600 bg-bone-50">
              <StepIcon icon={step.icon} />
            </div>
            <span className="font-mono text-ink-500">{step.time}</span>
            <span className="flex-1 text-ink-700">{step.description}</span>
            {step.duration && (
              <span className="rounded bg-bone-200 px-1.5 py-px font-mono text-[10px] text-ink-500">
                {step.duration}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
