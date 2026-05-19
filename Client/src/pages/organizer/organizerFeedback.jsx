import { useEffect, useMemo, useState } from "react";
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
import { fetchOrganizerFeedback } from "../../services/feedbackService.js";
import { getCurrentUser } from "../../utils/auth.js";

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
  const currentUser = useMemo(() => getCurrentUser(), []);
  const currentUserRole = currentUser?.role ?? null;
  const currentUserToken = currentUser?.token ?? null;
  const [searchQuery, setSearchQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("All Events");
  const [allFeedback, setAllFeedback] = useState([]);
  const [analytics, setAnalytics] = useState({
    averageRating: 0,
    totalReviews: 0,
    positiveReviews: 0,
    reviewsByEvent: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    if (currentUserRole !== "organizer" || !currentUserToken) {
      return undefined;
    }

    const loadFeedback = async () => {
      try {
        setIsLoading(true);
        const result = await fetchOrganizerFeedback();

        if (!isMounted) {
          return;
        }

        setAllFeedback(result.feedback);
        setAnalytics(result.analytics);
        setErrorMessage("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setAllFeedback([]);
        setAnalytics({
          averageRating: 0,
          totalReviews: 0,
          positiveReviews: 0,
          reviewsByEvent: [],
        });
        setErrorMessage(
          error.message || "Unable to load feedback analytics right now."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFeedback();

    return () => {
      isMounted = false;
    };
  }, [currentUserRole, currentUserToken]);

  const events = useMemo(
    () => analytics.reviewsByEvent.map((event) => ({ title: event.eventTitle })),
    [analytics.reviewsByEvent]
  );

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

  if (currentUserRole !== "organizer") {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-[#0f1e33]">Event Feedback</h1>
          <p className="mt-2 text-[#6b7c93]">
            View and analyze feedback from your event attendees.
          </p>
        </div>

        {errorMessage ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </section>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100">
                <Star size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f1e33]">
                  {Number(analytics.averageRating || 0).toFixed(1)}
                </p>
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
                <p className="text-2xl font-bold text-[#0f1e33]">
                  {analytics.totalReviews}
                </p>
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
                <p className="text-2xl font-bold text-[#0f1e33]">
                  {analytics.positiveReviews}
                </p>
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
              className="w-full rounded-xl border border-[#d9e2ec] px-4 py-3 outline-none transition focus:border-[#1f4e79] sm:w-auto sm:min-w-[220px]"
            >
              {eventOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </section>

        {isLoading ? (
          <section className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <MessageSquare size={48} className="mx-auto text-[#9aa9bc]" />
            <h3 className="mt-4 text-xl font-semibold text-[#0f1e33]">
              Loading feedback...
            </h3>
            <p className="mt-2 text-[#6b7c93]">
              Fetching attendee reviews and analytics from the backend.
            </p>
          </section>
        ) : filteredFeedback.length > 0 ? (
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
