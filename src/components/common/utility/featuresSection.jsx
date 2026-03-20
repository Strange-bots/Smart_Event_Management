const CalendarIcon = () => <span className="text-xl">📅</span>;
const UsersIcon = () => <span className="text-xl">👥</span>;
const ChartIcon = () => <span className="text-xl">📊</span>;
const BellIcon = () => <span className="text-xl">🔔</span>;
const ShieldIcon = () => <span className="text-xl">🛡️</span>;
const SparklesIcon = () => <span className="text-xl">✦</span>;

const features = [
  {
    icon: CalendarIcon,
    title: "Smart Scheduling",
    description:
      "AI-powered scheduling that finds the perfect time for your events based on participant availability.",
    color: "bg-[#f36f21]/10 text-[#f36f21]",
  },
  {
    icon: UsersIcon,
    title: "Easy Registration",
    description:
      "Streamlined registration process with automated confirmations and waitlist management.",
    color: "bg-[#1f4e79]/10 text-[#1f4e79]",
  },
  {
    icon: ChartIcon,
    title: "Analytics Dashboard",
    description:
      "Comprehensive insights on attendance, engagement, and event performance metrics.",
    color: "bg-[#6d5df6]/10 text-[#6d5df6]",
  },
  {
    icon: BellIcon,
    title: "Smart Notifications",
    description:
      "Automated reminders and updates to keep participants informed and engaged.",
    color: "bg-[#f36f21]/10 text-[#f36f21]",
  },
  {
    icon: ShieldIcon,
    title: "Secure Platform",
    description:
      "Enterprise-grade security to protect your event data and participant information.",
    color: "bg-[#1f4e79]/10 text-[#1f4e79]",
  },
  {
    icon: SparklesIcon,
    title: "AI Recommendations",
    description:
      "Get intelligent suggestions for optimal event timing, venues, and content.",
    color: "bg-[#6d5df6]/10 text-[#6d5df6]",
  },
];

function FeaturesSection() {
  return (
    <section className="bg-[#f5f7fa] py-16 md:py-24">
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-12">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#0f1e33] md:text-4xl">
            Powerful Features
          </h2>
          <p className="mx-auto max-w-2xl text-[#6b7c93]">
            Everything you need to create, manage, and analyze successful
            educational events.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-[#d9e2ec] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${feature.color}`}
                >
                  <Icon />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#0f1e33]">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#6b7c93]">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
