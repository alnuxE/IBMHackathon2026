import './globals.css';
import { Manrope } from 'next/font/google';
import Nav from '../components/Nav';
import { ToastProvider } from '../components/Toast';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata = {
  title: 'NeoWallet — Pagos P2P',
  description: 'Billetera digital: recarga saldo, transfiere dinero y consulta tu historial.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={manrope.variable}>
      <body>
        <ToastProvider>
          <Nav />
          <main className="container">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
