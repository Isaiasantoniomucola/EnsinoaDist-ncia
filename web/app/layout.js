import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { TemaProvider, scriptTema } from '@/components/Tema';

export const metadata = {
  title: 'EaD — Ensino a Distância',
  description: 'Plataforma de ensino a distância: aulas em vídeo e PDF, exercícios com correção automática e acompanhamento de resultados.',
  referrer: 'strict-origin-when-cross-origin',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0b1f4a' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1220' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: scriptTema }} /></head>
      <body>
        <TemaProvider>
          <AuthProvider>{children}</AuthProvider>
        </TemaProvider>
      </body>
    </html>
  );
}
