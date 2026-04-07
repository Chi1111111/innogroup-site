import { Outlet } from 'react-router';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { StickyCTA } from './components/StickyCTA';

export function Root() {
  return (
    <div className="min-h-screen bg-background">
      <ScrollToTop />
      <Navbar />
      <Outlet />
      <Footer />
      <StickyCTA />
    </div>
  );
}