import { Link, Navigate } from "react-router-dom";
import Dashboard from "../../components/dashboard/dashboard.jsx";   
function AdminDashboard(){
    const storedUser = window.localStorage.getItem("smart_event_user");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;

    if (!currentUser || currentUser.role !== "admin") {
        return <Navigate to="/login" replace />;
    }

    return(<>
    <Dashboard/>
    </>)
}
export default AdminDashboard;
