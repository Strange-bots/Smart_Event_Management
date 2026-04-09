const benefits = [
  "Easy event creation and management",
  "AI-powered scheduling recommendations",
  "Real-time analytics and reports",
  "Automated participant notifications",
];

function CTASection() {
  return (
    <section className="bg-[#f5f7fa] py-16 md:py-24">
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1f4e79] via-[#163a5a] to-[#0f1e33] p-8 md:p-12 lg:p-16">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[#f36f21]/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[#6d5df6]/20 blur-3xl" />

          <div className="relative z-10 grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
                Ready to Transform Your Events?
              </h2>
              <p className="mb-8 text-lg text-white/80">
                Join thousands of educators and event organizers who trust our
                platform for seamless event management.
              </p>

              <ul className="mb-8 space-y-3">
                {benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-center gap-3 text-white/90"
                  >
                    <span className="shrink-0 text-[#f36f21]">✓</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-4 sm:flex-row">
                <a
                  href="/signup"
                  className="group inline-flex items-center justify-center rounded-lg bg-[#f36f21] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ff8a3d]"
                >
                  Start Free Today
                  <span className="ml-2 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </a>
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Contact Sales
                </a>
              </div>
            </div>

            <div className="hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&q=80"
                alt="Happy students at event"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTASection;
