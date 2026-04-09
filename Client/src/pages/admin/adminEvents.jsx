import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "../../components/dashboard/dashboard.jsx";

const initialEvents = [
  {
    id: 1,
    title: "AI Innovation Summit",
    description: "A full-day summit covering AI, automation, and campus innovation.",
    organizer: "KOI Tech Club",
    date: "2026-04-12",
    time: "10:00 AM",
    venue: "Sydney Campus Auditorium",
    registrations: 145,
    capacity: 200,
    status: "pending",
    image:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=80",
    price: 0,
    isPaid: false,
    tags: ["AI", "Technology", "Innovation"],
    category: "Technology",
  },
  {
    id: 2,
    title: "Career Networking Night",
    description: "Students connect with employers and alumni across industries.",
    organizer: "Career Services",
    date: "2026-04-18",
    time: "6:30 PM",
    venue: "Main Hall",
    registrations: 220,
    capacity: 250,
    status: "approved",
    image:
      "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=1200&q=80",
    price: 15,
    isPaid: true,
    tags: ["Career", "Networking"],
    category: "Professional Development",
  },
  {
    id: 3,
    title: "International Culture Festival",
    description: "A student-led showcase of food, music, and performances.",
    organizer: "Student Union",
    date: "2026-05-03",
    time: "2:00 PM",
    venue: "Campus Courtyard",
    registrations: 310,
    capacity: 400,
    status: "rejected",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80",
    price: 0,
    isPaid: false,
    tags: ["Culture", "Community"],
    category: "Cultural",
  },
  {
    id: 4,
    title: "Entrepreneurship Workshop",
    description: "Hands-on startup planning session for aspiring founders.",
    organizer: "Business Society",
    date: "2026-05-10",
    time: "11:00 AM",
    venue: "Innovation Lab",
    registrations: 88,
    capacity: 120,
    status: "pending",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80",
    price: 10,
    isPaid: true,
    tags: ["Business", "Startup"],
    category: "Workshop",
  },
];

const recommendationMap = {
  pending: { label: "Recommend Approve", confidence: 92, tone: "green" },
  approved: { label: "Already Approved", confidence: 100, tone: "blue" },
  rejected: { label: "Needs Review", confidence: 67, tone: "red" },
};

const badgeStyles = {
  approved: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-700",
};

