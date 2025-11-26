interface ToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  label?: string
}

export function Toggle({ enabled, onChange, label }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="flex items-center gap-3 min-h-[44px]"
      type="button"
    >
      <div
        className={`
          relative w-12 h-7 rounded-full transition-colors duration-200
          ${enabled ? 'bg-accent-orange' : 'bg-gray-300'}
        `}
      >
        <div
          className={`
            absolute top-1 w-5 h-5 bg-white rounded-full transition-transform duration-200
            ${enabled ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </div>
      {label && (
        <span className="text-base font-medium text-gray-700">{label}</span>
      )}
    </button>
  )
}
