import type { Seal } from '../types'

export const SEALS: Array<{
  id: Seal
  label: string
  lines: string[]
}> = [
  {
    id: 'calorias',
    label: 'Alto en Calorías',
    lines: ['CALORÍAS'],
  },
  {
    id: 'grasas-saturadas',
    label: 'Alto en Grasas Saturadas',
    lines: ['GRASAS', 'SATURADAS'],
  },
  {
    id: 'sodio',
    label: 'Alto en Sodio',
    lines: ['SODIO'],
  },
  {
    id: 'azucares',
    label: 'Alto en Azúcares',
    lines: ['AZÚCARES'],
  },
]

export function sealMeta(id: Seal) {
  return SEALS.find((seal) => seal.id === id) ?? SEALS[0]
}
