import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang='en'>
      <Head>
        <link rel='manifest' href='/manifest.json' />
        <link rel='icon' type='image/svg+xml' href='/robloxtok.svg' />
        <link rel='apple-touch-icon' href='/robloxtok-192.png' />
        <meta name='theme-color' content='#121212' />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
