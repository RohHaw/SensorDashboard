import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Environmental Monitoring Dashboard',
  description: 'Real-time environmental monitoring system',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-slate-50 antialiased">
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}