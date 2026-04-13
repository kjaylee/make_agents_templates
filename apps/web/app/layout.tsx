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
  title: 'Forge — Claude Agent Template Generator',
  description:
    'Describe the job. Forge hammers out the agent. Generate, test, and share Claude agents in under 60 seconds.',
  metadataBase: new URL('https://forge-web-85v.pages.dev'),
  openGraph: {
    title: 'Forge — Claude Agent Template Generator',
    description:
      'Describe the job. Forge hammers out the agent. Generate, test, and share Claude agents in under 60 seconds.',
    url: 'https://forge-web-85v.pages.dev',
    siteName: 'Forge',
    type: 'website',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Forge — Claude Agent Template Generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Forge — Claude Agent Template Generator',
    description:
      'Describe the job. Forge hammers out the agent. Generate, test, and share Claude agents in under 60 seconds.',
    images: ['/api/og'],
  },
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
