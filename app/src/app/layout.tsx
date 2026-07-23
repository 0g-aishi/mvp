import { ThemeProvider } from '../contexts/ThemeContext';
import { WalletProvider } from '../providers/WalletProvider';
import { LoadingProvider } from '../contexts/LoadingContext';
import { NavigationLoader } from '../components/NavigationLoader';
import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import '../components/backgrounds/FaultyTerminal/styles.css';
import '../components/ui/PillNav.css';
import '../components/layout/StaggeredMenu.css';
import { ReactNode } from 'react';
import { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003'),
  title: {
    default: 'Aishi – Your inner AI companion',
    template: '%s | Aishi'
  },
  description:
    'Aishi is a self‑learning iNFT agent built 100% on 0G (Compute, Storage, DA, Chain). Analyze your dreams, chat with a Live2D persona, and own your private memory forever.',
  keywords: [
    'Aishi', 'iNFT', '0G Compute', '0G Storage', '0G DA', '0G Chain',
    'decentralized AI', 'dream analysis', 'personal AI agent', 'Live2D',
    'memory consolidation', 'web3'
  ],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/logo_clean.png', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
    apple: '/logo_clean.png'
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Aishi',
    title: 'Aishi – Your inner AI (愛) companion',
    description:
      'Self‑learning iNFT on 0G. Dream analysis, chat, and long‑term memory you control.',
    images: [{ url: '/logo_clean.png', width: 1200, height: 630, alt: 'Aishi logo' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aishi – Your inner AI (愛) companion',
    description:
      'Self‑learning iNFT on 0G. Dream analysis, chat, and long‑term memory you control.',
    images: ['/logo_clean.png']
  },
  alternates: { canonical: '/' }
}

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        {/* Load Cubism Core for Live2D models */}
        <Script 
          src="/cubism/live2dcubismcore.min.js" 
          strategy="beforeInteractive"
        />
        
        {/* Structured Data for SEO */}
        <Script id="ld-aishi" type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Aishi',
            applicationCategory: 'AIApplication',
            operatingSystem: 'Web',
            url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003',
            image: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003'}/logo_clean.png`,
            description:
              'Aishi is a self‑learning iNFT agent powered by 0G (Compute, Storage, DA, Chain). Analyze dreams, chat with a Live2D persona, and own your private memory.',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
          })}
        </Script>
      </head>
      <body>
        <ThemeProvider>
          <WalletProvider>
            <LoadingProvider>
              <NavigationLoader />
              {children}
            </LoadingProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 