import { formatCLP } from '../lib/format'

type SummaryCardProps = {
  subtotal?: number
  discount?: number
  className?: string
  totalLabel?: string
}

export function SummaryCard({
  subtotal = 4650,
  discount = 0,
  className = '',
  totalLabel = 'Total a pagar',
}: SummaryCardProps) {
  const total = subtotal - discount

  return (
    <div className={`rounded-2xl border border-[#d8e1ea] bg-transparent p-5 ${className}`}>
      <div className="flex items-center justify-between text-[16px] font-medium text-slate-600">
        <span>Subtotal</span>
        <span>{formatCLP(subtotal)}</span>
      </div>
      <div className="mt-4 flex items-center justify-between text-[16px] font-medium text-slate-600">
        <span>Descuentos</span>
        <span>{formatCLP(discount)}</span>
      </div>
      <div className="my-4 border-t border-[#d8e1ea]" />
      <div className="flex items-center justify-between text-[18px] font-extrabold text-ink">
        <span>{totalLabel}</span>
        <span>{formatCLP(total)}</span>
      </div>
    </div>
  )
}
