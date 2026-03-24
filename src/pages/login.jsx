import Navbar from "../components/layout/navbar.jsx";
import Footer from "../components/layout/footer.jsx";
const roles = {
  email:{"admin@demo.com": "admin","user@demo.com": "user","organizer@demo.com": "organizer"},
  role:{"admin":"admin","user":"user","organizer":"organizer"}
};
function loginAudthenticate(roles){
    if (roles.email[document.getElementById("login-email").value] === roles.role.admin){
        window.location.assign("/admin/admindashboard");
    }
    else if (roles.email[document.getElementById("login-email").value] === roles.role.user){
        window.location.assign("/user/dashboard");
    }
    else if (roles.email[document.getElementById("login-email").value] === roles.role.organizer){
        window.location.assign("/organizer/organizerdashboard");
    }
    else{
        alert("Invalid credentials");
    }
}
function Login() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f7fa] px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-md rounded-2xl border border-[#d9e2ec] bg-white p-8 shadow-sm">
          <h1 className="mb-3 text-3xl font-bold text-[#0f1e33]">Log In</h1>
          <p className="mb-8 text-sm text-[#6b7c93]">
            Access your Smart Events account to manage registrations and explore
            personalized recommendations.
          </p>

          <form className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="mb-2 block text-sm font-medium text-[#0f1e33]"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-lg border border-[#d9e2ec] px-4 py-3 text-[#0f1e33] outline-none transition focus:border-[#1f4e79]"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-2 block text-sm font-medium text-[#0f1e33]"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                className="w-full rounded-lg border border-[#d9e2ec] px-4 py-3 text-[#0f1e33] outline-none transition focus:border-[#1f4e79]"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-[#1f4e79] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2e6da4]"
            >
              Log In
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default Login;
