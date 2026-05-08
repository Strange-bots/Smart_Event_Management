import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";
import Navbar from "../components/layout/navbar";
import koiLogo from "../assets/koi-logo.jpg";
import { fetchPublicBrandingSettings } from "../services/publicSettingsService.js";
import { getCurrentUser, getDashboardPath } from "../utils/auth";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "";
const authPanelBackground = {
  background: "linear-gradient(160deg, #2155C4 0%, #0E2A66 100%)",
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [previewOtp, setPreviewOtp] = useState("");
  const [branding, setBranding] = useState({
    organization: {
      name: "KOI Smart Events",
      logo: koiLogo,
    },
  });

  const maskedEmail = useMemo(() => {
    const [name, domain] = email.split("@");

    if (!name || !domain) {
      return email;
    }

    return `${name.slice(0, 2)}${"*".repeat(Math.max(name.length - 2, 2))}@${domain}`;
  }, [email]);

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

  const sendResetOtp = async () => {
    const response = await fetch(`${apiBaseUrl}/api/auth/forgot-password/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Unable to send OTP.");
    }

    return data;
  };

  const handleRequestOtp = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    try {
      setError("");
      setNotice("");
      setIsSubmitting(true);

      const data = await sendResetOtp();
      setStep("reset");
      setNotice("A password reset OTP has been sent to your email.");
      setPreviewOtp(data.previewOtp || "");
    } catch (requestError) {
      setError(requestError.message || "Unable to send OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (otp.trim().length !== 6) {
      setError("Enter the 6 digit OTP sent to your email.");
      return;
    }

    try {
      setError("");
      setNotice("");
      setIsSubmitting(true);

      const response = await fetch(`${apiBaseUrl}/api/auth/forgot-password/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp: otp.trim(),
          newPassword,
          confirmPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || "Unable to reset password.");
        return;
      }

      navigate("/login", {
        replace: true,
        state: {
          notice: data.message || "Password reset successfully. Please sign in.",
          email,
        },
      });
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setError("");
      setNotice("");
      setIsResending(true);

      const data = await sendResetOtp();
      setNotice("A new password reset OTP has been sent to your email.");
      setPreviewOtp(data.previewOtp || "");
    } catch (requestError) {
      setError(requestError.message || "Unable to resend OTP.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-secondary flex relative">
        <div
          className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
          style={authPanelBackground}
        >
          <div className="relative z-10 flex flex-col justify-center p-12">
            <Link to="/" className="flex items-center gap-3 mb-8">
              <img
                src={branding.organization.logo}
                alt={branding.organization.name}
                className="h-14 rounded bg-card p-1 shadow-sm"
              />
            </Link>
            <h1 className="text-4xl font-heading font-bold text-white mb-4">
              Reset Your Password
            </h1>
            <p className="text-white/85 text-lg max-w-md">
              Request a one-time password, verify it, and choose a new password
              for your KOI Smart Events account.
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors"
            >
              <ArrowLeft size={18} />
              Back to sign in
            </Link>

            <div className="border-0 shadow-lg rounded-lg bg-card">
              <div className="text-center pb-0 p-6">
                <div className="text-2xl font-heading">
                  {step === "request" ? "Forgot Password" : "Enter OTP"}
                </div>
                <div className="text-muted-foreground">
                  {step === "request"
                    ? "Enter your KOI email to receive a password reset code."
                    : `We sent a 6 digit OTP to ${maskedEmail}`}
                </div>
              </div>

              <div className="pt-6 p-6">
                {previewOtp ? (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Local test OTP: {previewOtp}
                  </div>
                ) : null}

                {step === "request" ? (
                  <form onSubmit={handleRequestOtp} className="space-y-4">
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
                          placeholder="you@koi.edu.au"
                          className="pl-10 w-full rounded-lg border border-[#d9e2ec] px-4 py-3 text-[#0f1e33] outline-none transition focus:border-[#1f4e79]"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {error ? <p className="text-sm text-red-600">{error}</p> : null}
                    {notice ? (
                      <p className="text-sm text-emerald-700">{notice}</p>
                    ) : null}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-lg bg-[#f36f21] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#ff8a3d] disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      {isSubmitting ? "Sending..." : "Send OTP"}
                    </button>
                  </form>
                ) : (
                  <>
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="otp">One-time password</label>
                        <input
                          id="otp"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="123456"
                          value={otp}
                          onChange={(event) =>
                            setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                          }
                          className="w-full rounded-lg border border-[#d9e2ec] px-4 py-3 text-center text-2xl tracking-[0.5em] text-[#0f1e33] outline-none transition focus:border-[#1f4e79]"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="new-password">New Password</label>
                        <div className="relative">
                          <Lock
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={18}
                          />
                          <input
                            id="new-password"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Enter your new password"
                            className="pl-10 pr-10 w-full rounded-lg border border-[#d9e2ec] px-4 py-3 text-[#0f1e33] outline-none transition focus:border-[#1f4e79]"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword((value) => !value)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="confirm-password">Confirm New Password</label>
                        <div className="relative">
                          <Lock
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={18}
                          />
                          <input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your new password"
                            className="pl-10 pr-10 w-full rounded-lg border border-[#d9e2ec] px-4 py-3 text-[#0f1e33] outline-none transition focus:border-[#1f4e79]"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((value) => !value)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      {error ? <p className="text-sm text-red-600">{error}</p> : null}
                      {notice ? (
                        <p className="text-sm text-emerald-700">{notice}</p>
                      ) : null}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-[#f36f21] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#ff8a3d] disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        {isSubmitting ? "Resetting..." : "Reset Password"}
                      </button>
                    </form>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isResending}
                      className="mt-4 w-full rounded-lg border border-[#d9e2ec] px-4 py-3 text-sm font-semibold text-[#1f4e79] transition hover:bg-[#f5f7fa] disabled:cursor-not-allowed disabled:text-gray-400"
                    >
                      {isResending ? "Sending..." : "Resend OTP"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
