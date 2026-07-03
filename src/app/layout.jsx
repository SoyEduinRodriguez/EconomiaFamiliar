import '@/styles/globals.css'; // <-- Cambiado al alias global exacto

export const metadata = {
  title: 'Economía Familiar',
  description: 'Control financiero para el hogar',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="antialiased bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
