import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Robloxtok Admin',
  icons: { icon: '/robloxtok.svg', apple: '/robloxtok-192.png' },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en'>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
