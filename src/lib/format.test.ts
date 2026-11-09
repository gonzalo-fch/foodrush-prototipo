import { describe, expect, it } from 'vitest'
import { formatCLP } from './format'

describe('formatCLP', () => {
  it('formatea pesos chilenos sin decimales', () => {
    expect(formatCLP(3500)).toBe('$3.500')
    expect(formatCLP(0)).toBe('$0')
  })
})
