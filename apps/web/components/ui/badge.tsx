import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ember-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-ember-100 text-ember-600",
        success: "bg-jade-500/10 text-jade-500",
        error: "bg-rust-500/10 text-rust-500",
        secondary: "bg-bone-200 text-ink-500",
        outline: "border border-bone-200 text-ink-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
