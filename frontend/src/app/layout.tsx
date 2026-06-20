import type { Metadata } from 'next';
import '@/styles/globals.css';
import {
  getPublicAppDescription,
  getPublicAppName,
  getPublicMetaKeywords,
} from '@/lib/siteConfig';

export function generateMetadata(): Metadata {
  const name = getPublicAppName();
  const desc = getPublicAppDescription();
  const keywords = getPublicMetaKeywords();
  return {
    title: name ? `${name} — Portal` : 'Portal',
    ...(desc ? { description: desc } : {}),
    ...(keywords.length ? { keywords } : {}),
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
