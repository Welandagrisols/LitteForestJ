import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LittleForest - Nursery Management',
  description: 'Comprehensive nursery management application for plant inventory, sales, and operations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}