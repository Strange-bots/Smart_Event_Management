import Navbar from "../components/layout/navbar";
import Footer from "../components/layout/footer";
import { Mail, Phone, MapPin, Clock, Sparkles } from "lucide-react";

const contactCards = [
  {
    title: "Email Us",
    description: "Reach out for event support, collaboration, or general help.",
    value: "events@koi.edu.au",
    href: "mailto:events@koi.edu.au",
    icon: Mail,
  },
  {
    title: "Call Us",
    description: "Speak with our team during business hours for quick support.",
    value: "+61 2 9283 3583",
    href: "tel:+61292833583",
    icon: Phone,
  },
  {
    title: "Visit Us",
    description: "Find us in the heart of Sydney for student and campus events.",
    value: "Level 1, 545 Kent Street, Sydney NSW 2000",
    href: "https://maps.google.com/?q=545+Kent+Street+Sydney+NSW+2000",
    icon: MapPin,
  },
];

function Contact() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7fa]">
      <Navbar />

      <main className="flex-1">
        <div className="bg-gradient-to-br from-[#1f4e79] via-[#1f4e79] to-[#163a5a] py-16 md:py-24">
          <div className="mx-auto max-w-[1440px] px-4 text-center lg:px-12">
            <h1 className="mb-4 text-3xl font-bold text-white md:text-5xl">
              Contact Smart Events
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/80">
              We&apos;re here to help with event access, registrations, and
              campus engagement opportunities.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-[1440px] px-4 py-12 lg:px-12">
          <div className="mb-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {contactCards.map((card) => {
              const Icon = card.icon;

              return (
                <a
                  key={card.title}
                  href={card.href}
                  target={card.title === "Visit Us" ? "_blank" : undefined}
                  rel={card.title === "Visit Us" ? "noreferrer" : undefined}
                  className="rounded-xl border border-[#d9e2ec] bg-white p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f36f21]/10">
                    <Icon className="text-[#f36f21]" size={28} />
                  </div>
                  <h2 className="mb-2 text-xl font-semibold text-[#1f4e79]">
                    {card.title}
                  </h2>
                  <p className="mb-4 text-sm leading-relaxed text-[#6b7c93]">
                    {card.description}
                  </p>
                  <p className="font-medium leading-relaxed text-[#0f1e33]">
                    {card.value}
                  </p>
                </a>
              );
            })}
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-[#d9e2ec] bg-white p-8 shadow-sm md:p-12">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#6d5df6]/10 px-4 py-2 text-sm font-medium text-[#6d5df6]">
                <Sparkles size={16} />
                AI-Enhanced Event Support
              </div>
              <h2 className="mb-4 text-2xl font-bold text-[#0f1e33] md:text-3xl">
                Let&apos;s make your event experience smoother
              </h2>
              <p className="mb-6 leading-relaxed text-[#6b7c93]">
                Whether you&apos;re a student exploring opportunities, a faculty
                member coordinating participation, or a guest speaker joining
                an academic event, Smart Events helps you stay informed and
                connected.
              </p>
              <a
                href="mailto:events@koi.edu.au"
                className="inline-flex rounded-lg bg-[#f36f21] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ff8a3d]"
              >
                Contact the Events Team
              </a>
            </div>

            <div className="rounded-2xl border border-[#d9e2ec] bg-[#f5f7fa] p-8 md:p-10">
              <h2 className="mb-6 text-2xl font-bold text-[#1f4e79]">
                Office Hours
              </h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1f4e79]/10">
                    <Clock className="text-[#1f4e79]" size={22} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0f1e33]">
                      Monday to Friday
                    </p>
                    <p className="text-[#6b7c93]">9:00 AM to 5:00 PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1f4e79]/10">
                    <MapPin className="text-[#1f4e79]" size={22} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0f1e33]">
                      Campus Location
                    </p>
                    <p className="text-[#6b7c93]">
                      Level 1, 545 Kent Street, Sydney NSW 2000
                    </p>
                  </div>
                </div>
                <div className="rounded-xl bg-white p-5 shadow-sm">
                  <p className="mb-2 font-semibold text-[#1f4e79]">
                    Need help fast?
                  </p>
                  <p className="text-sm leading-relaxed text-[#6b7c93]">
                    For urgent event questions, email us with your event name,
                    date, and issue so the team can respond faster.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Contact;
