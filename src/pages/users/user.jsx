import { Navigate } from "react-router-dom";
import DashboardLayout from "../../components/dashboard/dashboard.jsx";

function UserDashboard() {
  const storedUser = window.localStorage.getItem("smart_event_user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  if (!currentUser || currentUser.role !== "user") {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-[#0f1e33]">User Dashboard</h1>
        <p className="text-[#6b7c93]">
          Welcome to the User Dashboard. Browse and register for events, view
          your upcoming activities, and manage your profile.
        </p>
      </div>
    </DashboardLayout>
  );
}

export default UserDashboard;
