import { useEffect, useState } from "react";
import { fetchRecommendedEvents } from "../../../services/homepageService.js";

const fallbackRecommendations = [
  {
    id: "fallback-ai-workshop",
    title: "AI & Machine Learning Workshop",
    date: "Coming soon",
    category: "Tech",
    match: 95,
    attendees: 120,
    image:
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&q=80",
  },
  {
    id: "fallback-data-science",
    title: "Data Science Bootcamp",
    date: "Coming soon",
    category: "Academic",
    match: 88,
    attendees: 80,
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80",
  },
  {
    id: "fallback-hackathon",
    title: "Innovation Hackathon",
    date: "Coming soon",
    category: "Tech",
    match: 82,
    attendees: 200,
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&q=80",
  },
];

const formatRecommendationDate = (dateString) => {
  if (!dateString) {
    return "Coming soon";
  }

  const parsedDate = new Date(dateString);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
};

const cn = (...classes) => classes.filter(Boolean).join(" ");

const AnimatedSection = ({ className = "", delay = 0, children }) => (
  <div
    className={className}
    style={{
      animation: "recommendationFadeUp 0.5s ease-out both",
      animationDelay: `${delay}ms`,
    }}
  >
    {children}
  </div>
);

function AIRecommendationSection() {
  const [recommendations, setRecommendations] = useState(fallbackRecommendations);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadRecommendations = async () => {
      try {
        const liveRecommendations = await fetchRecommendedEvents();

        if (!isMounted || !liveRecommendations.length) {
          return;
        }

        setRecommendations(
          liveRecommendations.map((event) => ({
            id: event.id,
            title: event.title,
            date: formatRecommendationDate(event.date),
            category: event.category,
            match: event.match,
            attendees: event.attendees,
            image: event.image,
          }))
        );
        setErrorMessage("");
      } catch {
        if (!isMounted) {
          return;
        }

        setRecommendations(fallbackRecommendations);
        setErrorMessage(
          "Unable to load live recommendations. Showing default suggestions."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRecommendations();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleJoinNow = (eventId) => {
    window.location.assign(`/event/${eventId}/register`);
  };

  const handleViewAll = () => {
    window.location.assign("/recommendations");
  };

  return (
    <section className="bg-gradient-to-br from-[#ffffff]/5 to-[#f36f21]/5 py-16 md:py-24">
      <style>{`
        @keyframes recommendationFadeUp {
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
          <div className="mb-4 inline-flex animate-pulse items-center gap-2 rounded-full bg-[#6d5df6]/20 px-4 py-2 text-sm text-[#6d5df6]">
            <span>✦</span>
            <span>AI-Powered</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-[#0f1e33] md:text-4xl">
            Recommended For You
          </h2>
          <p className="mx-auto max-w-2xl text-[#6b7c93]">
            Our AI analyzes your interests and activity to suggest the perfect
            events for you
          </p>
          {isLoading ? (
            <p className="mt-4 text-sm font-medium text-[#6d5df6]">
              Loading recommendations...
            </p>
          ) : null}
          {!isLoading && errorMessage ? (
            <p className="mt-4 text-sm font-medium text-[#f36f21]">
              {errorMessage}
            </p>
          ) : null}
        </AnimatedSection>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((event, index) => (
            <AnimatedSection key={event.id} delay={index * 100}>
              <div
                className={cn(
                  "group relative overflow-hidden rounded-xl border border-[#d9e2ec] bg-white shadow-sm",
                  "transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
                  "hover:border-l-4 hover:border-l-[#6d5df6]"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#6d5df6]/0 via-[#6d5df6]/5 to-[#6d5df6]/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative h-40 overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                  <div className="absolute right-4 top-4 rounded-full bg-white p-2 shadow-lg">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#6d5df6]/20">
                      <span
                        className={cn(
                          "text-xs font-bold",
                          event.match >= 90
                            ? "text-green-500"
                            : event.match >= 80
                              ? "text-[#6d5df6]"
                              : "text-[#f36f21]"
                        )}
                      >
                        {event.match}%
                      </span>
                    </div>
                  </div>

                  <span className="absolute left-4 top-4 rounded-full bg-[#6d5df6] px-3 py-1 text-xs font-semibold text-white">
                    {event.category}
                  </span>
                </div>

                <div className="relative p-5">
                  <h3 className="mb-2 text-lg font-semibold text-[#0f1e33] transition-colors group-hover:text-[#6d5df6]">
                    {event.title}
                  </h3>

                  <div className="mb-4 flex items-center gap-4 text-sm text-[#6b7c93]">
                    <span className="flex items-center gap-1">
                      <span className="text-[#6d5df6]">📅</span>
                      {event.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-[#6d5df6]">👥</span>
                      {event.attendees}
                    </span>
                  </div>

                  <button
                    onClick={() => handleJoinNow(event.id)}
                    className="w-full rounded-lg bg-[#6d5df6] px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-[#7d70ff]"
                  >
                    Join Now
                  </button>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection className="mt-8 text-center">
          <button
            onClick={handleViewAll}
            className="group inline-flex items-center font-medium text-[#6d5df6] transition-colors hover:text-[#5b4be8]"
          >
            View All Recommendations
            <span className="ml-2 transition-transform group-hover:translate-x-1">
              →
            </span>
          </button>
        </AnimatedSection>
      </div>
    </section>
  );
}

export default AIRecommendationSection;
