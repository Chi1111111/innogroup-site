import { Link } from 'react-router';
import { useState } from 'react';
import { logoImage } from '../../data/pic';

const GlobeIconWhite = () => (
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" fill="url(#globe-gradient-white)" stroke="#c7a24a" strokeWidth="1.5"/>
    <path d="M20 2C20 2 14 10 14 20C14 30 20 38 20 38" stroke="#c7a24a" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M20 2C20 2 26 10 26 20C26 30 20 38 20 38" stroke="#c7a24a" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M3 20H37" stroke="#c7a24a" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M5 12H35" stroke="#c7a24a" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    <path d="M5 28H35" stroke="#c7a24a" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    <defs>
      <linearGradient id="globe-gradient-white" x1="20" y1="2" x2="20" y2="38" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3d3d3d"/>
        <stop offset="1" stopColor="#1a1a1a"/>
      </linearGradient>
    </defs>
  </svg>
);

export function Footer() {
  const [logoError, setLogoError] = useState(false);

  return (
    <footer className="bg-[#0f1012] px-4 py-18 text-white">
      <div className="section-shell">
        <div className="grid grid-cols-1 gap-10 border-b border-white/8 pb-12 md:grid-cols-[1.3fr_0.8fr_0.8fr_1.1fr]">
          <div className="space-y-5">
            <div>
              {!logoError ? (
                <div className="inline-flex items-center rounded-2xl bg-white/95 p-3 shadow-lg ring-1 ring-white/10">
                  <img
                    src={logoImage}
                    alt="Inno Group Ltd"
                    className="h-12 w-auto max-w-[220px] object-contain transition-opacity duration-300 hover:opacity-80"
                    onError={() => setLogoError(true)}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <GlobeIconWhite />
                  <span className="text-xl font-bold tracking-tight text-white">
                    Inno Group <span className="text-primary">Ltd</span>
                  </span>
                </div>
              )}
            </div>

            <p className="max-w-sm text-base leading-8 text-white/62">
              Auckland-based vehicle sourcing with direct Japan access, transparent pricing, and
              practical support after purchase.
            </p>

            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Japan Direct Sourcing
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Quick Links</h4>
            <ul className="space-y-3 text-white/62">
              <li><Link to="/" className="inline-block transition-colors hover:text-primary">Home</Link></li>
              <li><Link to="/vehicles" className="inline-block transition-colors hover:text-primary">Vehicles</Link></li>
              <li><Link to="/about" className="inline-block transition-colors hover:text-primary">About</Link></li>
              <li><Link to="/services" className="inline-block transition-colors hover:text-primary">Services</Link></li>
              <li><Link to="/finance" className="inline-block transition-colors hover:text-primary">Finance</Link></li>
              <li><Link to="/contact" className="inline-block transition-colors hover:text-primary">Contact</Link></li>
            </ul>

            <h4 className="mb-5 mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Chinese</h4>
            <ul className="space-y-3 text-white/62">
              <li><Link to="/zh" className="inline-block transition-colors hover:text-primary">中文首页</Link></li>
              <li><Link to="/zh/vehicles" className="inline-block transition-colors hover:text-primary">买车找车</Link></li>
              <li><Link to="/zh/services" className="inline-block transition-colors hover:text-primary">进口售后</Link></li>
              <li><Link to="/zh/finance" className="inline-block transition-colors hover:text-primary">车辆贷款</Link></li>
              <li><Link to="/zh/about" className="inline-block transition-colors hover:text-primary">关于我们</Link></li>
              <li><Link to="/zh/contact" className="inline-block transition-colors hover:text-primary">联系咨询</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Support</h4>
            <ul className="space-y-3 text-white/62">
              <li><Link to="/services" className="inline-block transition-colors hover:text-primary">Panel and paint support</Link></li>
              <li><Link to="/services" className="inline-block transition-colors hover:text-primary">Mechanical repairs</Link></li>
              <li><Link to="/services" className="inline-block transition-colors hover:text-primary">Parts sourcing</Link></li>
              <li><Link to="/services" className="inline-block transition-colors hover:text-primary">Partner referrals</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Contact</h4>
            <ul className="space-y-4 text-white/62">
              <li>
                <strong className="text-white">Phone</strong><br />
                <a href="tel:+64288530725" className="transition-colors hover:text-primary">+64 28 8530 7225</a><br />
                <a href="tel:+64272858065" className="transition-colors hover:text-primary">+64 27 285 8065</a>
              </li>
              <li>
                <strong className="text-white">WhatsApp</strong><br />
                <a href="https://wa.me/642885307225" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">
                  +64 28 8530 7225
                </a>
              </li>
              <li>
                <strong className="text-white">Email</strong><br />
                <a href="mailto:innogroup.shawn@gmail.com" className="transition-colors hover:text-primary">innogroup.shawn@gmail.com</a>
              </li>
              <li>
                <strong className="text-white">Address</strong><br />
                Unit 1A, 331 Rosedale Road, Albany, Auckland, New Zealand
              </li>
              <li>
                <strong className="text-white">Hours</strong><br />
                Mon-Fri: 10AM-5PM<br />
                Other times by appointment
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 pt-8 text-sm text-white/42 md:flex-row md:items-center">
          <div>
            <p>&copy; 2026 Inno Group Ltd. All rights reserved.</p>
            <p className="mt-1">Japan direct sourcing, Auckland support, and overseas export capability.</p>
          </div>

          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 uppercase tracking-[0.16em] text-white/48">
            PEKEMA Registered Supplier 2026-2028
          </div>
        </div>
      </div>
    </footer>
  );
}
