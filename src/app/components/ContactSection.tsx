import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export function ContactSection() {
  return (
    <section id="contact" className="py-24 px-4 bg-gradient-to-br from-white via-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block bg-primary/10 px-4 py-2 rounded-full mb-2">
            <span className="text-primary text-sm">Contact Information</span>
          </div>
          <h2 className="text-4xl md:text-5xl text-foreground mb-4">Visit Us or Call</h2>
          <p className="text-muted-foreground text-lg">
            Our Auckland team is ready to assist you<br className="hidden md:block" />
            with all your automotive needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border-2 border-gray-100 hover:border-primary/30 hover:-translate-y-2">
            <div className="text-center space-y-4">
              <div className="inline-flex bg-primary/10 p-5 rounded-2xl group-hover:scale-110 transition-transform">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h4 className="font-bold mb-3 text-foreground text-lg">Auckland Office</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Unit 1A,331 Rosedale Road,Albany,Auckland ,New Zealand
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border-2 border-gray-100 hover:border-primary/30 hover:-translate-y-2">
            <div className="text-center space-y-4">
              <div className="inline-flex bg-primary/10 p-5 rounded-2xl group-hover:scale-110 transition-transform">
                <Phone className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h4 className="font-bold mb-3 text-foreground text-lg">Phone Numbers</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Mobile 1:<br />
                  +64 28 8530 7225<br />
                  Mobile 2:<br />
                  +64 27 285 8065
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border-2 border-gray-100 hover:border-primary/30 hover:-translate-y-2">
            <div className="text-center space-y-4">
              <div className="inline-flex bg-primary/10 p-5 rounded-2xl group-hover:scale-110 transition-transform">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h4 className="font-bold mb-3 text-foreground text-lg">Email Us</h4>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  innogroup.shawn@gmail.com
                </p>
                <p className="text-sm text-primary font-semibold">
                  24-Hour Response
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border-2 border-gray-100 hover:border-primary/30 hover:-translate-y-2">
            <div className="text-center space-y-4">
              <div className="inline-flex bg-primary/10 p-5 rounded-2xl group-hover:scale-110 transition-transform">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h4 className="font-bold mb-3 text-foreground text-lg">Business Hours</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Monday - Friday<br />
                  10AM - 5PM<br />
                  Other times by appointment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
