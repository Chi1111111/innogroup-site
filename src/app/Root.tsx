import { Outlet, useLocation } from 'react-router';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { StickyCTA } from './components/StickyCTA';
import { SEO } from './components/SEO';

export function Root() {
  const location = useLocation();
  const isWorkflowRoute =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/sign/') ||
    location.pathname.startsWith('/contract/');

  return (
    <div className="min-h-screen bg-background">
      <SEO />
      <ScrollToTop />
      {isWorkflowRoute ? null : <Navbar />}
      <Outlet />
      {isWorkflowRoute ? null : <Footer />}
      {isWorkflowRoute ? null : <StickyCTA />}
    </div>
  );
}
