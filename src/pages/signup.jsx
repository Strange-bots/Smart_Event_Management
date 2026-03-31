import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/navbar";
import {
  getCurrentUser,
  getDashboardPath,
  getRegisteredUsers,
  saveRegisteredUsers,
  setCurrentUser,
} from "../utils/auth";

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (currentUser?.role) {
      navigate(getDashboardPath(currentUser.role), { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!formData.email.trim()) {
      setError("Please enter your email");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setIsLoading(true);

    const normalizedEmail = formData.email.trim().toLowerCase();
    const existingUsers = getRegisteredUsers();
    const emailTaken = existingUsers.some(
      (user) => user.email.toLowerCase() === normalizedEmail,
    );

    if (emailTaken) {
      setIsLoading(false);
      setError("An account with this email already exists");
      return;
    }

    const newUser = {
      name: formData.name.trim(),
      email: normalizedEmail,
      password: formData.password,
      role: "user",
    };

    saveRegisteredUsers([...existingUsers, newUser]);
    setCurrentUser({
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });

    setTimeout(() => {
      setIsLoading(false);
      navigate("/user/dashboard", { replace: true });
    }, 600);
  };

  return (
    <>
    <Navbar/>
    <div className="min-h-screen bg-secondary flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-brand-orange rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-ai rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center p-12">
          <Link to="/" className="flex items-center gap-3 mb-8">
            <div className="h-14 w-14 rounded bg-card text-primary flex items-center justify-center font-semibold">
              KOI
            </div>
          </Link>
          <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-4">
            Join Our Community
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Create your account to browse and register for events, receive
            notifications, and connect with the community.
          </p>
          <ul className="mt-8 space-y-3">
            <li className="flex items-center gap-3 text-primary-foreground/80">
              <span className="text-brand-orange">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </span>
              Browse and register for events
            </li>
            <li className="flex items-center gap-3 text-primary-foreground/80">
              <span className="text-brand-orange">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </span>
              Receive event notifications
            </li>
            <li className="flex items-center gap-3 text-primary-foreground/80">
              <span className="text-brand-orange">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </span>
              Track your registrations
            </li>
          </ul>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to Home
          </Link>

          <div className="border-0 shadow-lg rounded-lg bg-card">
            <div className="text-center pb-0 p-6">
              <div className="lg:hidden flex justify-center mb-4">
                <div className="h-12 w-12 rounded bg-card text-primary flex items-center justify-center font-semibold">
                  KOI
                </div>
              </div>
              <div className="text-2xl font-heading">Create Account</div>
              <div className="text-muted-foreground">
                Fill in your details to get started
              </div>
            </div>
            <div className="pt-6 p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c2.5-4 13.5-4 16 0" />
                      </svg>
                    </span>
                    <input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10 w-full rounded-lg border border-[#d9e2ec] px-4 py-3 text-[#0f1e33] outline-none transition focus:border-[#1f4e79]"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="M3 7l9 6 9-6" />
                      </svg>
                    </span>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 w-full rounded-lg border border-[#d9e2ec] px-4 py-3 text-[#0f1e33] outline-none transition focus:border-[#1f4e79]"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password">Password</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                      </svg>
                    </span>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter the new password"
                      className="pl-10 pr-10 w-full rounded-lg border border-[#d9e2ec] px-4 py-3 text-[#0f1e33] outline-none transition focus:border-[#1f4e79]"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <svg
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z" />
                          <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                          <path d="M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z" />
                          <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                      </svg>
                    </span>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      className="pl-10 w-full rounded-lg border border-[#d9e2ec] px-4 py-3 text-[#0f1e33] outline-none transition focus:border-[#1f4e79]"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#f36f21] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#ff8a3d]"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-muted-foreground text-sm">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-brand-orange hover:underline font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </div>

              <div className="mt-4 p-3 bg-secondary rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  By creating an account, you'll be registered as a{" "}
                  <span className="font-medium text-foreground">User</span> who
                  can browse and register for events.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Signup;
