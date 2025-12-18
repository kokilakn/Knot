import type { Metadata } from 'next';
import './globals.css';
import { UserProvider } from '@/lib/UserContext';

export const metadata: Metadata = {
  title: 'Knot – Find Yourself in Every Photo',
  description: 'Organize and discover your photos with face recognition',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
      </head>
      <body className="paper-texture">
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}

