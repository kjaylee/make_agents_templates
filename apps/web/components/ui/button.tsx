'use client'

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded font-body text-[15px] font-medium transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-ember-500 text-bone-50 shadow-ember hover:-translate-y-px hover:bg-ember-600 focus-visible:outline-ember-500",
        primary:
          "bg-ember-500 text-bone-50 shadow-ember hover:-translate-y-px hover:bg-ember-600 focus-visible:outline-ember-500",
        secondary:
          "border-[1.5px] border-ink-300 bg-transparent text-ink-700 hover:border-ink-500 hover:bg-bone-200",
        ghost:
          "bg-transparent text-ink-700 hover:bg-bone-200",
        destructive:
          "bg-rust-500 text-bone-50 hover:-translate-y-px hover:bg-rust-500/90 focus-visible:outline-rust-500",
        link: "text-ember-500 underline-offset-4 hover:underline",
        outline:
          "border border-bone-200 bg-bone-50 text-ink-700 hover:bg-bone-200 hover:text-ink-900",
      },
      size: {
        default: "px-6 py-3",
        sm: "px-4 py-2 text-sm",
        lg: "px-8 py-4 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
