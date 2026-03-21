import Navbar from "../components/layout/navbar.jsx";
import Footer from "../components/layout/footer.jsx";

function Signup() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f5f7fa] px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-md rounded-2xl border border-[#d9e2ec] bg-white p-8 shadow-sm">
          <h1 className="mb-3 text-3xl font-bold text-[#0f1e33]">Sign Up</h1>
          <p className="mb-8 text-sm text-[#6b7c93]">
            Create your Smart Events account to register for events and manage
            your event experience.
          </p>

          <form className="space-y-4">
            <div>
              <label
                htmlFor="signup-name"
                className="mb-2 block text-sm font-medium text-[#0f1e33]"
              >
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                placeholder="Enter your full name"
                className="w-full rounded-lg border border-[#d9e2ec] px-4 py-3 text-[#0f1e33] outline-none transition focus:border-[#1f4e79]"
              />
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="mb-2 block text-sm font-medium text-[#0f1e33]"
              >
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-lg border border-[#d9e2ec] px-4 py-3 text-[#0f1e33] outline-none transition focus:border-[#1f4e79]"
              />
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="mb-2 block text-sm font-medium text-[#0f1e33]"
              >
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                placeholder="Create a password"
                className="w-full rounded-lg border border-[#d9e2ec] px-4 py-3 text-[#0f1e33] outline-none transition focus:border-[#1f4e79]"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-[#f36f21] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#ff8a3d]"
            >
              Create Account
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default Signup;
