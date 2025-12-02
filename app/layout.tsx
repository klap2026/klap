import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'
import { PreserveQueryToken } from '@/components/PreserveQueryToken'

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
      <body>
        <LanguageProvider>
          <PreserveQueryToken />
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
