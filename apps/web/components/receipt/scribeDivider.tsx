import { cn } from '@/lib/utils'

interface ScribeDividerProps {
  className?: string
}

/**
 * Scribe divider — double thin line in ink-300.
 * See DESIGN.md §9.7 for Receipt layout.
 */
export function ScribeDivider({ className }: ScribeDividerProps) {
  return (
    <div className={cn('py-2', className)} aria-hidden="true">
      <div className="h-px bg-ink-300" />
      <div className="h-[1px]" />
      <div className="h-px bg-ink-300" />
    </div>
  )
}
