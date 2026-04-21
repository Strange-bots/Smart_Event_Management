import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/navbar";
import Footer from "../components/layout/footer";
import FeaturedEventsSection from "../components/common/utility/featuresEvents";
import { fetchEvents } from "../services/eventService.js";

const categoryFilters = [
  { id: "all", label: "All Events", queryValue: "" },
  { id: "academic", label: "Academic", queryValue: "Academic" },
  { id: "sports", label: "Sports", queryValue: "Sports" },
  { id: "cultural", label: "Cultural", queryValue: "Cultural" },
  { id: "tech", label: "Technology", queryValue: "Technology" },
  { id: "career", label: "Career", queryValue: "Career" },
  { id: "workshop", label: "Workshop", queryValue: "Workshop" },
  { id: "networking", label: "Networking", queryValue: "Networking" },
];

const formatEventDate = (dateString) => {
  if (!dateString) return "Date to be announced";
  const parsedDate = new Date(dateString);
  if (Number.isNaN(parsedDate.getTime())) return dateString;
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

const PublicBrowseEvents = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [allEvents, setAllEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const activeCategory = categoryFilters.find(
      (category) => category.id === categoryFilter
    )?.queryValue;

    setIsLoading(true);

    const timerId = window.setTimeout(async () => {
      try {
        const events = await fetchEvents({
          category: activeCategory,
          search: searchQuery,
        });

        if (!isMounted) return;

        setAllEvents(
          events.map((event) => ({
            ...event,
            date: formatEventDate(event.date),
            categoryLabel: event.category,
          }))
        );
        setErrorMessage("");
      } catch {
        if (!isMounted) return;
        setAllEvents([]);
        setErrorMessage("Unable to load events right now. Please try again.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }, 300);

    return () => {
      isMounted = false;
      window.clearTimeout(timerId);
    };
  }, [categoryFilter, searchQuery]);

  const handleCategoryChange = (category) => {
    setCategoryFilter(category);
  };

  const handleRegister = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F7FA" }}>
      <Navbar />

      <section className="pt-24 pb-12" style={{ backgroundColor: "#1F4E79" }}>
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
              style={{ color: "#FFFFFF" }}
            >
              Discover Amazing Events
            </h1>
            <p
              className="text-lg mb-8"
              style={{ color: "rgba(255,255,255,0.80)" }}
            >
              Explore upcoming events at King's Own Institute. Find workshops,
              seminars, sports, and cultural events that match your interests.
            </p>

            <div className="relative max-w-xl mx-auto">
              <input
                type="text"
                placeholder="Search events by name or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-5 pr-4 py-4 text-base border-0 shadow-lg rounded-md outline-none"
                style={{ backgroundColor: "#FFFFFF", color: "#0F1E33" }}
              />
            </div>
          </div>
        </div>
      </section>

      <section
        className="border-b sticky top-0 z-40"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 py-4 overflow-x-auto">
            {categoryFilters.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className="shrink-0 inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium border transition-colors"
                style={
                  categoryFilter === cat.id
                    ? {
                        backgroundColor: "#F36F21",
                        color: "#FFFFFF",
                        borderColor: "#F36F21",
                      }
                    : {
                        backgroundColor: "transparent",
                        color: "#0F1E33",
                        borderColor: "#6B7C93",
                      }
                }
                onMouseEnter={(e) => {
                  if (categoryFilter !== cat.id) {
                    e.currentTarget.style.backgroundColor = "#F5F7FA";
                  }
                }}
                onMouseLeave={(e) => {
                  if (categoryFilter !== cat.id) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                {cat.label}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2 shrink-0">
              <div
                className="flex border rounded-lg overflow-hidden"
                style={{ borderColor: "#6B7C93" }}
              >
                <button
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 inline-flex items-center justify-center text-sm font-medium transition-colors"
                  style={
                    viewMode === "grid"
                      ? { backgroundColor: "#F36F21", color: "#FFFFFF" }
                      : { backgroundColor: "#FFFFFF", color: "#0F1E33" }
                  }
                >
                  Ã¢Å Å¾
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 inline-flex items-center justify-center text-sm font-medium transition-colors"
                  style={
                    viewMode === "list"
                      ? { backgroundColor: "#F36F21", color: "#FFFFFF" }
                      : { backgroundColor: "#FFFFFF", color: "#0F1E33" }
                  }
                >
                  Ã¢ËœÂ°
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FeaturedEventsSection />

      <section className="py-12" style={{ backgroundColor: "#F5F7FA" }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <p style={{ color: "#6B7C93" }}>
              {isLoading ? (
                "Loading events..."
              ) : (
                <>
                  Showing{" "}
                  <span className="font-semibold" style={{ color: "#0F1E33" }}>
                    {allEvents.length}
                  </span>{" "}
                  events
                </>
              )}
              {categoryFilter !== "all" && (
                <span>
                  {" "}in{" "}
                  <span className="font-medium" style={{ color: "#1F4E79" }}>
                    {categoryFilters.find((c) => c.id === categoryFilter)?.label}
                  </span>
                </span>
              )}
            </p>
          </div>

          {!isLoading && errorMessage ? (
            <div
              className="mb-6 rounded-lg border px-4 py-3 text-sm"
              style={{
                backgroundColor: "#FFF7ED",
                borderColor: "#F36F21",
                color: "#9A3412",
              }}
            >
              {errorMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="shadow-sm rounded-lg" style={{ backgroundColor: "#FFFFFF" }}>
              <div className="p-12 text-center">
                <h3 className="font-semibold text-xl mb-2" style={{ color: "#0F1E33" }}>
                  Loading events...
                </h3>
                <p style={{ color: "#6B7C93" }}>Fetching the latest results from the server.</p>
              </div>
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allEvents.map((event) => (
                    <div
                      key={event.id}
                      className="shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group h-full flex flex-col rounded-lg"
                      style={{ backgroundColor: "#FFFFFF" }}
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <span
                          className="absolute top-3 left-3 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.90)",
                            color: "#0F1E33",
                            borderColor: "#6B7C93",
                          }}
                        >
                          {event.categoryLabel}
                        </span>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h3
                          className="font-semibold text-lg mb-2 line-clamp-2 transition-colors group-hover:opacity-80"
                          style={{ color: "#0F1E33" }}
                        >
                          {event.title}
                        </h3>
                        <p className="text-sm mb-4 line-clamp-2" style={{ color: "#6B7C93" }}>
                          {event.description}
                        </p>
                        <div className="space-y-2 text-sm mb-4" style={{ color: "#6B7C93" }}>
                          <div className="flex items-center gap-2">
                            <span style={{ color: "#F36F21" }}>Ã°Å¸â€œâ€¦</span>
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span style={{ color: "#F36F21" }}>Ã°Å¸â€¢Â</span>
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span style={{ color: "#F36F21" }}>Ã°Å¸â€œÂ</span>
                            <span>{event.location}</span>
                          </div>
                        </div>
                        <div className="mt-auto">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5 text-sm" style={{ color: "#6B7C93" }}>
                              <span>Ã°Å¸â€˜Â¥</span>
                              <span className="font-medium" style={{ color: "#0F1E33" }}>
                                {event.registrations}
                              </span>
                              <span>/ {event.capacity}</span>
                            </div>
                            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#F5F7FA" }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${(event.registrations / event.capacity) * 100}%`,
                                  backgroundColor:
                                    event.registrations / event.capacity > 0.9 ? "#ef4444" : "#F36F21",
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-md border text-sm font-medium transition-colors"
                              style={{
                                borderColor: "#1F4E79",
                                color: "#1F4E79",
                                backgroundColor: "transparent",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F5F7FA")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                              onClick={() => setSelectedEvent(event)}
                            >
                              View Details
                            </button>
                            <button
                              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors"
                              style={{ backgroundColor: "#F36F21", color: "#FFFFFF" }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FF8A3D")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#F36F21")}
                              onClick={handleRegister}
                            >
                              Register
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {allEvents.map((event) => (
                    <div
                      key={event.id}
                      className="shadow-sm overflow-hidden hover:shadow-md transition-shadow rounded-lg"
                      style={{ backgroundColor: "#FFFFFF" }}
                    >
                      <div className="flex flex-col md:flex-row">
                        <div className="relative w-full md:w-64 aspect-video md:aspect-auto shrink-0">
                          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                          <span
                            className="absolute top-3 left-3 md:hidden inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                            style={{
                              backgroundColor: "rgba(255,255,255,0.90)",
                              color: "#0F1E33",
                              borderColor: "#6B7C93",
                            }}
                          >
                            {event.categoryLabel}
                          </span>
                        </div>
                        <div className="flex-1 p-5">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="flex-1">
                              <span
                                className="mb-2 hidden md:inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                                style={{
                                  backgroundColor: "#F5F7FA",
                                  color: "#0F1E33",
                                  borderColor: "#6B7C93",
                                }}
                              >
                                {event.categoryLabel}
                              </span>
                              <h3 className="font-semibold text-xl mb-2" style={{ color: "#0F1E33" }}>
                                {event.title}
                              </h3>
                              <p className="text-sm mb-4 line-clamp-2" style={{ color: "#6B7C93" }}>
                                {event.description}
                              </p>
                              <div className="flex flex-wrap gap-4 text-sm mb-4" style={{ color: "#6B7C93" }}>
                                <div className="flex items-center gap-2">
                                  <span style={{ color: "#F36F21" }}>Ã°Å¸â€œâ€¦</span>
                                  <span>{event.date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span style={{ color: "#F36F21" }}>Ã°Å¸â€¢Â</span>
                                  <span>{event.time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span style={{ color: "#F36F21" }}>Ã°Å¸â€œÂ</span>
                                  <span>{event.location}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span style={{ color: "#6B7C93" }}>Ã°Å¸â€˜Â¥</span>
                                <span className="text-sm">
                                  <span className="font-medium" style={{ color: "#0F1E33" }}>
                                    {event.registrations}
                                  </span>
                                  <span style={{ color: "#6B7C93" }}> / {event.capacity} registered</span>
                                </span>
                                <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#F5F7FA" }}>
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${(event.registrations / event.capacity) * 100}%`,
                                      backgroundColor:
                                        event.registrations / event.capacity > 0.9 ? "#ef4444" : "#F36F21",
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                className="inline-flex items-center justify-center px-4 py-2 rounded-md border text-sm font-medium transition-colors"
                                style={{
                                  borderColor: "#1F4E79",
                                  color: "#1F4E79",
                                  backgroundColor: "transparent",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F5F7FA")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                onClick={() => setSelectedEvent(event)}
                              >
                                View Details
                              </button>
                              <button
                                className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                style={{ backgroundColor: "#F36F21", color: "#FFFFFF" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FF8A3D")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#F36F21")}
                                onClick={handleRegister}
                              >
                                Register
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && allEvents.length === 0 && (
                <div className="shadow-sm rounded-lg" style={{ backgroundColor: "#FFFFFF" }}>
                  <div className="p-12 text-center">
                    <span className="block text-5xl mx-auto mb-4" style={{ color: "#6B7C93" }}>
                      Ã°Å¸â€œâ€¦
                    </span>
                    <h3 className="font-semibold text-xl mb-2" style={{ color: "#0F1E33" }}>
                      No events found
                    </h3>
                    <p className="mb-4" style={{ color: "#6B7C93" }}>
                      Try adjusting your search or filter criteria
                    </p>
                    <button
                      className="inline-flex items-center justify-center px-4 py-2 rounded-md border text-sm font-medium transition-colors"
                      style={{
                        borderColor: "#1F4E79",
                        color: "#1F4E79",
                        backgroundColor: "transparent",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F5F7FA")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      onClick={() => {
                        setSearchQuery("");
                        handleCategoryChange("all");
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: "#0F1E33" }}>
            Ready to Join?
          </h2>
          <p className="max-w-xl mx-auto mb-6" style={{ color: "#6B7C93" }}>
            Create an account to register for events, get personalized AI recommendations, and never miss an opportunity.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              className="inline-flex items-center justify-center px-6 py-3 rounded-md text-sm font-medium transition-colors"
              style={{ backgroundColor: "#F36F21", color: "#FFFFFF" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FF8A3D")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#F36F21")}
              onClick={() => navigate("/signup")}
            >
              Create Account
            </button>
            <button
              className="inline-flex items-center justify-center px-6 py-3 rounded-md border text-sm font-medium transition-colors"
              style={{
                borderColor: "#1F4E79",
                color: "#1F4E79",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F5F7FA")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              onClick={() => navigate("/login")}
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      <Footer />

      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg"
            style={{ backgroundColor: "#FFFFFF" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold" style={{ color: "#1F4E79" }}>
                  {selectedEvent.title}
                </h2>
                <button
                  className="text-2xl leading-none transition-colors"
                  style={{ color: "#6B7C93" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#0F1E33")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7C93")}
                  onClick={() => setSelectedEvent(null)}
                >
                  &times;
                </button>
              </div>

              <div className="relative aspect-video rounded-lg overflow-hidden">
                <img
                  src={selectedEvent.image}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
                <span
                  className="absolute top-3 left-3 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.90)",
                    color: "#0F1E33",
                    borderColor: "#6B7C93",
                  }}
                >
                  {selectedEvent.categoryLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "Ã°Å¸â€œâ€¦", label: "Date", value: selectedEvent.date },
                  { icon: "Ã°Å¸â€¢Â", label: "Time", value: selectedEvent.time },
                  { icon: "Ã°Å¸â€œÂ", label: "Location", value: selectedEvent.location },
                  { icon: "Ã°Å¸â€™Â²", label: "Price", value: "Check details after login" },
                ].map(({ icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: "#F5F7FA" }}
                  >
                    <span style={{ color: "#F36F21" }}>{icon}</span>
                    <div>
                      <p className="text-xs" style={{ color: "#6B7C93" }}>{label}</p>
                      <p className="font-medium" style={{ color: "#0F1E33" }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="font-semibold mb-2" style={{ color: "#0F1E33" }}>
                  About This Event
                </h4>
                <p style={{ color: "#6B7C93" }}>{selectedEvent.description}</p>
              </div>

              <div className="p-4 rounded-lg" style={{ backgroundColor: "#F5F7FA" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span style={{ color: "#F36F21" }}>Ã°Å¸â€˜Â¥</span>
                    <span className="font-medium" style={{ color: "#0F1E33" }}>
                      Registration Status
                    </span>
                  </div>
                  <span className="text-sm" style={{ color: "#6B7C93" }}>
                    {selectedEvent.registrations} / {selectedEvent.capacity} spots filled
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#E2E8F0" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(selectedEvent.registrations / selectedEvent.capacity) * 100}%`,
                      backgroundColor:
                        selectedEvent.registrations / selectedEvent.capacity > 0.9 ? "#ef4444" : "#F36F21",
                    }}
                  />
                </div>
              </div>

              <button
                className="w-full inline-flex items-center justify-center px-6 py-3 rounded-md text-sm font-medium transition-colors"
                style={{ backgroundColor: "#F36F21", color: "#FFFFFF" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FF8A3D")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#F36F21")}
                onClick={handleRegister}
              >
                Register for This Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicBrowseEvents;
