import { Link } from "react-router-dom";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const AnimatedSection = ({ className = "", delay = 0, children }) => (
  <div
    className={className}
    style={{
      animation: "fadeUp 0.5s ease-out both",
      animationDelay: `${delay}ms`,
    }}
  >
    {children}
  </div>
);

const CodeIcon = ({ size = 28, className = "" }) => (
  <span className={className} style={{ fontSize: size }}>
    {"</>"}
  </span>
);

const BriefcaseIcon = ({ size = 28, className = "" }) => (
  <span className={className} style={{ fontSize: size }}>
    {"\u{1F4BC}"}
  </span>
);

const BookIcon = ({ size = 28, className = "" }) => (
  <span className={className} style={{ fontSize: size }}>
    {"\u{1F4D6}"}
  </span>
);

const UsersIcon = ({ size = 28, className = "" }) => (
  <span className={className} style={{ fontSize: size }}>
    {"\u{1F465}"}
  </span>
);

const categories = [
  {
    id: "technology",
    title: "Technology",
    description: "Hackathons, coding workshops, and digital innovation events.",
    count: 120,
    color: "bg-[#1f4e79]",
    icon: CodeIcon,
  },
  {
    id: "business",
    title: "Business",
    description: "Networking sessions, startup showcases, and leadership forums.",
    count: 85,
    color: "bg-[#f36f21]",
    icon: BriefcaseIcon,
  },
  {
    id: "academics",
    title: "Academics",
    description: "Seminars, research presentations, and student success programs.",
    count: 140,
    color: "bg-[#6d5df6]",
    icon: BookIcon,
  },
  {
    id: "community",
    title: "Community",
    description: "Cultural gatherings, social activities, and campus engagement events.",
    count: 95,
    color: "bg-[#0f1e33]",
    icon: UsersIcon,
  },
];

const CategoriesSection = () => {
  return (
    <section id="categories" className="bg-[#f5f7fa] py-16 md:py-24">
      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
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
            Event Categories
          </h2>
          <p className="mx-auto max-w-2xl text-base text-[#6b7c93] md:text-lg">
            Explore events across different categories and find what interests
            you most
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => {
            const Icon = category.icon;

            return (
              <AnimatedSection key={category.id} delay={index * 100}>
                <Link
                  to={`/browse-events?category=${category.id}`}
                  className={cn(
                    "group block rounded-xl border border-[#d9e2ec] bg-white p-6 shadow-sm",
                    "transition-all duration-300 hover:scale-[1.03] hover:shadow-xl",
                    "cursor-pointer hover:border-b-4 hover:border-b-[#f36f21]"
                  )}
                >
                  <div
                    className={cn(
                      "mb-4 flex h-14 w-14 items-center justify-center rounded-xl",
                      "transition-all duration-300 group-hover:rotate-[10deg]",
                      category.color
                    )}
                  >
                    <Icon size={28} className="text-white" />
                  </div>

                  <h3 className="mb-2 text-lg font-semibold text-[#0f1e33] transition-colors group-hover:text-[#f36f21]">
                    {category.title}
                  </h3>
                  <p className="mb-3 text-sm text-[#6b7c93]">
                    {category.description}
                  </p>
                  <span className="text-sm font-medium text-[#f36f21]">
                    {category.count} Events {"\u2192"}
                  </span>
                </Link>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
