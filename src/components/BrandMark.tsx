type BrandMarkProps = {
  size?: 'md' | 'lg'
}

export function BrandMark({ size = 'lg' }: BrandMarkProps) {
  const dimension = size === 'lg' ? 'h-[150px] w-[150px]' : 'h-[110px] w-[110px]'
  const logoSize = size === 'lg' ? 'h-[92px]' : 'h-[68px]'

  return (
    <div className={`relative flex items-center justify-center rounded-full bg-white ${dimension}`}>
      <div className="absolute inset-[-9px] rounded-full border-2 border-dotted border-[#c9a66b]" />
      <img src="/brand/logo.png" alt="FoodRush" className={`${logoSize} w-auto`} />
    </div>
  )
}
