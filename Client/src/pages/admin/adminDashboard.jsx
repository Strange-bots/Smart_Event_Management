import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  MapPin,
} from "lucide-react";
import DashboardLayout from "../../components/dashboard/dashboard.jsx";
import EventCalendar from "../../components/dashboard/eventCalendar.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { fetchAdminDashboardOverview } from "../../services/adminDashboardService.js";

const formatCurrency = (value, currency = "AUD") =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

function StatCard({ title, value, subtitle, icon: Icon, trend }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#6b7c93]">{title}</p>
            <p className="text-3xl font-bold text-[#0f1e33]">{value}</p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-[#6b7c93]">{subtitle}</p>
              {trend ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    trend.isPositive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {trend.isPositive ? "+" : "-"}
                  {trend.value}%
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1f4e79]/10 text-[#1f4e79]">
            <Icon size={22} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const storedUser = window.localStorage.getItem("smart_event_user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const [overview, setOverview] = useState({
    stats: null,
    eventsByMonth: [],
    venueDistribution: [],
    calendarEvents: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  if (!currentUser || currentUser.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    let isMounted = true;

    const loadDashboardOverview = async () => {
      try {
        setIsLoading(true);
        const data = await fetchAdminDashboardOverview();

        if (!isMounted) {
          return;
        }

        setOverview(data);
        setError("");
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError.message || "Unable to load admin dashboard data.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboardOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleEventClick = () => {
    navigate("/admin/adminevents");
  };

  const stats = overview.stats ?? {
    totalEvents: 0,
    eventsThisMonth: 0,
    totalUsers: 0,
    approvedEvents: 0,
    totalRevenue: 0,
    currency: "AUD",
    paidRegistrationCount: 0,
    activeVenues: 0,
    pendingEvents: 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1e33] md:text-3xl">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-[#6b7c93]">
            Welcome back! Here&apos;s what&apos;s happening with your events.
          </p>
        </div>

        {error ? (
          <Card className="border border-rose-200 bg-rose-50 shadow-sm">
            <CardContent className="p-5 text-sm text-rose-700">
              {error}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Events"
            value={isLoading ? "..." : String(stats.totalEvents)}
            subtitle={`${stats.eventsThisMonth} this month`}
            icon={Calendar}
          />
          <StatCard
            title="Total Users"
            value={isLoading ? "..." : String(stats.totalUsers)}
            subtitle={`${stats.approvedEvents} approved events`}
            icon={Users}
          />
          <StatCard
            title="Revenue"
            value={isLoading ? "..." : formatCurrency(stats.totalRevenue, stats.currency)}
            subtitle={`${stats.paidRegistrationCount} paid registrations`}
            icon={DollarSign}
          />
          <StatCard
            title="Active Venues"
            value={isLoading ? "..." : String(stats.activeVenues)}
            subtitle={`${stats.pendingEvents} pending events`}
            icon={MapPin}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp size={20} className="text-[#f36f21]" />
                Events by Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview.eventsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" stroke="#6b7c93" />
                    <YAxis stroke="#6b7c93" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #d9e2ec",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar
                      dataKey="events"
                      fill="#f36f21"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin size={20} className="text-[#1f4e79]" />
                Popular Event Venues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                <div className="h-[280px] flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overview.venueDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {overview.venueDistribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #d9e2ec",
                          borderRadius: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {overview.venueDistribution.map((venue) => (
                    <div
                      key={venue.name}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: venue.color }}
                      />
                      <span className="text-[#6b7c93]">
                        {venue.name} ({venue.value})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="brand"
                onClick={() => navigate("/admin/adminevents")}
              >
                Manage Events
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/admin/adminusers")}
              >
                Manage Users
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/admin/adminmessage")}
              >
                View Reports
              </Button>
            </div>
          </CardContent>
        </Card>

        <EventCalendar
          events={overview.calendarEvents}
          summary={overview.calendarSummary}
          onEventClick={handleEventClick}
          title="Platform Event Calendar"
          emptyStateMessage="Select another date or switch to a different event state."
        />
      </div>
    </DashboardLayout>
  );
}

export default AdminDashboard;
