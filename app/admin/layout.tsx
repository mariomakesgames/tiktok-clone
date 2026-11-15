import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Robloxtok Admin',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en'>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
