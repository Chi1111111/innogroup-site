import { Link } from 'react-router';
import { BrandLogo } from './BrandLogo';

export function Footer() {
  return (
    <footer className="bg-[#0f1012] px-4 py-18 text-white">
      <div className="section-shell">
        <div className="grid grid-cols-1 gap-10 border-b border-white/8 pb-12 md:grid-cols-[1.3fr_0.8fr_0.8fr_1.1fr]">
          <div className="space-y-5">
            <div>
              <BrandLogo variant="watermark" />
            </div>

            <p className="max-w-sm text-base leading-8 text-white/62">
              Auckland-based vehicle sourcing across Japan, China, Macau and selected overseas
              markets, with clear communication and local New Zealand support.
            </p>

            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Multi-Market Sourcing
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Quick Links</h4>
            <ul className="space-y-3 text-white/62">
              <li><Link to="/" className="inline-block transition-colors hover:text-primary">Home</Link></li>
              <li><Link to="/vehicles/china" className="inline-block transition-colors hover:text-primary">Cars from China</Link></li>
              <li><Link to="/jpauc-feed" className="inline-block transition-colors hover:text-primary">Cars From Japan</Link></li>
              <li><Link to="/about" className="inline-block transition-colors hover:text-primary">About</Link></li>
              <li><Link to="/services" className="inline-block transition-colors hover:text-primary">Services</Link></li>
              <li><Link to="/finance" className="inline-block transition-colors hover:text-primary">Finance</Link></li>
              <li><Link to="/contact" className="inline-block transition-colors hover:text-primary">Contact</Link></li>
            </ul>

            <h4 className="mb-5 mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Chinese</h4>
            <ul className="space-y-3 text-white/62">
              <li><Link to="/zh" className="inline-block transition-colors hover:text-primary">涓枃棣栭〉</Link></li>
              <li><Link to="/zh/services" className="inline-block transition-colors hover:text-primary">杩涘彛鍞悗</Link></li>
              <li><Link to="/zh/finance" className="inline-block transition-colors hover:text-primary">杞﹁締璐锋</Link></li>
              <li><Link to="/zh/about" className="inline-block transition-colors hover:text-primary">鍏充簬鎴戜滑</Link></li>
              <li><Link to="/zh/contact" className="inline-block transition-colors hover:text-primary">鑱旂郴鍜ㄨ</Link></li>
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
            <p className="mt-1">Multi-market vehicle sourcing, Auckland support, and overseas export capability.</p>
          </div>

          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 uppercase tracking-[0.16em] text-white/48">
            PEKEMA Registered Supplier 2026-2028
          </div>
        </div>
      </div>
    </footer>
  );
}

