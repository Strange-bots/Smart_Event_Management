import { useEffect, useState } from "react";

const testimonials = [
  {
    id: 1,
    name: "Dr. Sarah Mitchell",
    role: "Dean of Student Affairs",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    quote:
      "This platform has revolutionized how we manage campus events. The AI recommendations have increased student engagement by 40%.",
    institution: "King's Own Institute",
  },
  {
    id: 2,
    name: "Prof. James Chen",
    role: "Event Coordinator",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    quote:
      "The scheduling feature alone has saved us countless hours. No more double bookings or venue conflicts!",
    institution: "KOI Sydney Campus",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Student Union President",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    quote:
      "As a student, I love how easy it is to discover and register for events. The personalized recommendations are spot on!",
    institution: "Student Representative",
  },
];

const cn = (...classes) => classes.filter(Boolean).join(" ");

const AnimatedSection = ({ className = "", children }) => (
  <div
    className={className}
    style={{
      animation: "testimonialFadeUp 0.5s ease-out both",
    }}
  >
    {children}
  </div>
);

function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [isPaused]);

  const goToPrev = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section className="bg-[#f5f7fa] py-16 md:py-24">
      <style>{`
        @keyframes testimonialFadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-12">
        <AnimatedSection className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#0f1e33] md:text-4xl">
            What People Say
          </h2>
          <p className="mx-auto max-w-2xl text-[#6b7c93]">
            Hear from our community about their experience with our platform
          </p>
        </AnimatedSection>

        <div
          className="relative mx-auto max-w-4xl"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                  <div className="rounded-2xl border border-[#d9e2ec] bg-white p-8 shadow-lg md:p-12">
                    <div className="mb-6 text-4xl text-[#f36f21]">“</div>
                    <p className="mb-8 text-lg italic leading-relaxed text-[#0f1e33] md:text-xl">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-4">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="h-14 w-14 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-[#0f1e33]">
                          {testimonial.name}
                        </p>
                        <p className="text-sm text-[#6b7c93]">
                          {testimonial.role}
                        </p>
                        <p className="text-sm text-[#f36f21]">
                          {testimonial.institution}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={goToPrev}
            className="absolute left-0 top-1/2 hidden -translate-x-4 -translate-y-1/2 rounded-full border border-[#d9e2ec] bg-white p-3 shadow-lg transition hover:border-[#f36f21] hover:text-[#f36f21] md:flex"
            aria-label="Previous testimonial"
          >
            ←
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 hidden translate-x-4 -translate-y-1/2 rounded-full border border-[#d9e2ec] bg-white p-3 shadow-lg transition hover:border-[#f36f21] hover:text-[#f36f21] md:flex"
            aria-label="Next testimonial"
          >
            →
          </button>

          <div className="mt-8 flex justify-center gap-2">
            {testimonials.map((testimonial, index) => (
              <button
                key={testimonial.id}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "h-3 rounded-full transition-all duration-300",
                  index === activeIndex
                    ? "w-8 bg-[#f36f21]"
                    : "w-3 bg-[#6b7c93]/30 hover:bg-[#6b7c93]/50"
                )}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
