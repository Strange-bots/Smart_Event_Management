import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import Navbar from "../components/layout/navbar";
import AuthPanelDivider from "../components/auth/AuthPanelDivider.jsx";
import AuthSectionDivider from "../components/auth/AuthSectionDivider.jsx";
import koiLogo from "../assets/koi-logo.jpg";
import { fetchPublicBrandingSettings } from "../services/publicSettingsService.js";
import {
  getCurrentUser,
  getDashboardPath,
  setCurrentUser,
} from "../utils/auth";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [branding, setBranding] = useState({
    organization: {
      name: "KOI Smart Events",
      logo: koiLogo,
    },
  });
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (currentUser?.role && currentUser?.token) {
      navigate(getDashboardPath(currentUser.role), { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;

    const loadBranding = async () => {
      try {
        const nextBranding = await fetchPublicBrandingSettings();

        if (isMounted) {
          setBranding({
            organization: {
              name: nextBranding?.organization?.name || "KOI Smart Events",
              logo: nextBranding?.organization?.logo || koiLogo,
            },
          });
        }
      } catch {
        if (isMounted) {
          setBranding({
            organization: {
              name: "KOI Smart Events",
              logo: koiLogo,
            },
          });
        }
      }
    };

    loadBranding();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
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

    try {
      const response = await fetch(`${apiBaseUrl}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid email or password");
        setIsLoading(false);
        return;
      }

      setCurrentUser({ ...data.user, token: data.token });

      setTimeout(() => {
        setIsLoading(false);
        navigate(getDashboardPath(data.user.role), { replace: true });
      }, 600);
    } catch {
      setIsLoading(false);
      setError("Unable to connect to the server");
    }
  };

  return (
    <>
    <Navbar/>
    <div className="auth-hero-shell min-h-screen flex relative">
      <div className="absolute inset-0 opacity-10 lg:hidden">
        <div className="auth-hero-glow-primary absolute left-10 top-20 h-72 w-72 rounded-full blur-3xl" />
        <div className="auth-hero-glow-ai absolute bottom-10 right-10 h-96 w-96 rounded-full blur-3xl" />
      </div>
      <div
        className="auth-hero-panel hidden lg:flex lg:w-1/2 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="auth-hero-glow-primary absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl" />
          <div className="auth-hero-glow-ai absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center p-12">
          <Link to="/" className="flex items-center gap-3 mb-8">
            <img
              src={branding.organization.logo}
              alt={branding.organization.name}
              className="h-14 rounded bg-card p-1 shadow-sm"
            />
          </Link>
          <h1 className="text-4xl font-heading font-bold text-white mb-4">
            Welcome Back!
          </h1>
          <p className="text-white/85 text-lg max-w-md">
            Sign in to manage your events, track registrations, and access
            AI-powered insights for your educational activities.
          </p>
        </div>
      </div>

      <AuthPanelDivider />

      <div className="relative z-10 flex-1 flex items-center justify-center p-6 lg:bg-secondary">
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
                  <img
                    src={branding.organization.logo}
                    alt={branding.organization.name}
                    className="h-12 w-12 rounded object-cover"
                  />
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
                      placeholder="Enter your password"
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

              <AuthSectionDivider label="New here?" />

              <div className="text-center">
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

            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Login;
