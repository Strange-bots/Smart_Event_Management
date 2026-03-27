import DashboardLayout from "../../components/dashboard/dashboard.jsx";

function AdminMessage(){
    return(
        <DashboardLayout>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-[#0f1e33]">
              Admin Message Page
            </h1>
            <p className="text-[#6b7c93]">
              Here you can manage all the messages, create new ones, and oversee
              communications.
            </p>
          </div>
        </DashboardLayout>
    )
}
export default AdminMessage;
