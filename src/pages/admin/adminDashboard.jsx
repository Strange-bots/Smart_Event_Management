import { Navigate } from "react-router-dom";
import DashboardLayout from "../../components/dashboard/dashboard.jsx";

function AdminDashboard(){
    const storedUser = window.localStorage.getItem("smart_event_user");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;

    if (!currentUser || currentUser.role !== "admin") {
        return <Navigate to="/login" replace />;
    }

    return(
      <DashboardLayout>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-[#0f1e33]">Admin Dashboard</h1>
          <p className="text-[#6b7c93]">
            Welcome to the Admin Dashboard. Manage events, review analytics, and
            oversee user registrations from one place.
          </p>
        </div>
      </DashboardLayout>
    )
}
export default AdminDashboard;
