import { Store } from 'lucide-react'

type StoreBannerProps = {
  storeName?: string
  className?: string
}

export function StoreBanner({ storeName = 'Casino Los Notros', className = '' }: StoreBannerProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl bg-[#cbd8e6] px-4 py-3 text-[16px] font-bold text-[#315e86] ${className}`}
    >
      <Store size={22} strokeWidth={2.2} className="shrink-0" />
      <span>Estás comprando en {storeName}</span>
    </div>
  )
}
