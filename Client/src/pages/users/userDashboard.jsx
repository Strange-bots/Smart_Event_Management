import { useEffect, useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import DashboardLayout from "../../components/dashboard/dashboard";
import EventCalendar from "../../components/dashboard/eventCalendar.jsx";
import { fetchRoleScopedCalendarEvents } from "../../services/calendarService.js";
import { fetchRecommendedUserEvents } from "../../services/eventService.js";
import { fetchMyFeedback } from "../../services/feedbackService.js";
import { fetchMyNotifications } from "../../services/notificationService.js";
import { fetchMyEventRegistrations } from "../../services/registrationService.js";
import { getCurrentUser } from "../../utils/auth";

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

const parseEventDate = (dateString) => {
  if (!dateString) {
    return null;
  }

  const parsedDate = new Date(dateString);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const getEventStatus = (registration) => {
  if (registration.attendanceStatus === "attended") {
    return "attended";
  }

  if (registration.attendanceStatus === "cancelled") {
    return "cancelled";
  }

  if (registration.attendanceStatus === "no-show") {
    return "no-show";
  }

  return "upcoming";
};

const mapRegistrationToDashboardEvent = (registration) => ({
  id: registration.event?.id,
  registrationId: registration.registrationId,
  title: registration.event?.title || "Untitled Event",
  date: registration.event?.date,
  dateLabel: formatEventDate(registration.event?.date),
  time: registration.event?.time || "Time to be announced",
  location: registration.event?.location || registration.event?.venue || "Venue to be announced",
  venue: registration.event?.venue || registration.event?.location || "Venue to be announced",
  image:
    registration.event?.image ||
    registration.event?.imagePreview ||
    "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=300&q=80",
  registrations: Number(registration.event?.registrations || 0),
  capacity: Number(registration.event?.capacity || 0),
  status: "approved",
  attendanceStatus: registration.attendanceStatus,
  userStatus: getEventStatus(registration),
});

const UserDashboard = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationSource, setRecommendationSource] = useState("fallback");
  const [dashboardEvents, setDashboardEvents] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarSummary, setCalendarSummary] = useState({
    ongoing: 0,
    coming: 0,
    gone: 0,
    total: 0,
  });
  const [dashboardStats, setDashboardStats] = useState({
    registeredCount: 0,
    attendedCount: 0,
    certificateCount: 0,
    unreadNotificationCount: 0,
    upcomingCount: 0,
    attendanceRate: 0,
    averageRating: 0,
  });
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        const [registrations, notifications, feedback, recommendedResult, calendarResult] = await Promise.all([
          fetchMyEventRegistrations(),
          fetchMyNotifications().catch(() => []),
          fetchMyFeedback().catch(() => []),
          fetchRecommendedUserEvents(3).catch(() => ({
            recommendations: [],
            source: "fallback",
          })),
          fetchRoleScopedCalendarEvents(),
        ]);

        if (!isMounted) {
          return;
        }

        const events = (registrations ?? []).map(mapRegistrationToDashboardEvent);
        const now = new Date();
        const upcomingEvents = events
          .filter((event) => {
            if (event.userStatus !== "upcoming") {
              return false;
            }

            const eventDate = parseEventDate(event.date);
            return !eventDate || eventDate >= now;
          })
          .sort((left, right) => {
            const leftTime = parseEventDate(left.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
            const rightTime = parseEventDate(right.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
            return leftTime - rightTime;
          });
        const attendedCount = events.filter(
          (event) => event.attendanceStatus === "attended"
        ).length;
        const completedAttendanceCount = events.filter((event) =>
          ["attended", "no-show"].includes(event.attendanceStatus)
        ).length;
        const unreadNotificationCount = (notifications ?? []).filter(
          (notification) => !notification.isRead
        ).length;
        const averageRating =
          feedback.length > 0
            ? feedback.reduce(
                (total, item) => total + Number(item.rating || 0),
                0
              ) / feedback.length
            : 0;

        setDashboardEvents(upcomingEvents);
        setCalendarEvents(calendarResult?.events ?? []);
        setCalendarSummary(
          calendarResult?.summary ?? {
            ongoing: 0,
            coming: 0,
            gone: 0,
            total: 0,
          },
        );
        setDashboardStats({
          registeredCount: events.length,
          attendedCount,
          certificateCount: attendedCount,
          unreadNotificationCount,
          upcomingCount: upcomingEvents.length,
          attendanceRate:
            completedAttendanceCount > 0
              ? Math.round((attendedCount / completedAttendanceCount) * 100)
              : 0,
          averageRating,
        });
        setRecommendations(
          (recommendedResult?.recommendations ?? []).map((event) => ({
            id: event.id,
            title: event.title,
            date: event.date,
            match: event.match,
            image: event.image,
          }))
        );
        setRecommendationSource(recommendedResult?.source || "fallback");
        setDashboardError("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setDashboardEvents([]);
        setCalendarEvents([]);
        setCalendarSummary({
          ongoing: 0,
          coming: 0,
          gone: 0,
          total: 0,
        });
        setDashboardStats({
          registeredCount: 0,
          attendedCount: 0,
          certificateCount: 0,
          unreadNotificationCount: 0,
          upcomingCount: 0,
          attendanceRate: 0,
          averageRating: 0,
        });
        setRecommendations([]);
        setRecommendationSource("fallback");
        setDashboardError(
          error.message || "Unable to load your dashboard right now."
        );
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!currentUser || currentUser.role !== "user") {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1f4e79] via-[#163a5a] to-[#0f1e33] p-6 md:p-8">
          <div className="relative z-10">
            <p className="text-white/70 text-sm font-medium mb-1">Welcome back,</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Good to see you! 👋
            </h1>
            <p className="text-white/80 max-w-lg">
              {dashboardStats.upcomingCount > 0
                ? `You have ${dashboardStats.upcomingCount} upcoming event${dashboardStats.upcomingCount === 1 ? "" : "s"} coming up. Discover new opportunities tailored just for you.`
                : "You have no upcoming events right now. Discover new opportunities tailored just for you."}
            </p>

            <div className="flex flex-wrap gap-3 mt-6">
              <button
                className="flex items-center gap-2 bg-white text-[#1f4e79] hover:bg-white/90 font-medium px-4 py-2 rounded-lg transition-colors"
                onClick={() => navigate("/browseEvents")}
              >
                🔍 Browse Events
              </button>
              <button
                className="flex items-center gap-2 text-white hover:bg-white/10 font-medium px-4 py-2 rounded-lg transition-colors"
                onClick={() => navigate("/userEvents")}
              >
                My Events →
              </button>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/browseEvents">
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4 flex items-center gap-3 h-full">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-xl">🔍</div>
              <span className="font-medium text-gray-800">Browse Events</span>
            </div>
          </Link>
          <Link to="/userEvents">
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4 flex items-center gap-3 h-full">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">📅</div>
              <span className="font-medium text-gray-800">My Events</span>
            </div>
          </Link>
          <Link to="/userPayments">
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4 flex items-center gap-3 h-full">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl">💳</div>
              <span className="font-medium text-gray-800">Payments</span>
            </div>
          </Link>
          <Link to="/userProfile">
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4 flex items-center gap-3 h-full">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl">👤</div>
              <span className="font-medium text-gray-800">Profile</span>
            </div>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer p-5"
            onClick={() => navigate("/userEvents")}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{dashboardStats.registeredCount}</p>
                <p className="text-sm text-gray-500 mt-1">Registered Events</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center text-2xl">📅</div>
            </div>
            <p className="mt-3 text-xs text-green-600">
              {dashboardStats.upcomingCount} upcoming
            </p>
          </div>

          <div
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer p-5"
            onClick={() => navigate("/userEvents")}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{dashboardStats.attendedCount}</p>
                <p className="text-sm text-gray-500 mt-1">Events Attended</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center text-2xl">⭐</div>
            </div>
            <p className="mt-3 text-xs text-gray-400">From your attendance history</p>
          </div>

          <div
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer p-5"
            onClick={() => navigate("/userEvents")}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{dashboardStats.certificateCount}</p>
                <p className="text-sm text-gray-500 mt-1">Certificates</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-2xl">🏆</div>
            </div>
            <p className="mt-3 text-xs text-purple-600">Earned from attended events</p>
          </div>

          <div
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer p-5"
            onClick={() => navigate("/userNotifications")}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{dashboardStats.unreadNotificationCount}</p>
                <p className="text-sm text-gray-500 mt-1">Notifications</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center text-2xl">🔔</div>
            </div>
            <p className="mt-3 text-xs text-red-500">Unread messages</p>
          </div>
        </div>

        {dashboardError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {dashboardError}
          </div>
        ) : null}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Upcoming Events */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">My Upcoming Events</h2>
              <button
                className="text-sm text-[#f36f21] hover:underline flex items-center gap-1"
                onClick={() => navigate("/userEvents")}
              >
                View All ›
              </button>
            </div>

            <div className="space-y-3">
              {dashboardEvents.length ? dashboardEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex"
                  onClick={() => navigate("/userEvents")}
                >
                  <div className="w-32 md:w-40 shrink-0">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-4 md:p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-2">{event.title}</h3>
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full shrink-0">
                          Registered
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span>📅 {event.dateLabel}</span>
                        <span>🕐 {event.time}</span>
                        <span>📍 {event.location}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        className="border border-gray-300 text-gray-700 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={(eventClick) => {
                          eventClick.stopPropagation();
                          navigate("/userEvents");
                        }}
                      >
                        View Details
                      </button>
                      <button
                        className="text-gray-400 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={(eventClick) => {
                          eventClick.stopPropagation();
                          navigate("/userEvents");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
                  You have no upcoming registered events right now.
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span>✨</span>
              <h2 className="text-lg font-semibold text-gray-900">Recommended For You</h2>
            </div>
            <p className="text-xs font-medium text-purple-600">
              {recommendationSource === "gemini"
                ? "Powered by Gemini"
                : "Showing server fallback recommendations"}
            </p>

            <div className="space-y-3">
              {recommendations.length ? recommendations.map((event) => (
                <div
                  key={event.id}
                  className="bg-white border border-purple-100 rounded-xl shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer overflow-hidden"
                  onClick={() => navigate("/browseEvents")}
                >
                  <div className="relative">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-28 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                      {event.match}% match
                    </span>
                    <div className="absolute bottom-2 left-3 right-3">
                      <h3 className="font-semibold text-white text-sm line-clamp-1">{event.title}</h3>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-sm text-gray-500">📅 {event.date}</span>
                    <button
                      className="bg-[#f36f21] text-white text-sm px-3 py-1.5 rounded-lg hover:bg-[#e05e10] transition-colors"
                      onClick={(e) => { e.stopPropagation(); navigate("/browseEvents"); }}
                    >
                      Register
                    </button>
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
                  No AI recommendations are available right now.
                </div>
              )}
            </div>

            {/* Activity Mini Card */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-800 mb-3">Your Activity</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-white rounded-lg">
                  <p className="text-xl font-bold text-[#1f4e79]">{dashboardStats.attendanceRate}%</p>
                  <p className="text-xs text-gray-500">Attendance Rate</p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg">
                  <p className="text-xl font-bold text-[#f36f21]">
                    {dashboardStats.averageRating.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">Avg. Rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <EventCalendar
          events={calendarEvents}
          summary={calendarSummary}
          onEventClick={() => navigate("/userEvents")}
          title="My Registered Event Calendar"
          emptyStateMessage="Select another date or change the status filter."
        />
      </div>

    </DashboardLayout>

  );
};

export default UserDashboard;
