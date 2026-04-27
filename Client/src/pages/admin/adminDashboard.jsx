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

const salesData = [
  { month: "Jan", sales: 4000 },
  { month: "Feb", sales: 3000 },
  { month: "Mar", sales: 5000 },
  { month: "Apr", sales: 4500 },
  { month: "May", sales: 6000 },
  { month: "Jun", sales: 5500 },
];

const venueData = [
  { name: "Main Auditorium", value: 35, color: "#1F4E79" },
  { name: "Conference Hall", value: 25, color: "#F36F21" },
  { name: "Room 301", value: 20, color: "#6D5DF6" },
  { name: "Exhibition Hall", value: 20, color: "#6B7C93" },
];

const adminCalendarEvents = [
  {
    id: "admin-event-1",
    title: "AI Innovation Summit",
    date: "2026-05-12",
    time: "10:00 AM",
    venue: "Main Auditorium",
    status: "approved",
    registrations: 145,
    capacity: 200,
  },
  {
    id: "admin-event-2",
    title: "Career Networking Night",
    date: "2026-05-15",
    time: "6:30 PM",
    venue: "Conference Hall",
    status: "pending",
    registrations: 220,
    capacity: 250,
  },
  {
    id: "admin-event-3",
    title: "Industry Meetup",
    date: "2026-05-15",
    time: "2:00 PM",
    venue: "Room 301",
    status: "approved",
    registrations: 80,
    capacity: 120,
  },
  {
    id: "admin-event-4",
    title: "Startup Pitch Day",
    date: "2026-05-21",
    time: "1:00 PM",
    venue: "Exhibition Hall",
    status: "rejected",
    registrations: 45,
    capacity: 100,
  },
];

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

  if (!currentUser || currentUser.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  const handleEventClick = () => {
    navigate("/admin/adminevents");
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Events"
            value="48"
            subtitle="12 this month"
            icon={Calendar}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Total Users"
            value="2,340"
            subtitle="156 new this week"
            icon={Users}
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Revenue"
            value="$12,450"
            subtitle="From registrations"
            icon={DollarSign}
            trend={{ value: 23, isPositive: true }}
          />
          <StatCard
            title="Active Venues"
            value="8"
            subtitle="2 pending approval"
            icon={MapPin}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp size={20} className="text-[#f36f21]" />
                Sales Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#6b7c93" />
                    <YAxis stroke="#6b7c93" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #d9e2ec",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar
                      dataKey="sales"
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
                        data={venueData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {venueData.map((entry) => (
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
                  {venueData.map((venue) => (
                    <div
                      key={venue.name}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: venue.color }}
                      />
                      <span className="text-[#6b7c93]">{venue.name}</span>
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
              <Button
                variant="outline"
                onClick={() => navigate("/admin/adminsettings")}
              >
                System Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        <EventCalendar
          events={adminCalendarEvents}
          onEventClick={handleEventClick}
        />
      </div>
    </DashboardLayout>
  );
}

export default AdminDashboard;
