import { Star, Quote } from 'lucide-react';
import { testimonials } from '../../data';

export function TestimonialsSection() {
  return (
    <section className="py-24 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block bg-primary/10 px-4 py-2 rounded-full mb-2">
            <span className="text-primary text-sm">Testimonials</span>
          </div>
          <h2 className="text-4xl md:text-5xl text-foreground">What Our Clients Say</h2>
          <p className="text-lg text-muted-foreground">
            Real feedback from real customers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl p-8 space-y-6 shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-primary/20 hover:-translate-y-2 relative overflow-hidden"
            >
              {/* Decorative quote mark */}
              <div className="absolute top-6 right-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Quote className="w-16 h-16 text-primary" />
              </div>
              
              {/* Star rating */}
              <div className="flex gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              
              {/* Comment */}
              <p className="text-muted-foreground leading-relaxed relative z-10">
                "{testimonial.comment}"
              </p>
              
              {/* Author info */}
              <div className="pt-6 border-t border-gray-100">
                <div className="font-semibold text-foreground">{testimonial.name}</div>
                <div className="text-sm text-muted-foreground mt-1">{testimonial.vehicle}</div>
                <div className="text-xs text-primary mt-1">{testimonial.location}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-6 py-3 rounded-full border border-primary/20">
            <Star className="w-5 h-5 fill-primary text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Rated <span className="text-primary">4.9/5</span> from 500+ verified customers
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}