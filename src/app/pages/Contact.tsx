import { Mail, Phone, MapPin, Clock, MessageCircle } from 'lucide-react';
import { ContactSection } from '../components/ContactSection';
import { QuoteFormSection } from '../components/QuoteFormSection';
import { useLanguage } from '../components/SiteTranslator';

export function Contact() {
  const { text } = useLanguage();

  return (
    <div className="pt-20">
      <section className="bg-gradient-to-br from-primary/5 via-white to-primary/10 px-4 py-20">
        <div className="mx-auto max-w-7xl space-y-6 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3">
            <Mail className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary">{text({ en: 'Get In Touch', zh: '联系咨询' })}</span>
          </div>
          <h1 className="text-5xl font-bold text-foreground md:text-6xl">
            {text({ en: "Let's", zh: '欢迎' })} <span className="text-primary">{text({ en: 'Connect', zh: '联系我们' })}</span>
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
            {text({
              en: 'Have questions about importing a vehicle? Need a quote? Our team is here to help you every step of the way.',
              zh: '想了解车辆进口、中国车源或报价？我们的团队可以帮你把下一步讲清楚。',
            })}
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
                <h3 className="mb-3 text-base font-bold text-foreground">{text({ en: 'Phone', zh: '电话' })}</h3>
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
                  href="https://wa.me/64272858065"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-green-600 transition-colors hover:text-green-700"
                >
                  {text({ en: 'Chat Now', zh: '立即咨询' })}
                </a>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent p-6 text-center transition-all hover:border-primary/30">
              <div className="rounded-xl bg-primary/10 p-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-3 text-base font-bold text-foreground">{text({ en: 'Email', zh: '邮箱' })}</h3>
                <p className="break-all text-muted-foreground">
                  innogroup.shawn@gmail.com
                </p>
                <p className="mt-1 break-all text-muted-foreground">
                  innogroup.cao@gmail.com
                </p>
                <p className="mt-2 text-sm font-semibold text-primary">
                  {text({ en: 'Please use the form below', zh: '请优先填写下方表格' })}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent p-6 text-center transition-all hover:border-primary/30">
              <div className="rounded-xl bg-primary/10 p-3">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-3 text-base font-bold text-foreground">{text({ en: 'Location', zh: '地址' })}</h3>
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
                <h3 className="mb-3 text-base font-bold text-foreground">{text({ en: 'Business Hours', zh: '营业时间' })}</h3>
                <p className="text-muted-foreground">
                  {text({ en: 'Mon - Fri: 10AM - 5PM', zh: '周一至周五：10AM - 5PM' })}
                  <br />
                  {text({ en: 'Other times by appointment', zh: '其他时间可预约' })}
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
