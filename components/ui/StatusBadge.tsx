type JobStatus =
  | 'request_received'
  | 'slots_proposed'
  | 'confirmed'
  | 'en_route'
  | 'arrived'
  | 'completed'
  | 'cancelled'

interface StatusBadgeProps {
  status: JobStatus
}

const STATUS_CONFIG = {
  request_received: {
    label: 'New Request',
    color: 'bg-blue-100 text-blue-800',
    icon: '📥'
  },
  slots_proposed: {
    label: 'Slots Proposed',
    color: 'bg-purple-100 text-purple-800',
    icon: '📅'
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-status-success/20 text-status-success',
    icon: '✅'
  },
  en_route: {
    label: 'En Route',
    color: 'bg-status-warning/20 text-status-warning',
    icon: '🚗'
  },
  arrived: {
    label: 'Arrived',
    color: 'bg-accent-orange/20 text-accent-orange',
    icon: '📍'
  },
  completed: {
    label: 'Completed',
    color: 'bg-status-success/20 text-status-success',
    icon: '✔️'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-600',
    icon: '❌'
  }
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  )
}
