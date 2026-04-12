import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded border border-bone-200 bg-bone-50 px-3 py-2 text-sm text-ink-700 shadow-anvil placeholder:text-ink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-100 focus-visible:border-ember-500 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
