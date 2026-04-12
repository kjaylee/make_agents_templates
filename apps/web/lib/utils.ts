import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes with clsx conditionals.
 * Pattern borrowed from shadcn/ui; used by future Anvil UI components.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
