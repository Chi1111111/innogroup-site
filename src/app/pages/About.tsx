import { Users } from 'lucide-react';
import { Link } from 'react-router';
import { AboutSection } from '../components/AboutSection';
import { ExportExperienceSection } from '../components/ExportExperienceSection';
import { SourcingCredentialsSection } from '../components/SourcingCredentialsSection';
import { WhyChooseUsSection } from '../components/WhyChooseUsSection';
import { useLanguage } from '../components/SiteTranslator';

export function About() {
  const { text } = useLanguage();

  return (
    <div className="pt-20">
      <section className="bg-gradient-to-br from-primary/5 via-white to-primary/10 px-4 py-20">
        <div className="mx-auto max-w-7xl space-y-6 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary">{text({ en: 'About Us', zh: '关于我们' })}</span>
          </div>
          <h1 className="text-5xl font-bold text-foreground md:text-6xl">
            {text({ en: 'Your Trusted', zh: '值得信赖的' })} <span className="text-primary">{text({ en: 'Import Partner', zh: '进口与车源伙伴' })}</span>
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
            {text({
              en: 'Based in Auckland, New Zealand, Inno Group helps local customers, dealers and partners access trusted vehicle sources from Japan, China, Macau and selected overseas markets.',
              zh: 'Inno Group 位于新西兰奥克兰，帮助本地客户、车商和合作伙伴对接日本、中国、澳门及其他海外优质车源。',
            })}
          </p>
        </div>
      </section>

      <AboutSection />
      <SourcingCredentialsSection />
      <ExportExperienceSection />
      <WhyChooseUsSection />

      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-20 text-white">
        <div className="mx-auto max-w-4xl space-y-8 text-center">
          <h2 className="text-4xl font-bold text-white md:text-5xl">{text({ en: 'Join Our Growing Network', zh: '加入我们的车源与服务网络' })}</h2>
          <p className="text-xl text-gray-300">
            {text({
              en: 'Experience the Inno Group difference. Let us help you find the right vehicle channel and support pathway.',
              zh: '体验 Inno Group 的不同之处。让我们帮你找到合适的车源渠道和后续支持方案。',
            })}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/contact"
              className="inline-block rounded-2xl bg-gradient-to-r from-primary via-yellow-400 to-primary px-10 py-4 text-lg font-bold text-white shadow-xl transition-all hover:scale-105 hover:shadow-primary/50"
            >
              {text({ en: 'Contact Us Today', zh: '立即联系我们' })}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
