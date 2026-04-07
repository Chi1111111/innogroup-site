/**
 * Testimonials used by the optional stories section.
 */

export interface Testimonial {
  name: string;
  vehicle: string;
  rating: number;
  comment: string;
  location: string;
}

export const testimonials: Testimonial[] = [
  {
    name: 'James Wilson',
    vehicle: 'Toyota Camry 2022',
    rating: 5,
    comment: 'We got the Camry spec we wanted and the whole process was transparent and professional.',
    location: 'Auckland',
  },
  {
    name: 'Sarah Chen',
    vehicle: 'Mazda CX-5 2023',
    rating: 5,
    comment: 'INNO GROUP made importing from Japan effortless. My CX-5 arrived in perfect condition, fully complied.',
    location: 'Wellington',
  },
  {
    name: 'Michael Brown',
    vehicle: 'Honda Civic 2021',
    rating: 5,
    comment: 'Best decision ever. Quality car, the right spec, and excellent customer service throughout.',
    location: 'Christchurch',
  },
];
