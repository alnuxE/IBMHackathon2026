import './globals.css';
import Nav from '../components/Nav';
import { ToastProvider } from '../components/Toast';

export const metadata = {
  title: 'OfficeSpace — Reserva de espacios',
  description: 'Encuentra y reserva espacios de trabajo. Corporativo Alpha.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <ToastProvider>
          <Nav />
          <main className="container">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