function AdminEvents() {
  const storedUser = window.localStorage.getItem("smart_event_user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [events, setEvents] = useState(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.organizer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || event.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [events, searchQuery, statusFilter]);

  const pendingEvents = events.filter((event) => event.status === "pending");

  if (!currentUser || currentUser.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  const updateStatus = (eventId, status) => {
    setEvents((current) =>
      current.map((event) =>
        event.id === eventId ? { ...event, status } : event
      )
    );
    if (selectedEvent?.id === eventId) {
      setSelectedEvent((current) => (current ? { ...current, status } : current));
    }
  };

  const deleteEvent = () => {
    if (!eventToDelete) {
      return;
    }
    setEvents((current) => current.filter((event) => event.id !== eventToDelete));
    if (selectedEvent?.id === eventToDelete) {
      setSelectedEvent(null);
    }
    setEventToDelete(null);
  };

  const approveAllPending = () => {
    setEvents((current) =>
      current.map((event) =>
        event.status === "pending" ? { ...event, status: "approved" } : event
      )
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1e33] md:text-3xl">
            Events Management
          </h1>
          <p className="mt-1 text-[#6b7c93]">
            Review, approve, and manage all events
          </p>
        </div>

        {pendingEvents.length > 0 ? (
          <section className="rounded-2xl border border-[#ddd6fe] bg-gradient-to-r from-[#6d5df6]/5 to-[#6d5df6]/10 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#6d5df6]">
              <span>✦</span>
              <span>AI-Powered Recommendations</span>
              <span className="rounded-full border border-[#6d5df6]/30 px-2 py-0.5 text-xs">
                {pendingEvents.length} Pending
              </span>
            </div>
            <p className="mb-4 text-sm text-[#6b7c93]">
              The system has analyzed pending events based on organizer history,
              capacity, and event timing.
            </p>

            <div className="space-y-3">
              {pendingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col justify-between gap-3 rounded-lg border border-[#e5e7eb] bg-white p-4 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-[#0f1e33]">
                        {event.title}
                      </span>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        {recommendationMap.pending.label} (
                        {recommendationMap.pending.confidence}%)
                      </span>
                    </div>
                    <p className="text-sm text-[#6b7c93]">
                      by {event.organizer} • {event.date}
                    </p>
                    <p className="text-xs text-[#6b7c93]">
                      Strong organizer track record, reasonable capacity (
                      {event.capacity}), and appropriate scheduling.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateStatus(event.id, "approved")}
                      className="rounded-lg border border-green-200 px-3 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(event.id, "rejected")}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {pendingEvents.length > 1 ? (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={approveAllPending}
                  className="rounded-lg bg-[#f36f21] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ff8a3d]"
                >
                  Approve All Recommended
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1f4e79]/10 text-[#1f4e79]">
                📅
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f1e33]">
                  {events.length}
                </p>
                <p className="text-sm text-[#6b7c93]">Total Events</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
                ✓
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f1e33]">
                  {events.filter((event) => event.status === "approved").length}
                </p>
                <p className="text-sm text-[#6b7c93]">Approved</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
                ⏳
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f1e33]">
                  {events.filter((event) => event.status === "pending").length}
                </p>
                <p className="text-sm text-[#6b7c93]">Pending</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f36f21]/10 text-[#f36f21]">
                👥
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f1e33]">
                  {events.reduce((sum, event) => sum + event.registrations, 0)}
                </p>
                <p className="text-sm text-[#6b7c93]">Total Registrations</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7c93]">
                🔎
              </span>
              <input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-lg border border-[#d9e2ec] py-2 pl-10 pr-4 outline-none focus:border-[#1f4e79]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {["all", "approved", "pending", "rejected"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    statusFilter === status
                      ? "bg-[#1f4e79] text-white"
                      : "border border-[#d9e2ec] bg-white text-[#0f1e33] hover:bg-[#f5f7fa]"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-[#e5e7eb] bg-[#f8fafc]">
                <tr className="text-left text-sm text-[#6b7c93]">
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Organizer</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Venue</th>
                  <th className="px-4 py-3">Registrations</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">AI Insight</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="border-b border-[#f1f5f9]">
                    <td className="px-4 py-3 font-medium text-[#0f1e33]">
                      {event.title}
                    </td>
                    <td className="px-4 py-3 text-[#0f1e33]">
                      {event.organizer}
                    </td>
                    <td className="px-4 py-3 text-[#0f1e33]">{event.date}</td>
                    <td className="px-4 py-3 text-[#0f1e33]">{event.venue}</td>
                    <td className="px-4 py-3 text-[#0f1e33]">
                      <span className="font-medium">{event.registrations}</span>
                      <span className="text-[#6b7c93]">/{event.capacity}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${badgeStyles[event.status]}`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {event.status === "pending" ? (
                        <span className="text-xs font-medium text-[#6d5df6]">
                          {recommendationMap.pending.confidence}% approve
                        </span>
                      ) : (
                        <span className="text-xs text-[#94a3b8]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {event.status === "pending" ? (
                          <>
                            <button
                              onClick={() => updateStatus(event.id, "approved")}
                              className="rounded-md px-2 py-1 text-sm text-green-700 hover:bg-green-50"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => updateStatus(event.id, "rejected")}
                              className="rounded-md px-2 py-1 text-sm text-red-700 hover:bg-red-50"
                            >
                              ✕
                            </button>
                          </>
                        ) : null}
                        <button
                          onClick={() => setSelectedEvent(event)}
                          className="rounded-md px-2 py-1 text-sm text-[#1f4e79] hover:bg-[#f5f7fa]"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setEventToDelete(event.id)}
                          className="rounded-md px-2 py-1 text-sm text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {selectedEvent ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-[#0f1e33]">
                {selectedEvent.title}
              </h2>
              <p className="text-sm text-[#6b7c93]">
                Review event details before approval
              </p>
            </div>

            {selectedEvent.image ? (
              <div className="mb-6 aspect-video overflow-hidden rounded-lg">
                <img
                  src={selectedEvent.image}
                  alt={selectedEvent.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${badgeStyles[selectedEvent.status]}`}
              >
                {selectedEvent.status}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                {selectedEvent.category}
              </span>
              <span className="rounded-full bg-[#1f4e79]/10 px-2 py-1 text-xs font-medium text-[#1f4e79]">
                {selectedEvent.isPaid ? `$${selectedEvent.price}` : "Free"}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-1 text-sm font-medium text-[#6b7c93]">
                  Description
                </p>
                <p className="text-[#0f1e33]">{selectedEvent.description}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-[#6b7c93]">Organizer</p>
                  <p className="font-medium text-[#0f1e33]">
                    {selectedEvent.organizer}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#6b7c93]">Date</p>
                  <p className="font-medium text-[#0f1e33]">
                    {selectedEvent.date}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#6b7c93]">Time</p>
                  <p className="font-medium text-[#0f1e33]">
                    {selectedEvent.time}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#6b7c93]">Venue</p>
                  <p className="font-medium text-[#0f1e33]">
                    {selectedEvent.venue}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#6b7c93]">Capacity</p>
                  <p className="font-medium text-[#0f1e33]">
                    {selectedEvent.registrations} / {selectedEvent.capacity}{" "}
                    registered
                  </p>
                </div>
              </div>

              {selectedEvent.tags.length ? (
                <div>
                  <p className="mb-2 text-sm font-medium text-[#6b7c93]">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#f36f21]/10 px-2 py-1 text-xs font-medium text-[#f36f21]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-[#e5e7eb] pt-4">
              {selectedEvent.status === "pending" ? (
                <>
                  <button
                    onClick={() => {
                      updateStatus(selectedEvent.id, "approved");
                      setSelectedEvent(null);
                    }}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Approve Event
                  </button>
                  <button
                    onClick={() => {
                      updateStatus(selectedEvent.id, "rejected");
                      setSelectedEvent(null);
                    }}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Reject Event
                  </button>
                </>
              ) : null}
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-lg border border-[#d9e2ec] px-4 py-2 text-sm font-semibold text-[#0f1e33] hover:bg-[#f8fafc]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {eventToDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEventToDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-[#0f1e33]">Delete Event</h2>
            <p className="mt-2 text-sm text-[#6b7c93]">
              Are you sure you want to delete this event? This action cannot be
              undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setEventToDelete(null)} 
                className="rounded-lg border border-[#d9e2ec] px-4 py-2 text-sm font-semibold text-[#0f1e33] hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                onClick={deleteEvent}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}

export default AdminEvents;
