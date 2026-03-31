import Navbar from "../components/layout/navbar";
import Footer from "../components/layout/footer";
import { Users, Target, Award, Sparkles } from "lucide-react";

const values = [
  {
    title: "Community",
    description:
      "Building connections between students, educators, and industry leaders.",
    icon: Users,
    iconWrapperClass: "bg-[#f36f21]/10",
    iconClass: "text-[#f36f21]",
  },
  {
    title: "Innovation",
    description:
      "AI-powered recommendations for personalized event discovery.",
    icon: Sparkles,
    iconWrapperClass: "bg-[#6d5df6]/10",
    iconClass: "text-[#6d5df6]",
  },
  {
    title: "Excellence",
    description:
      "Curated events that enhance academic and professional growth.",
    icon: Target,
    iconWrapperClass: "bg-[#1f4e79]/10",
    iconClass: "text-[#1f4e79]",
  },
  {
    title: "Recognition",
    description:
      "Certificates and achievements to showcase your participation.",
    icon: Award,
    iconWrapperClass: "bg-[#1f4e79]/10",
    iconClass: "text-[#1f4e79]",
  },
];

function About() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7fa]">
      <Navbar />

      <main className="flex-1">
        <div className="bg-gradient-to-br from-[#1f4e79] via-[#1f4e79] to-[#163a5a] py-16 md:py-24">
          <div className="mx-auto max-w-[1440px] px-4 text-center lg:px-12">
            <h1 className="mb-4 text-3xl font-bold text-white md:text-5xl">
              About Smart Events
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/80">
              Empowering educational experiences through intelligent event
              management
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-[1440px] px-4 py-12 lg:px-12">
          <div className="mx-auto mb-16 max-w-4xl">
            <h2 className="mb-6 text-center text-2xl font-bold text-[#0f1e33] md:text-3xl">
              Our Mission
            </h2>
            <p className="text-center text-lg leading-relaxed text-[#6b7c93]">
              Smart Events is King&apos;s Own Institute&apos;s premier event
              management platform, designed to connect students, faculty, and
              industry professionals through meaningful educational
              experiences. We leverage AI-powered recommendations to help you
              discover events that align with your academic goals and career
              aspirations.
            </p>
          </div>

          <div className="mb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;

              return (
                <div
                  key={value.title}
                  className="rounded-xl border border-[#d9e2ec] bg-white text-center shadow-lg"
                >
                  <div className="p-6">
                    <div
                      className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${value.iconWrapperClass}`}
                    >
                      <Icon className={value.iconClass} size={28} />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-[#1f4e79]">
                      {value.title}
                    </h3>
                    <p className="text-sm text-[#6b7c93]">
                      {value.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mx-auto max-w-4xl rounded-2xl border border-[#d9e2ec] bg-white p-8 shadow-sm md:p-12">
            <h2 className="mb-4 text-2xl font-bold text-[#0f1e33]">
              About King&apos;s Own Institute
            </h2>
            <p className="mb-4 leading-relaxed text-[#6b7c93]">
              King&apos;s Own Institute (KOI) is a leading private higher
              education provider in Australia, offering quality education in
              Business, Information Technology, and English language programs.
              Located in the heart of Sydney, KOI is committed to providing
              students with practical skills and knowledge for successful
              careers.
            </p>
            <p className="leading-relaxed text-[#6b7c93]">
              Through Smart Events, we extend our commitment to holistic
              education by providing opportunities for networking,
              professional development, and community engagement beyond the
              classroom.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default About;
