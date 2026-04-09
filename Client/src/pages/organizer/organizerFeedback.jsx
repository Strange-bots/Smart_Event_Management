import { useMemo, useState } from "react";
import {
  Calendar,
  MessageSquare,
  Search,
  Star,
  TrendingUp,
  User,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "../../components/dashboard/dashboard.jsx";

const EVENT_STORAGE_KEY = "smart_event_organizer_events";
const FEEDBACK_STORAGE_KEY = "smart_event_organizer_feedback";

const sampleEvents = [
  { id: "event-sample-1", title: "AI Career Workshop", organizerEmail: "organizer@demo.com" },
  { id: "event-sample-2", title: "Campus Networking Evening", organizerEmail: "organizer@demo.com" },
];

const sampleFeedback = [
  {
    id: "feedback-1",
    eventTitle: "AI Career Workshop",
    userName: "Sophia Chen",
    comment: "Very practical and easy to follow. The examples made AI career paths feel much clearer.",
    rating: 5,
    dateSubmitted: "6 April 2026",
    isAnonymous: false,
    organizerEmail: "organizer@demo.com",
  },
  {
    id: "feedback-2",
    eventTitle: "Campus Networking Evening",
    userName: "Anonymous",
    comment: "Nice atmosphere and good mix of students and professionals. More time for Q&A would help.",
    rating: 4,
    dateSubmitted: "5 April 2026",
    isAnonymous: true,
    organizerEmail: "organizer@demo.com",
  },
  {
    id: "feedback-3",
    eventTitle: "AI Career Workshop",
    userName: "Liam Patel",
    comment: "Loved the workshop structure. Would be even better with a short resource list afterward.",
    rating: 4,
    dateSubmitted: "4 April 2026",
    isAnonymous: false,
    organizerEmail: "organizer@demo.com",
  },
];

const cn = (...classes) => classes.filter(Boolean).join(" ");

function renderStars(rating) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={14}
          className={cn(
            index < rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-slate-300",
          )}
        />
      ))}
    </div>
  );
}

function OrganizerFeedback() {
  const storedUser = window.localStorage.getItem("smart_event_user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const [searchQuery, setSearchQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("All Events");

  const events = useMemo(() => {
    const storedEvents = JSON.parse(
      window.localStorage.getItem(EVENT_STORAGE_KEY) || "[]",
    );
    const combinedEvents = storedEvents.length > 0 ? storedEvents : sampleEvents;

    return combinedEvents.filter(
      (event) =>
        !currentUser ||
        event.organizerEmail === currentUser.email ||
        event.organizerId === currentUser.id,
    );
  }, [currentUser]);

  const allFeedback = useMemo(() => {
    const storedFeedback = JSON.parse(
      window.localStorage.getItem(FEEDBACK_STORAGE_KEY) || "[]",
    );
    const combinedFeedback =
      storedFeedback.length > 0 ? storedFeedback : sampleFeedback;

    return combinedFeedback.filter(
      (item) =>
        !currentUser ||
        item.organizerEmail === currentUser.email ||
        item.organizerId === currentUser.id,
    );
  }, [currentUser]);

  const eventOptions = useMemo(
    () => ["All Events", ...events.map((event) => event.title)],
    [events],
  );

  const filteredFeedback = useMemo(
    () =>
      allFeedback.filter((item) => {
        const haystack = `${item.comment} ${item.userName} ${item.eventTitle}`.toLowerCase();
        const matchesSearch = haystack.includes(searchQuery.toLowerCase());
        const matchesEvent =
          eventFilter === "All Events" || item.eventTitle === eventFilter;
        return matchesSearch && matchesEvent;
      }),
    [allFeedback, searchQuery, eventFilter],
  );

  if (!currentUser || currentUser.role !== "organizer") {
    return <Navigate to="/login" replace />;
  }

  const averageRating = allFeedback.length
    ? (
        allFeedback.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
        allFeedback.length
      ).toFixed(1)
    : "0.0";

  const positiveReviews = allFeedback.filter((item) => item.rating >= 4).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-[#0f1e33]">Event Feedback</h1>
          <p className="mt-2 text-[#6b7c93]">
            View and analyze feedback from your event attendees.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100">
                <Star size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f1e33]">{averageRating}</p>
                <p className="text-sm text-[#6b7c93]">Average Rating</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf4ff]">
                <MessageSquare size={24} className="text-[#1f4e79]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f1e33]">{allFeedback.length}</p>
                <p className="text-sm text-[#6b7c93]">Total Reviews</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
                <TrendingUp size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f1e33]">{positiveReviews}</p>
                <p className="text-sm text-[#6b7c93]">Positive Reviews</p>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7c93]"
              />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search feedback..."
                className="w-full rounded-xl border border-[#d9e2ec] py-3 pl-10 pr-4 outline-none transition focus:border-[#1f4e79]"
              />
            </div>
            <select
              value={eventFilter}
              onChange={(event) => setEventFilter(event.target.value)}
              className="w-full rounded-xl border border-[#d9e2ec] px-4 py-3 outline-none transition focus:border-[#1f4e79] sm:w-[220px]"
            >
              {eventOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </section>

        {filteredFeedback.length > 0 ? (
          <div className="space-y-4">
            {filteredFeedback.map((item) => (
              <section key={item.id} className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f5f7fa]">
                    {item.isAnonymous ? (
                      <User size={20} className="text-[#6b7c93]" />
                    ) : (
                      <span className="text-sm font-semibold text-[#1f4e79]">
                        {item.userName
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-[#0f1e33]">
                          {item.isAnonymous ? "Anonymous" : item.userName}
                        </p>
                        <span className="mt-1 inline-flex rounded-full bg-[#f5f7fa] px-3 py-1 text-xs font-medium text-[#1f4e79]">
                          {item.eventTitle}
                        </span>
                      </div>
                      <div className="text-left sm:text-right">
                        {renderStars(item.rating)}
                        <p className="mt-1 flex items-center gap-1 text-xs text-[#6b7c93] sm:justify-end">
                          <Calendar size={12} />
                          {item.dateSubmitted}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-[#6b7c93]">{item.comment}</p>
                  </div>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <MessageSquare size={48} className="mx-auto text-[#9aa9bc]" />
            <h3 className="mt-4 text-xl font-semibold text-[#0f1e33]">
              No feedback yet
            </h3>
            <p className="mt-2 text-[#6b7c93]">
              Feedback from your event attendees will appear here.
            </p>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

export default OrganizerFeedback;
