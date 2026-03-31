import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import Navbar from "../components/layout/navbar";
import {
  findUserByCredentials,
  getCurrentUser,
  getDashboardPath,
  setCurrentUser,
} from "../utils/auth";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (currentUser?.role) {
      navigate(getDashboardPath(currentUser.role), { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      setError("Please enter your email");
      return;
    }

    if (!formData.password.trim()) {
      setError("Please enter your password");
      return;
    }

    setError("");
    setIsLoading(true);

    const matchedUser = findUserByCredentials(
      formData.email,
      formData.password,
    );

    if (!matchedUser) {
      setIsLoading(false);
      setError("Invalid email or password");
      return;
    }

    setCurrentUser({
      name: matchedUser.name,
      email: matchedUser.email,
      role: matchedUser.role,
    });

    setTimeout(() => {
      setIsLoading(false);
      navigate(getDashboardPath(matchedUser.role), { replace: true });
    }, 600);
  };

  const handleQuickLogin = (email, password) => {
    setFormData({ email, password });
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
            Welcome Back!
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Sign in to manage your events, track registrations, and access
            AI-powered insights for your educational activities.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>

          <div className="border-0 shadow-lg rounded-lg bg-card">
            <div className="text-center pb-0 p-6">
              <div className="lg:hidden flex justify-center mb-4">
                <div className="h-12 w-12 rounded bg-card text-primary flex items-center justify-center font-semibold">
                  KOI
                </div>
              </div>
              <div className="text-2xl font-heading">Sign In</div>
              <div className="text-muted-foreground">
                Enter your credentials to access your account
              </div>
            </div>
            <div className="pt-6 p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email">Email Address</label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
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
                  <div className="flex justify-between items-center">
                    <label htmlFor="password">Password</label>
                    <Link
                      to="/login"
                      className="text-sm text-brand-orange hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="��������"
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
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#1f4e79] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2e6da4]"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-muted-foreground text-sm">
                  Don&apos;t have an account?{" "}
                  <Link
                    to="/signup"
                    className="text-brand-orange hover:underline font-medium"
                  >
                    Sign up
                  </Link>
                </p>
              </div>

              <div className="mt-6 p-4 bg-secondary rounded-lg space-y-3">
                <p className="text-xs font-medium text-foreground text-center">
                  Demo Accounts (Click to fill):
                </p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("user@demo.com", "Demo@123")}
                    className="w-full text-left p-2 rounded border border-border hover:bg-accent transition-colors text-xs"
                  >
                    <span className="font-medium text-[#1f4e79]">User:</span>{" "}
                    <span className="text-muted-foreground">
                      user@demo.com / Demo@123
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickLogin("organizer@demo.com", "Demo@123")
                    }
                    className="w-full text-left p-2 rounded border border-border hover:bg-accent transition-colors text-xs"
                  >
                    <span className="font-medium text-brand-orange">
                      Organizer:
                    </span>{" "}
                    <span className="text-muted-foreground">
                      organizer@demo.com / Demo@123
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickLogin("admin@demo.com", "Demo@123")
                    }
                    className="w-full text-left p-2 rounded border border-border hover:bg-accent transition-colors text-xs"
                  >
                    <span className="font-medium text-primary">Admin:</span>{" "}
                    <span className="text-muted-foreground">
                      admin@demo.com / Demo@123
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Login;
