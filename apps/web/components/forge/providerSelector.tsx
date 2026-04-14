'use client'

import { cn } from '@/lib/utils'

type ProviderType = 'anthropic' | 'openai' | 'google'

const PROVIDER_OPTIONS: {
  value: ProviderType
  name: string
  brand: string
  description: string
}[] = [
  {
    value: 'anthropic',
    name: 'Anthropic',
    brand: 'Claude',
    description: 'Best for complex reasoning',
  },
  {
    value: 'openai',
    name: 'OpenAI',
    brand: 'GPT',
    description: 'Widely available, fast',
  },
  {
    value: 'google',
    name: 'Google',
    brand: 'Gemini',
    description: 'Multimodal capable',
  },
]

interface ProviderSelectorProps {
  value: ProviderType
  onChange: (provider: ProviderType) => void
  disabled?: boolean
}

export function ProviderSelector({ value, onChange, disabled }: ProviderSelectorProps) {
  return (
    <div className="flex gap-2">
      {PROVIDER_OPTIONS.map((opt) => (
        <label
          key={opt.value}
          className={cn(
            'flex flex-1 cursor-pointer flex-col items-center gap-1 rounded border p-3 text-center transition-colors',
            value === opt.value
              ? 'border-ember-500 bg-bone-50'
              : 'border-bone-200 bg-bone-100 hover:border-ink-300',
            disabled && 'pointer-events-none opacity-50'
          )}
        >
          <input
            type="radio"
            name="provider"
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="sr-only"
          />
          <span className="text-sm font-medium text-ink-700">
            {opt.name} <span className="text-ink-300">({opt.brand})</span>
          </span>
          <span className="text-xs text-ink-300">{opt.description}</span>
        </label>
      ))}
    </div>
  )
}
