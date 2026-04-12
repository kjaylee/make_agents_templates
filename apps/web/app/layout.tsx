import './globals.css'
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Forge — Claude agents, hammered out',
  description:
    'Describe the job in plain English. Ship a production Claude agent in under a minute.',
  metadataBase: new URL('https://forge.agents.sh')
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#D9541F" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        </head>
        <body className="anvil-surface min-h-screen bg-bone-100 text-ink-700 font-body antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
