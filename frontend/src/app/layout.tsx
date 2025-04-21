// app/layout.tsx or _app.tsx
import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';
import AdminNav from '@/components/AdminNav';
import ErrorBoundary from '@/components/ErrorBoundary'; // Correct import
import Footer from '@/components/Footer'
import { TitleProvider } from '@/components/TitleContext';
import Link from 'next/link';

export const metadata: Metadata = {
  title: {
    default: 'Ustatticaret',
    template: '%s | Ustatticaret',
  },
  description: 'ustatticaret website',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <link rel="icon" href="icons/ustat-icon.png" sizes="any" />
      <body>
        <TitleProvider>
          <AdminNav />
          <Nav />
          {children}
          <Footer />
        </TitleProvider>
      </body>
    </html>
  );
}
