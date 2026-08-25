import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CartPanel from '../components/CartPanel';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 md:py-12">
        {children}
      </main>
      <CartPanel />
      <Footer />
    </div>
  );
}
