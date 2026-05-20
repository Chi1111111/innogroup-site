import { ImageWithFallback } from './figma/ImageWithFallback';
import { stats, aboutContent } from '../../data';

export function AboutSection() {
  return (
    <section id="about" className="py-24 px-4 bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block bg-primary/10 px-4 py-2 rounded-full mb-2">
            <span className="text-primary text-sm">About Us</span>
          </div>
          <h2 className="text-4xl md:text-5xl text-foreground mb-4">{aboutContent.title}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {aboutContent.subtitle}
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-block bg-primary/10 px-4 py-2 rounded-full mb-6">
              <span className="text-primary text-sm font-semibold">About Inno Group</span>
            </div>
            <h2 className="text-4xl md:text-5xl mb-6 text-foreground">Your Bridge to <span className="text-primary">Japan's Best Cars</span></h2>
            <div className="space-y-6">
              <p className="text-lg leading-relaxed">
                {aboutContent.description.split('\n\n')[0]}
              </p>
              <p className="text-lg leading-relaxed">
                {aboutContent.description.split('\n\n')[1]}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center bg-white p-5 rounded-2xl shadow-md border-2 border-gray-100 hover:border-primary/30 hover:shadow-lg transition-all md:p-6">
                    <Icon className="w-10 h-10 mx-auto mb-3 text-primary" />
                    <div className="text-3xl font-bold mb-2 text-primary">{stat.value}</div>
                    <div className="text-muted-foreground text-sm">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl blur-2xl opacity-50"></div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
              <ImageWithFallback
                src={aboutContent.imageUrl}
                alt={aboutContent.imageAlt}
                className="w-full h-[500px] object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
