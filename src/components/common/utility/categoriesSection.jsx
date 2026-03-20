const categories = [
  {
    id: "technology",
    title: "Technology",
    description: "Hackathons, coding meetups, product demos, and innovation labs.",
    count: 24,
    accent: "bg-[#1f4e79]",
    glow: "from-[#1f4e79]/18 to-transparent",
  },
  {
    id: "workshops",
    title: "Workshops",
    description: "Hands-on learning sessions for practical academic and career skills.",
    count: 18,
    accent: "bg-[#6d5df6]",
    glow: "from-[#6d5df6]/18 to-transparent",
  },
  {
    id: "networking",
    title: "Networking",
    description: "Industry mixers, alumni sessions, and professional connection events.",
    count: 15,
    accent: "bg-[#f36f21]",
    glow: "from-[#f36f21]/18 to-transparent",
  },
  {
    id: "competitions",
    title: "Competitions",
    description: "Pitch nights, case challenges, academic contests, and team events.",
    count: 11,
    accent: "bg-[#0f1e33]",
    glow: "from-[#0f1e33]/18 to-transparent",
  },
];

const CategoriesSection = () => {
  return (
    <section id="categories" className="bg-[#f5f7fa] py-16 md:py-24">
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-12">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#1f4e79] md:text-4xl">
            Event Categories
          </h2>
          <p className="mx-auto max-w-2xl text-base text-[#6b7c93] md:text-lg">
            Explore events across different categories and find what interests
            you most.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
