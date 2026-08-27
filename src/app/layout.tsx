import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const displayFont = Outfit({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'TheoTown Plugin Hub — Info & Update Plugin',
    template: '%s | TheoTown Plugin Hub',
  },
  description: 'Pusat informasi plugin TheoTown terbaru. Pantau update mingguan, plugin baru rilis, dan certified creators.',
  keywords: ['TheoTown', 'plugin TheoTown', 'info plugin', 'update plugin', 'mod TheoTown'],
  authors: [{ name: 'TheoTown Plugin Hub' }],
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="bg-background text-foreground antialiased font-body">
        {children}
      </body>
    </html>
  );
}
