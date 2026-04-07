import { Mail, Phone, MapPin, Clock, MessageCircle } from 'lucide-react';
import { ContactSection } from '../components/ContactSection';
import { QuoteFormSection } from '../components/QuoteFormSection';

export function Contact() {
  return (
    <div className="pt-20">
      <section className="bg-gradient-to-br from-primary/5 via-white to-primary/10 px-4 py-20">
        <div className="mx-auto max-w-7xl space-y-6 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3">
            <Mail className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary">Get In Touch</span>
          </div>
          <h1 className="text-5xl font-bold text-foreground md:text-6xl">
            Let&apos;s <span className="text-primary">Connect</span>
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
            Have questions about importing a vehicle? Need a quote? Our team is here
            to help you every step of the way.
          </p>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent p-6 text-center transition-all hover:border-primary/30">
              <div className="rounded-xl bg-primary/10 p-3">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-3 text-base font-bold text-foreground">Phone</h3>
                <a
                  href="tel:+64288530725"
                  className="mb-1 block text-muted-foreground transition-colors hover:text-primary"
                >
                  +64 28 8530 7225
                </a>
                <a
                  href="tel:+64272858065"
                  className="block text-muted-foreground transition-colors hover:text-primary"
                >
                  +64 27 285 8065
                </a>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-transparent p-6 text-center transition-all hover:border-green-400">
              <div className="rounded-xl bg-green-100 p-3">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="mb-3 text-base font-bold text-foreground">WhatsApp</h3>
                <a
                  href="https://wa.me/642885307225"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-green-600 transition-colors hover:text-green-700"
                >
                  Chat Now
                </a>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent p-6 text-center transition-all hover:border-primary/30">
              <div className="rounded-xl bg-primary/10 p-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-3 text-base font-bold text-foreground">Email</h3>
                <a
                  href="mailto:innogroup.shawn@gmail.com"
                  className="break-all text-muted-foreground transition-colors hover:text-primary"
                >
                  innogroup.shawn@gmail.com
                </a>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent p-6 text-center transition-all hover:border-primary/30">
              <div className="rounded-xl bg-primary/10 p-3">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-3 text-base font-bold text-foreground">Location</h3>
                <p className="text-muted-foreground">
                  Unit 1A, 331 Rosedale Road, Albany, Auckland, New Zealand
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent p-6 text-center transition-all hover:border-primary/30">
              <div className="rounded-xl bg-primary/10 p-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-3 text-base font-bold text-foreground">Business Hours</h3>
                <p className="text-muted-foreground">
                  Mon - Fri: 10AM - 5PM
                  <br />
                  Other times by appointment
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <QuoteFormSection />
      <ContactSection />
    </div>
  );
}
