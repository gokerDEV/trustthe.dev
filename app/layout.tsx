import Version from '@/components/common/version.component';
import { CookieWidget } from '@/components/features/cookie-widget.component';
import Footer from '@/components/features/footer.component';
import Header from '@/components/features/header.component';
import { BASE_URL, DEFAULT_LOCALE, SITE_NAME } from '@/config/constants';
import { headJsonLd } from '@/config/head.json-ld';
import { navigation } from '@/config/navigation';
import { QueryProvider } from '@/providers/query-provider';
import '@/styles/globals.css';
import { Analytics } from '@vercel/analytics/react';
import { Fira_Mono, Hanken_Grotesk, Noto_Sans } from 'next/font/google';

const sans = Noto_Sans({
  variable: '--font-custom-sans',
  subsets: ['latin-ext'],
  weight: ['100', '400', '600', '800'],
  display: 'swap',
});

const mono = Fira_Mono({
  variable: '--font-custom-mono',
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
});

const display = Hanken_Grotesk({
  variable: '--font-custom-display',
  subsets: ['latin-ext'],
  weight: ['900'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Extract language code from locale (e.g., 'en_US' -> 'en')
  const lang = DEFAULT_LOCALE.split('_')[0] || 'en';

  // WebSite schema for SEO
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
  };

  return (
    <html
      lang={lang}
      className={`${sans.variable} ${mono.variable} ${display.variable}`}
    >
      <head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        />
        <link rel='icon' href='/favicon.png' type='image/png' />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(headJsonLd),
          }}
        />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
      </head>
      <body
        className={`flex min-h-screen flex-col overscroll-x-contain antialiased`}
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
