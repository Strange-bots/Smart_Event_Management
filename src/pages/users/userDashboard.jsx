import { useNavigate, Link } from "react-router-dom";
import DashboardLayout from "../../components/dashboard/dashboard";
import EventCalendar from "../../components/dashboard/EventCalendar";
const upcomingEvents = [
  {
    id: 1,
    title: "Annual Technology Summit 2024",
    date: "March 15, 2024",
    time: "9:00 AM - 5:00 PM",
    location: "Main Auditorium",
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=300&q=80",
  },
  {
    id: 2,
    title: "Business Analytics Workshop",
    date: "March 20, 2024",
    time: "10:00 AM - 2:00 PM",
    location: "Room 301",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&q=80",
  },
];

const recommendations = [
  {
    id: 1,
    title: "AI & Machine Learning Seminar",
    date: "March 25, 2024",
    match: 95,
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&q=80",
  },
  {
    id: 2,
    title: "Data Science Workshop",
    date: "March 28, 2024",
    match: 88,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&q=80",
  },
  {
    id: 3,
    title: "Cloud Computing Fundamentals",
    date: "April 2, 2024",
    match: 82,
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&q=80",
  },
];

const UserDashboard = () => {
  const navigate = useNavigate();

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
              You have 2 upcoming events this week. Discover new opportunities tailored just for you.
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
                <p className="text-3xl font-bold text-gray-900">5</p>
                <p className="text-sm text-gray-500 mt-1">Registered Events</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center text-2xl">📅</div>
            </div>
            <p className="mt-3 text-xs text-green-600">↑ 2 upcoming</p>
          </div>

          <div
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer p-5"
            onClick={() => navigate("/userEvents")}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">12</p>
                <p className="text-sm text-gray-500 mt-1">Events Attended</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center text-2xl">⭐</div>
            </div>
            <p className="mt-3 text-xs text-gray-400">This semester</p>
          </div>

          <div
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer p-5"
            onClick={() => navigate("/userEvents")}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">8</p>
                <p className="text-sm text-gray-500 mt-1">Certificates</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-2xl">🏆</div>
            </div>
            <p className="mt-3 text-xs text-purple-600">View all →</p>
          </div>

          <div
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer p-5"
            onClick={() => navigate("/userNotifications")}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">3</p>
                <p className="text-sm text-gray-500 mt-1">Notifications</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center text-2xl">🔔</div>
            </div>
            <p className="mt-3 text-xs text-red-500">Unread messages</p>
          </div>
        </div>

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
              {upcomingEvents.map((event) => (
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
                        <span>📅 {event.date}</span>
                        <span>🕐 {event.time}</span>
                        <span>📍 {event.location}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="border border-gray-300 text-gray-700 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                        View Details
                      </button>
                      <button className="text-gray-400 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span>✨</span>
              <h2 className="text-lg font-semibold text-gray-900">Recommended For You</h2>
            </div>

            <div className="space-y-3">
              {recommendations.map((event) => (
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
              ))}
            </div>

            {/* Activity Mini Card */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-800 mb-3">Your Activity</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-white rounded-lg">
                  <p className="text-xl font-bold text-[#1f4e79]">85%</p>
                  <p className="text-xs text-gray-500">Attendance Rate</p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg">
                  <p className="text-xl font-bold text-[#f36f21]">4.8</p>
                  <p className="text-xs text-gray-500">Avg. Rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <EventCalendar />
      </div>

    </DashboardLayout>

  );
};

export default UserDashboard;
