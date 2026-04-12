import { stringify } from 'yaml'
import type { Template } from '@forge/schema/validators'

export function render(template: Template): string {
  return stringify(template, {
    lineWidth: 120,
    defaultStringType: 'BLOCK_LITERAL',
    defaultKeyType: 'PLAIN'
  })
}

const STREAM_DELAY_MS = 16

export async function* renderStream(
  template: Template
): AsyncGenerator<string> {
  const yaml = render(template)
  for (const char of yaml) {
    yield char
    await new Promise((resolve) => setTimeout(resolve, STREAM_DELAY_MS))
  }
}
