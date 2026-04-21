import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchEventStats,
  fetchHeroImage,
  fetchNextEvent,
} from "../../../services/homepageService.js";

const fallbackEvent = {
  title: "Next event coming soon",
  date: "Stay tuned",
  image:
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
};

const fallbackStats = {
  eventsHosted: 5000,
  participants: 12000,
  institutions: 50,
};

const formatEventDate = (dateString) => {
  if (!dateString) {
    return fallbackEvent.date;
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

function HeroSection() {
  const [stats, setStats] = useState(fallbackStats);
  const [nextEvent, setNextEvent] = useState(fallbackEvent);
  const [heroImage, setHeroImage] = useState(fallbackEvent.image);
  const [isHeroImageLoading, setIsHeroImageLoading] = useState(true);
  const [heroImageError, setHeroImageError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        const data = await fetchEventStats();

        if (!isMounted || !data) {
          return;
        }

        setStats({
          eventsHosted: data.eventsHosted ?? fallbackStats.eventsHosted,
          participants: data.participants ?? fallbackStats.participants,
          institutions: data.institutions ?? fallbackStats.institutions,
        });
      } catch {
        // Keep the default stats when the backend is unavailable.
      }
    };

    const loadHeroImage = async () => {
      try {
        const imageUrl = await fetchHeroImage();

        if (!isMounted || !imageUrl) {
          return;
        }

        setHeroImage(imageUrl);
        setHeroImageError("");
      } catch {
        if (!isMounted) {
          return;
        }

        setHeroImage(fallbackEvent.image);
        setHeroImageError("Unable to load hero image. Showing default image.");
      } finally {
        if (isMounted) {
          setIsHeroImageLoading(false);
        }
      }
    };

    const loadNextEvent = async () => {
      try {
        const event = await fetchNextEvent();

        if (!isMounted || !event) {
          return;
        }

        setNextEvent({
          title: event.title || fallbackEvent.title,
          date: formatEventDate(event.date),
          image: event.image || fallbackEvent.image,
        });
      } catch {
        // Keep the fallback content when the backend is unavailable.
      }
    };

    loadStats();
    loadHeroImage();
    loadNextEvent();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#1f4e79] text-white">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-[#f36f21] blur-3xl" />
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-[#6d5df6] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 py-16 md:py-24 lg:px-12 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90">
              <span className="h-2.5 w-2.5 rounded-full bg-[#6d5df6]"></span>
              <span>AI-Powered Event Management</span>
            </div>

            <h1 className="mb-6 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              Smart Events for
              <span className="block text-[#6d5df6]">Modern Education</span>
            </h1>

            <p className="mb-8 max-w-lg text-lg text-white/80 md:text-xl lg:mx-0">
              Streamline your educational events with intelligent scheduling,
              automated registrations, and AI-driven insights. Built for
              King&apos;s Own Institute.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <Link
                to="/browse-events"
                className="rounded-lg bg-[#f36f21] px-6 py-3 text-base font-semibold text-white transition duration-300 hover:scale-105 hover:bg-[#ff8a3d]"
              >
                Browse Events
              </Link>
              <button className="rounded-lg border border-white bg-transparent px-6 py-3 text-base font-semibold text-white transition duration-300 hover:bg-white/20">
                Create Event
              </button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/20 pt-8">
              <div className="text-center lg:text-left">
                <p className="text-3xl font-bold md:text-4xl">
                  {stats.eventsHosted.toLocaleString()}+
                </p>
                <p className="text-sm text-white/60">Events Hosted</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-3xl font-bold md:text-4xl">
                  {stats.participants.toLocaleString()}+
                </p>
                <p className="text-sm text-white/60">Participants</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-3xl font-bold md:text-4xl">
                  {stats.institutions}+
                </p>
                <p className="text-sm text-white/60">Institutions</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="group relative overflow-hidden rounded-2xl shadow-2xl">
              <img
                src={heroImage}
                alt={nextEvent.title}
                className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1e33]/50 to-transparent" />
              {isHeroImageLoading ? (
                <div className="absolute inset-x-4 top-4 rounded-lg bg-white/85 px-4 py-2 text-sm font-medium text-[#0f1e33] shadow-md">
                  Loading hero image...
                </div>
              ) : null}
              {!isHeroImageLoading && heroImageError ? (
                <div className="absolute inset-x-4 top-4 rounded-lg bg-[#f36f21]/90 px-4 py-2 text-sm font-medium text-white shadow-md">
                  {heroImageError}
                </div>
              ) : null}
            </div>

            <div className="absolute -bottom-6 -left-6 rounded-xl bg-white p-4 text-[#0f1e33] shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6d5df6]/10">
                  <span className="text-xl text-[#6d5df6]">AI</span>
                </div>
                <div>
                  <p className="text-xs text-[#6b7c93]">Next Event</p>
                  <p className="text-sm font-semibold">{nextEvent.title}</p>
                  <p className="text-xs text-[#f36f21]">{nextEvent.date}</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 -top-4 rounded-full bg-[#f36f21] px-4 py-2 text-white shadow-lg">
              <span className="text-sm font-semibold">Live Now</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
