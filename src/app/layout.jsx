import '@/styles/globals.css';

export const metadata = {
  title: 'Economía Familiar',
  description: 'Control financiero para el hogar',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
