import { CheckCircle, Clock, Quote, Star } from 'lucide-react';
import { caseStudiesContent, detailedCases } from '../../data/case-studies';

export function DetailedCaseStudies() {
  return (
    <section id="case-studies" className="bg-gradient-to-br from-white via-gray-50 to-white px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3">
            <Star className="h-5 w-5 fill-primary text-primary" />
            <span className="font-semibold text-primary">{caseStudiesContent.badge}</span>
          </div>
          <h2 className="mb-6 text-4xl font-bold text-foreground md:text-5xl">
            Real Stories from <span className="text-primary">Happy Clients</span>
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
            {caseStudiesContent.subtitle}
          </p>
        </div>

        <div className="space-y-12">
          {detailedCases.map((caseStudy) => (
            <div key={`${caseStudy.model}-${caseStudy.customerName}`} className="group relative">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary to-yellow-400 blur opacity-10 transition-opacity group-hover:opacity-20" />
              <div className="relative overflow-hidden rounded-3xl border-2 border-primary/10 bg-white shadow-2xl transition-all hover:border-primary/30">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  <div className="relative h-64 overflow-hidden lg:h-auto">
                    <img src={caseStudy.image} alt={caseStudy.model} className="h-full w-full object-cover" />
                    <div className="absolute left-4 top-4 rounded-full bg-green-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
                      Delivered
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-black/70 p-4 backdrop-blur-sm">
                      <div className="grid grid-cols-3 gap-4 text-center text-sm text-white">
                        <div>
                          <div className="font-bold text-primary">{caseStudy.year}</div>
                          <div className="text-xs">Year</div>
                        </div>
                        <div>
                          <div className="font-bold text-primary">{caseStudy.mileage}</div>
                          <div className="text-xs">Mileage</div>
                        </div>
                        <div>
                          <div className="font-bold text-primary">{caseStudy.condition}</div>
                          <div className="text-xs">Grade</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 p-8">
                    <div>
                      <h3 className="mb-2 text-3xl font-bold text-foreground">{caseStudy.model}</h3>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{caseStudy.timeline}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-3 font-bold text-foreground">Key Specifications</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {caseStudy.specs.map((spec) => (
                          <div key={spec} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
                            <span className="text-muted-foreground">{spec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-6">
                      <Quote className="mb-3 h-8 w-8 text-primary" />
                      <p className="mb-4 italic leading-relaxed text-foreground">
                        "{caseStudy.testimonial}"
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-foreground">{caseStudy.customerName}</p>
                          <p className="text-sm text-muted-foreground">{caseStudy.location}</p>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(caseStudy.rating)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
