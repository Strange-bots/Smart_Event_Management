import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/navbar.jsx";
import Footer from "../components/layout/footer.jsx";

const users = {
  "admin@demo.com": {
    role: "admin",
    password: "admin123",
    dashboard: "/admin/admindashboard",
  },
  "user@demo.com": {
    role: "user",
    password: "user123",
    dashboard: "/user/dashboard",
  },
  "organizer@demo.com": {
    role: "organizer",
    password: "organizer123",
    dashboard: "/organizer/organizerdashboard",
  },
};

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    const matchedUser = users[trimmedEmail];

    if (!matchedUser || matchedUser.password !== password) {
      setError("Invalid email or password");
      return;
    }

    const authenticatedUser = {
      email: trimmedEmail,
      role: matchedUser.role,
    };

    window.localStorage.setItem(
      "smart_event_user",
      JSON.stringify(authenticatedUser)
    );
    setError("");
    navigate(matchedUser.dashboard);
  };

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
          <div className="mb-6 rounded-lg bg-[#f5f7fa] p-4 text-sm text-[#6b7c93]">
            Demo passwords:
            <div className="mt-2">Admin: `admin123`</div>
            <div>User: `user123`</div>
            <div>Organizer: `organizer123`</div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
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
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-[#d9e2ec] px-4 py-3 text-[#0f1e33] outline-none transition focus:border-[#1f4e79]"
              />
            </div>

            {error ? (
              <p className="text-sm font-medium text-red-600">{error}</p>
            ) : null}

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
