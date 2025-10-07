
import type { Metadata } from 'next';
import './globals.css';
import { Body } from '@/components/Body';


export const metadata: Metadata = {
  title: 'SitePilot',
  description: 'Construction project management simplified.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <Body>{children}</Body>
    </html>
  );
}
