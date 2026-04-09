import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/dashboard/dashboard";

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

const sampleEvents = [
  {
    id: "1",
    title: "Annual Technology Summit 2024",
    category: "Technology",
    date: "March 15, 2024",
    time: "9:00 AM - 5:00 PM",
    venue: "Main Auditorium",
    description: "A full-day summit bringing together industry leaders, innovators, and students to explore the latest trends in technology.",
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&q=80",
    registrations: 120,
    capacity: 150,
    status: "approved",
    isPaid: false,
    price: 0,
    tags: ["AI", "Cloud", "Innovation"],
  },
  {
    id: "2",
    title: "Business Analytics Workshop",
    category: "Workshop",
    date: "March 20, 2024",
    time: "10:00 AM - 2:00 PM",
    venue: "Room 301",
    description: "Hands-on workshop covering data analysis, dashboards, and business intelligence tools for modern professionals.",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80",
    registrations: 40,
    capacity: 50,
    status: "approved",
    isPaid: true,
    price: 25,
    tags: ["Analytics", "Data", "Business"],
  },
  {
    id: "3",
    title: "AI & Machine Learning Seminar",
    category: "Technology",
    date: "March 25, 2024",
    time: "1:00 PM - 4:00 PM",
    venue: "Lecture Hall B",
    description: "An in-depth seminar on the fundamentals and applications of AI and machine learning in real-world scenarios.",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80",
    registrations: 80,
    capacity: 100,
    status: "approved",
    isPaid: false,
    price: 0,
    tags: ["AI", "Machine Learning", "Deep Learning"],
  },
  {
    id: "4",
    title: "Career Fair 2024",
    category: "Career",
    date: "March 28, 2024",
    time: "10:00 AM - 3:00 PM",
    venue: "Student Centre",
    description: "Connect with top employers and explore career opportunities across various industries.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
    registrations: 200,
    capacity: 300,
    status: "approved",
    isPaid: false,
    price: 0,
    tags: ["Career", "Networking", "Jobs"],
  },
  {
    id: "5",
    title: "Cloud Computing Fundamentals",
    category: "Technology",
    date: "April 2, 2024",
    time: "9:00 AM - 12:00 PM",
    venue: "IT Lab 2",
    description: "A beginner-friendly course covering cloud platforms, deployment, and scalable architecture.",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80",
    registrations: 30,
    capacity: 40,
    status: "approved",
    isPaid: true,
    price: 15,
    tags: ["Cloud", "AWS", "DevOps"],
  },
  {
    id: "6",
    title: "Professional Networking Night",
    category: "Networking",
    date: "April 5, 2024",
    time: "6:00 PM - 9:00 PM",
    venue: "Rooftop Lounge",
    description: "An evening event to expand your professional network, meet peers, and engage with industry mentors.",
    image: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&q=80",
    registrations: 60,
    capacity: 80,
    status: "approved",
    isPaid: false,
    price: 0,
    tags: ["Networking", "Professional", "Social"],
  },
];

// Stable AI match scores per event id
const aiScores = { "1": 92, "2": 85, "3": 95, "4": 78, "5": 82, "6": 88 };

