import { format } from 'date-fns'

export function formatPhone(phone: string): string {
  // Format +972501234567 to +972 50-123-4567
  if (phone.startsWith('+972')) {
    const number = phone.slice(4)
    return `+972 ${number.slice(0, 2)}-${number.slice(2, 5)}-${number.slice(5)}`
  }
  return phone
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'MMM dd, yyyy')
}

export function formatTime(date: Date | string): string {
  return format(new Date(date), 'h:mm a')
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'MMM dd, h:mm a')
}
