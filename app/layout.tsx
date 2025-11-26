import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Klap - Field Technician Scheduling',
  description: 'Mobile-first scheduling app for field technicians and customers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
