interface ChipProps {
  label: string
  selected?: boolean
  onClick?: () => void
  icon?: string
}

export function Chip({ label, selected = false, onClick, icon }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-3 rounded-full text-sm font-medium transition-all duration-200
        min-h-[44px] flex items-center gap-2
        ${selected
          ? 'bg-accent-orange text-white shadow-lg shadow-orange-200'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
        active:scale-95
      `}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {label}
    </button>
  )
}
