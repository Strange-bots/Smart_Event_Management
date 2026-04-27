import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchFeaturedEvents } from "../../../services/homepageService.js";

const categoryColors = {
  Technology: "bg-[#f36f21] hover:bg-[#ff8a3d]",
  Cultural: "bg-[#6d5df6] hover:bg-[#7d70ff]",
  Sports: "bg-emerald-500 hover:bg-emerald-600",
  Academic: "bg-[#1f4e79] hover:bg-[#2e6da4]",
  Workshop: "bg-amber-500 hover:bg-amber-600",
  Conference: "bg-[#0f1e33] hover:bg-[#1b3354]",
  Career: "bg-[#1f4e79] hover:bg-[#2e6da4]",
  Networking: "bg-[#6d5df6] hover:bg-[#7d70ff]",
};

const cn = (...classes) => classes.filter(Boolean).join(" ");

const formatEventDate = (dateString) => {
  if (!dateString) {
    return "Date to be announced";
  }

  const parsedDate = new Date(dateString);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

const AnimatedSection = ({ className = "", delay = 0, children }) => (
  <div
    className={className}
    style={{
      animation: "featuredFadeUp 0.5s ease-out both",
      animationDelay: `${delay}ms`,
    }}
  >
    {children}
  </div>
);

function FeaturedEventsSection() {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadFeaturedEvents = async () => {
      try {
        const events = await fetchFeaturedEvents();

        if (!isMounted) {
          return;
        }

        setFeaturedEvents(
          events.map((event, index) => ({
            id: event.id,
            title: event.title,
            date: formatEventDate(event.date),
            time: event.time,
            location: event.venue || event.location,
            attendees: Number(event.attendees ?? event.registrations ?? 0),
            category: event.category,
            image: event.image || event.imagePreview,
            featured: Boolean(event.featured ?? index === 0),
          }))
        );
        setErrorMessage("");
      } catch {
        if (!isMounted) {
          return;
        }

        setFeaturedEvents([]);
        setErrorMessage(
          "Unable to load featured events right now. Please try again later."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFeaturedEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="bg-[#f4f0ff] py-16 md:py-24">
      <style>{`
        @keyframes featuredFadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0px);
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-12">
        <AnimatedSection className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-[#0f1e33] md:text-4xl">
              Featured Events
            </h2>
            <p className="text-[#6b7c93]">
              Don&apos;t miss these upcoming popular events
            </p>
          </div>
          <Link
            to="/browse-events"
            className="group inline-flex items-center rounded-lg border border-[#d9e2ec] px-5 py-3 text-sm font-semibold text-[#0f1e33] transition hover:border-[#f36f21] hover:text-[#f36f21]"
          >
            View All Events
            <span className="ml-2 transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </AnimatedSection>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full rounded-xl border border-[#d9e2ec] bg-white p-10 text-center text-[#6b7c93] shadow-sm">
              Loading featured events...
            </div>
          ) : null}

          {!isLoading && errorMessage ? (
            <div className="col-span-full rounded-xl border border-[#f36f21]/30 bg-white p-10 text-center text-[#9a3412] shadow-sm">
              {errorMessage}
            </div>
          ) : null}

          {!isLoading && !errorMessage && featuredEvents.length === 0 ? (
            <div className="col-span-full rounded-xl border border-[#d9e2ec] bg-white p-10 text-center text-[#6b7c93] shadow-sm">
              No featured events are available right now.
            </div>
          ) : null}

          {!isLoading && !errorMessage
            ? featuredEvents.map((event, index) => (
                <AnimatedSection key={event.id} delay={index * 100}>
                  <div
                    className={cn(
                      "group overflow-hidden rounded-xl border border-[#d9e2ec] bg-white shadow-sm",
                      "transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                    )}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />

                      <Link
                        to={`/browse-events?category=${event.category.toLowerCase()}`}
                        className="absolute left-4 top-4"
                      >
                        <span
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white transition-colors",
                            categoryColors[event.category] || "bg-[#1f4e79] hover:bg-[#2e6da4]"
                          )}
                        >
                          {event.category}
                        </span>
                      </Link>

                      {event.featured && (
                        <span className="absolute right-4 top-4 rounded-full bg-[#f36f21] px-3 py-1 text-xs font-semibold text-white">
                          Featured
                        </span>
                      )}
                    </div>

                    <div className="p-5">
                      <h3 className="mb-3 text-lg font-semibold text-[#0f1e33] transition-colors group-hover:text-[#f36f21]">
                        {event.title}
                      </h3>

                      <div className="mb-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-[#6b7c93]">
                          <span className="text-[#f36f21]">📅</span>
                          <span>
                            {event.date} • {event.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#6b7c93]">
                          <span className="text-[#f36f21]">📍</span>
                          <span>{event.location}</span>
                        </div>
                        <div
                          className="flex cursor-default items-center gap-2 text-sm text-[#6b7c93]"
                          title={`${event.attendees} people are attending this event`}
                        >
                          <span className="text-[#f36f21]">👥</span>
                          <span>{event.attendees} attending</span>
                        </div>
                      </div>

                      <Link
                        to="/browse-events"
                        className="group/link inline-flex items-center text-sm font-medium text-[#f36f21] transition-all hover:text-[#ff8a3d] hover:underline"
                      >
                        View Details
                        <span className="ml-1 transition-transform group-hover/link:translate-x-1">
                          →
                        </span>
                      </Link>
                    </div>
                  </div>
                </AnimatedSection>
              ))
            : null}
        </div>
      </div>
    </section>
  );
}

export default FeaturedEventsSection;
