import DashboardLayout from "../../components/dashboard/dashboard.jsx";

function AdminSettings(){
    return(
        <DashboardLayout>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-[#0f1e33]">
              Admin Settings Page
            </h1>
            <p className="text-[#6b7c93]">
              Here you can manage the global settings for the application.
            </p>
          </div>
        </DashboardLayout>
    )
}
export default AdminSettings;
