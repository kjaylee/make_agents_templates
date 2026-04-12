import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded border border-bone-200 bg-bone-50 px-3 py-2 text-sm text-ink-700 shadow-anvil file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-100 focus-visible:border-ember-500 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
