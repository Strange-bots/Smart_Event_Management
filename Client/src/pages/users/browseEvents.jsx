import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/dashboard/dashboard";
import { ViewModeToggle } from "../../components/ui/view-mode-toggle";
import { fetchEvents, registerForEvent } from "../../services/eventService.js";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const categories = [
  "All Categories",
  "Technology",
  "Workshop",
  "Professional Development",
  "Academic",
  "Networking",
  "Career",
];

// Stable AI match scores per event id
const aiScores = { "1": 92, "2": 85, "3": 95, "4": 78, "5": 82, "6": 88 };

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
    month: "long",
    year: "numeric",
  }).format(parsedDate);
};

const BrowseEvents = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [viewMode, setViewMode] = useState("grid");
  const [showAiRecommended, setShowAiRecommended] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [registeringEventId, setRegisteringEventId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadEvents = async () => {
      try {
        setIsLoading(true);
        const events = await fetchEvents();

        if (!isMounted) {
          return;
        }

        setAllEvents(
          events.map((event) => ({
            ...event,
            date: formatEventDate(event.date),
            venue: event.venue || event.location,
            isPaid: Boolean(event.isPaid),
            price: Number(event.price || 0),
            tags: event.tags ?? [],
            aiMatch:
              aiScores[String(event.id)] ?? (78 + (Number(event.id) % 18 || 0)),
          }))
        );
        setErrorMessage("");
      } catch {
        if (!isMounted) {
          return;
        }

        setAllEvents([]);
        setErrorMessage("Unable to load events right now. Please try again.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return allEvents
      .filter((event) => {
        const matchesSearch =
          !normalizedSearch ||
          [event.title, event.description, event.category, event.venue].some(
            (field) => field?.toLowerCase().includes(normalizedSearch)
          );
        const matchesCategory =
          categoryFilter === "All Categories" ||
          event.category.toLowerCase() === categoryFilter.toLowerCase();
        const matchesAi = !showAiRecommended || event.aiMatch >= 80;

        return matchesSearch && matchesCategory && matchesAi;
      })
      .sort((left, right) => (showAiRecommended ? right.aiMatch - left.aiMatch : 0));
  }, [allEvents, searchQuery, categoryFilter, showAiRecommended]);

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  const updateRegisteredEvent = (registeredEvent) => {
    setAllEvents((currentEvents) =>
      currentEvents.map((event) =>
        String(event.id) === String(registeredEvent.id)
          ? {
              ...event,
              registrations: Number(registeredEvent.registrations || event.registrations),
            }
          : event
      )
    );

    setSelectedEvent((currentEvent) =>
      currentEvent && String(currentEvent.id) === String(registeredEvent.id)
        ? {
            ...currentEvent,
            registrations: Number(registeredEvent.registrations || currentEvent.registrations),
          }
        : currentEvent
    );
  };

  const handleRegister = async (event) => {
    if (event.isPaid && event.price > 0) {
      navigate(`/payment?eventId=${event.id}`);
      return;
    }

    try {
      setRegisteringEventId(event.id);
      const result = await registerForEvent(event.id);
      updateRegisteredEvent(result.event);
      alert(result.message || `Successfully registered for "${event.title}"!`);
      setShowDetailsModal(false);
    } catch (error) {
      alert(error.message || "Unable to register for this event right now.");
    } finally {
      setRegisteringEventId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1f4e79]">
              Browse Events
            </h1>
            <p className="mt-1 text-gray-500">
              Discover and register for upcoming events
            </p>
          </div>
          <button
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2 font-medium transition-colors",
              showAiRecommended
                ? "border-purple-600 bg-purple-600 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            )}
            onClick={() => setShowAiRecommended(!showAiRecommended)}
          >
            AI Recommended
          </button>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                Search
              </span>
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-16 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]/30"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-8 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1f4e79]/30"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  v
                </span>
              </div>
              <ViewModeToggle value={viewMode} onValueChange={setViewMode} />
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          {isLoading ? "Loading events..." : `Showing ${filteredEvents.length} events`}
          {showAiRecommended && " (AI recommended)"}
        </p>

        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-white p-4 text-sm text-rose-700 shadow-sm">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <div className="mb-4 text-5xl opacity-40">Loading</div>
            <h3 className="mb-2 font-semibold text-gray-900">Loading events...</h3>
            <p className="text-gray-500">
              Fetching the latest event list from the server.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="group overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {event.aiMatch >= 80 && (
                    <span className="absolute right-2 top-2 rounded-full bg-purple-600 px-2 py-1 text-xs text-white">
                      {event.aiMatch}% match
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <span className="mb-2 inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                    {event.category}
                  </span>
                  <h3 className="mb-2 line-clamp-2 font-semibold text-gray-900">
                    {event.title}
                  </h3>
                  <div className="mb-4 space-y-1.5 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#f36f21]">Date</span>
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#f36f21]">Time</span>
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#f36f21]">Place</span>
                      <span>{event.venue}</span>
                    </div>
                  </div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Registered{" "}
                      <span className="font-medium text-gray-800">
                        {event.registrations}
                      </span>{" "}
                      / {event.capacity}
                    </span>
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          event.registrations / event.capacity > 0.9
                            ? "bg-red-500"
                            : "bg-[#f36f21]"
                        )}
                        style={{
                          width: `${(event.registrations / event.capacity) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 rounded-lg border border-gray-300 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                      onClick={() => handleViewDetails(event)}
                    >
                      View
                    </button>
                    <button
                      className="flex-1 rounded-lg bg-[#f36f21] py-1.5 text-sm text-white transition-colors hover:bg-[#e05e10] disabled:cursor-not-allowed disabled:bg-gray-300"
                      onClick={() => handleRegister(event)}
                      disabled={registeringEventId === event.id}
                    >
                      {registeringEventId === event.id
                        ? "Registering..."
                        : `${event.isPaid ? `$${event.price}` : "Free"} - Register`}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex">
                  <div className="relative hidden w-48 shrink-0 md:block">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="h-full w-full object-cover"
                    />
                    {event.aiMatch >= 80 && (
                      <span className="absolute left-2 top-2 rounded-full bg-purple-600 px-2 py-1 text-xs text-white">
                        {event.aiMatch}%
                      </span>
                    )}
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                            {event.category}
                          </span>
                          {event.aiMatch >= 80 && (
                            <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700 md:hidden">
                              {event.aiMatch}% match
                            </span>
                          )}
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-gray-900">
                          {event.title}
                        </h3>
                        <div className="mb-3 flex flex-wrap gap-4 text-sm text-gray-500">
                          <span>Date: {event.date}</span>
                          <span>Time: {event.time}</span>
                          <span>Place: {event.venue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            Registered{" "}
                            <span className="font-medium text-gray-800">
                              {event.registrations}
                            </span>{" "}
                            / {event.capacity} registered
                          </span>
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                event.registrations / event.capacity > 0.9
                                  ? "bg-red-500"
                                  : "bg-[#f36f21]"
                              )}
                              style={{
                                width: `${(event.registrations / event.capacity) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2">
                        <button
                          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                          onClick={() => handleViewDetails(event)}
                        >
                          Details
                        </button>
                        <button
                          className="rounded-lg bg-[#f36f21] px-4 py-2 text-sm text-white transition-colors hover:bg-[#e05e10] disabled:cursor-not-allowed disabled:bg-gray-300"
                          onClick={() => handleRegister(event)}
                          disabled={registeringEventId === event.id}
                        >
                          {registeringEventId === event.id
                            ? "Registering..."
                            : event.isPaid
                              ? `$${event.price}`
                              : "Free"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredEvents.length === 0 && (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <div className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-400">
              No results
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">No events found</h3>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {showDetailsModal && selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Event Details</h2>
                <p className="text-sm text-gray-500">
                  View complete event information
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
              >
                x
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div className="aspect-video overflow-hidden rounded-lg">
                <img
                  src={selectedEvent.image}
                  alt={selectedEvent.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedEvent.title}
                </h2>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                  {selectedEvent.category}
                </span>
                {selectedEvent.isPaid ? (
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                    ${selectedEvent.price}
                  </span>
                ) : (
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                    Free
                  </span>
                )}
              </div>

              <div>
                <p className="mb-1 text-sm font-medium text-gray-500">
                  About this event
                </p>
                <p className="leading-relaxed text-gray-800">
                  {selectedEvent.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-lg">
                    Date
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedEvent.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-lg">
                    Time
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedEvent.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-lg">
                    Place
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedEvent.venue}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-lg">
                    Seats
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Availability</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedEvent.capacity - selectedEvent.registrations} spots
                      left
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-gray-500">Registration Progress</span>
                  <span className="font-medium text-gray-800">
                    {selectedEvent.registrations} / {selectedEvent.capacity}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-[#f36f21] transition-all"
                    style={{
                      width: `${(selectedEvent.registrations / selectedEvent.capacity) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-500">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-orange-50 px-2 py-1 text-xs text-[#f36f21]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                className="w-full rounded-xl bg-[#f36f21] py-3 font-semibold text-white transition-colors hover:bg-[#e05e10] disabled:cursor-not-allowed disabled:bg-gray-300"
                onClick={() => handleRegister(selectedEvent)}
                disabled={registeringEventId === selectedEvent.id}
              >
                {registeringEventId === selectedEvent.id
                  ? "Registering..."
                  : selectedEvent.isPaid
                  ? `Register Now - $${selectedEvent.price}`
                  : "Register Now - Free"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default BrowseEvents;
