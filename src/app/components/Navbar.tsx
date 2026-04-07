import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { logoImage } from '../../data/pic';
import { SITE_FEATURES } from '../../config/siteFeatures';

const navigationLinks = [
  { to: '/', label: 'Home' },
  { to: '/vehicles', label: 'Vehicles' },
  { to: '/services', label: 'Services' },
  { to: '/finance', label: 'Finance' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const GlobeIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" fill="url(#globe-gradient)" stroke="#c7a24a" strokeWidth="1.5" />
    <path d="M20 2C20 2 14 10 14 20C14 30 20 38 20 38" stroke="#c7a24a" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M20 2C20 2 26 10 26 20C26 30 20 38 20 38" stroke="#c7a24a" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M3 20H37" stroke="#c7a24a" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M5 12H35" stroke="#c7a24a" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    <path d="M5 28H35" stroke="#c7a24a" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    <defs>
      <linearGradient id="globe-gradient" x1="20" y1="2" x2="20" y2="38" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1a1a1a" />
        <stop offset="1" stopColor="#2d2d2d" />
      </linearGradient>
    </defs>
  </svg>
);

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navLinkClass = (path: string) =>
    `rounded-full px-4 py-2 text-[13px] font-semibold uppercase tracking-[0.18em] transition-colors ${
      isActive(path)
        ? 'bg-primary/10 text-primary'
        : 'text-foreground/72 hover:bg-black/4 hover:text-foreground'
    }`;

  const mobileNavLinkClass = (path: string) =>
    `flex items-center justify-between rounded-[18px] px-4 py-3.5 text-sm font-semibold transition-colors ${
      isActive(path)
        ? 'bg-primary text-white shadow-[0_16px_35px_rgba(199,162,74,0.28)]'
        : 'bg-black/[0.03] text-foreground/78 hover:bg-black/[0.05] hover:text-foreground'
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-black/6 bg-[rgba(250,246,239,0.82)] shadow-[0_10px_40px_rgba(17,17,17,0.05)] backdrop-blur-xl">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />

      <div className="section-shell px-4 sm:px-6 lg:px-8">
        <div className="flex h-[4.15rem] items-center justify-between gap-3 sm:h-[4.5rem] md:h-20 md:gap-6">
          <div className="flex items-center">
            <Link to="/" className="group">
              {!logoError ? (
                <img
                  src={logoImage}
                  alt="Inno Group Ltd"
                  className="h-8 w-auto max-w-[170px] object-contain transition-all duration-300 group-hover:scale-[1.02] group-hover:opacity-90 sm:h-10 sm:max-w-none md:h-12"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <GlobeIcon />
                  <span className="text-2xl font-bold tracking-tight text-foreground">
                    Inno Group <span className="text-primary">Ltd</span>
                  </span>
                </div>
              )}
            </Link>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {navigationLinks.map((link) => (
              <Link key={link.to} to={link.to} className={navLinkClass(link.to)}>
                {link.label}
              </Link>
            ))}
            {SITE_FEATURES.stories ? (
              <Link to="/stories" className={navLinkClass('/stories')}>
                Success Stories
              </Link>
            ) : null}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/contact"
              className="inline-flex items-center rounded-full bg-[#151515] px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition-all hover:-translate-y-0.5 hover:bg-primary"
            >
              Request Quote
            </Link>
          </div>

          <button
            className="rounded-full border border-black/8 bg-white/60 p-2.5 text-foreground shadow-sm md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="pb-4 md:hidden">
            <div className="section-card space-y-2 p-2.5 sm:p-3">
              {navigationLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={mobileNavLinkClass(link.to)}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>{link.label}</span>
                  <span className="text-current/55">/</span>
                </Link>
              ))}
              {SITE_FEATURES.stories ? (
                <Link
                  to="/stories"
                  className={mobileNavLinkClass('/stories')}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>Success Stories</span>
                  <span className="text-current/55">/</span>
                </Link>
              ) : null}

              <Link
                to="/contact"
                className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-[#151515] px-5 py-3.5 text-sm font-semibold uppercase tracking-[0.16em] text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Request Quote
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