const BrowseEvents = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [viewMode, setViewMode] = useState("grid");
  const [showAiRecommended, setShowAiRecommended] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const eventsWithScores = sampleEvents.map((event) => ({
    ...event,
    aiMatch: aiScores[event.id] ?? 75,
  }));

  const filteredEvents = eventsWithScores
    .filter((event) => {
      const matchesSearch = event.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "All Categories" ||
        event.category.toLowerCase() === categoryFilter.toLowerCase();
      const matchesAi = !showAiRecommended || event.aiMatch >= 80;
      return matchesSearch && matchesCategory && matchesAi;
    })
    .sort((a, b) => (showAiRecommended ? b.aiMatch - a.aiMatch : 0));

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  const handleRegister = (event) => {
    if (event.isPaid && event.price > 0) {
      navigate(`/paymentPage?eventId=${event.id}`);
    } else {
      alert(`Successfully registered for "${event.title}"!`);
      setShowDetailsModal(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1f4e79]">
              Browse Events
            </h1>
            <p className="text-gray-500 mt-1">
              Discover and register for upcoming events
            </p>
          </div>
          <button
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border",
              showAiRecommended
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            )}
            onClick={() => setShowAiRecommended(!showAiRecommended)}
          >
            ✨ AI Recommended
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f4e79]/30 text-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none pl-8 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]/30 bg-white text-gray-700"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  ▼
                </span>
              </div>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "px-3 py-2 text-sm transition-colors",
                    viewMode === "grid"
                      ? "bg-[#1f4e79] text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  )}
                >
                  ⊞
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "px-3 py-2 text-sm transition-colors",
                    viewMode === "list"
                      ? "bg-[#1f4e79] text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  )}
                >
                  ☰
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-500">
          Showing {filteredEvents.length} events
          {showAiRecommended && " (AI recommended)"}
        </p>

        {/* Events Grid */}
        {viewMode === "grid" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {event.aiMatch >= 80 && (
                    <span className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                      ✨ {event.aiMatch}% match
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full mb-2 inline-block">
                    {event.category}
                  </span>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {event.title}
                  </h3>
                  <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[#f36f21]">📅</span>
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#f36f21]">🕐</span>
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#f36f21]">📍</span>
                      <span>{event.venue}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">
                      👥{" "}
                      <span className="font-medium text-gray-800">
                        {event.registrations}
                      </span>{" "}
                      / {event.capacity}
                    </span>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
                      className="flex-1 border border-gray-300 text-gray-700 text-sm py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => handleViewDetails(event)}
                    >
                      👁 View
                    </button>
                    <button
                      className="flex-1 bg-[#f36f21] text-white text-sm py-1.5 rounded-lg hover:bg-[#e05e10] transition-colors"
                      onClick={() => handleRegister(event)}
                    >
                      {event.isPaid ? `$${event.price}` : "Free"} — Register
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Events List */
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex">
                  <div className="relative w-48 hidden md:block shrink-0">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    {event.aiMatch >= 80 && (
                      <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                        ✨ {event.aiMatch}%
                      </span>
                    )}
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                            {event.category}
                          </span>
                          {event.aiMatch >= 80 && (
                            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full md:hidden">
                              ✨ {event.aiMatch}% match
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg mb-2">
                          {event.title}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                          <span>📅 {event.date}</span>
                          <span>🕐 {event.time}</span>
                          <span>📍 {event.venue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            👥{" "}
                            <span className="font-medium text-gray-800">
                              {event.registrations}
                            </span>{" "}
                            / {event.capacity} registered
                          </span>
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          className="border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                          onClick={() => handleViewDetails(event)}
                        >
                          👁 Details
                        </button>
                        <button
                          className="bg-[#f36f21] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#e05e10] transition-colors"
                          onClick={() => handleRegister(event)}
                        >
                          {event.isPaid ? `$${event.price}` : "Free"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredEvents.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-4 opacity-40">📅</div>
            <h3 className="font-semibold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {showDetailsModal && selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Event Details</h2>
                <p className="text-sm text-gray-500">View complete event information</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Event Image */}
              <div className="aspect-video rounded-lg overflow-hidden">
                <img
                  src={selectedEvent.image}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title and Category */}
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedEvent.title}
                </h2>
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {selectedEvent.category}
                </span>
                {selectedEvent.isPaid ? (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                    ${selectedEvent.price}
                  </span>
                ) : (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                    Free
                  </span>
                )}
              </div>

              {/* Description */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  About this event
                </p>
                <p className="text-gray-800 leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>

              {/* Event Details Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-lg">
                    📅
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="font-medium text-gray-900 text-sm">
                      {selectedEvent.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-lg">
                    🕐
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="font-medium text-gray-900 text-sm">
                      {selectedEvent.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-lg">
                    📍
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-medium text-gray-900 text-sm">
                      {selectedEvent.venue}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-lg">
                    👥
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Availability</p>
                    <p className="font-medium text-gray-900 text-sm">
                      {selectedEvent.capacity - selectedEvent.registrations} spots
                      left
                    </p>
                  </div>
                </div>
              </div>

              {/* Capacity Bar */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">Registration Progress</span>
                  <span className="font-medium text-gray-800">
                    {selectedEvent.registrations} / {selectedEvent.capacity}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#f36f21] transition-all"
                    style={{
                      width: `${(selectedEvent.registrations / selectedEvent.capacity) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Tags */}
              {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-orange-50 text-[#f36f21] text-xs px-2 py-1 rounded-full"
                      >
                        🏷 {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Register Button */}
              <button
                className="w-full bg-[#f36f21] text-white font-semibold py-3 rounded-xl hover:bg-[#e05e10] transition-colors"
                onClick={() => handleRegister(selectedEvent)}
              >
                {selectedEvent.isPaid
                  ? `Register Now — $${selectedEvent.price}`
                  : "Register Now — Free"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default BrowseEvents;
