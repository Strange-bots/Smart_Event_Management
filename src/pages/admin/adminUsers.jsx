import DashboardLayout from "../../components/dashboard/dashboard.jsx";

function AdminUsers(){
    return(
        <DashboardLayout>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-[#0f1e33]">
              Admin Users Page
            </h1>
            <p className="text-[#6b7c93]">
              Here you can manage all the users, create new ones, and oversee
              their permissions.
            </p>
          </div>
        </DashboardLayout>
    )
}
export default AdminUsers;
