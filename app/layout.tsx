import Version from '@/components/common/version.component';
import { CookieWidget } from '@/components/features/cookie-widget.component';
import Footer from '@/components/features/footer.component';
import Header from '@/components/features/header.component';
import { headJsonLd } from '@/config/head.json-ld';
import { navigation } from '@/config/navigation';
import { QueryProvider } from '@/providers/query-provider';
import '@/styles/globals.css';
import { Analytics } from '@vercel/analytics/react';
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <head>
        <link rel='icon' href='/favicon.png' type='image/png' />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(headJsonLd),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col overscroll-x-contain antialiased`}
      >
        <QueryProvider>
          <Header navigation={navigation} />
          <main className='relative flex grow flex-col items-stretch pb-10'>
            {children}
          </main>
          <Footer />
          {/*<ChatBubble />*/}
          <Version />
          <CookieWidget />
          <Analytics />
        </QueryProvider>
      </body>
    </html>
  );
}
