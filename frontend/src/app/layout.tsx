import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Personal Chat',
  description: 'Your personal AI chat companion',
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
