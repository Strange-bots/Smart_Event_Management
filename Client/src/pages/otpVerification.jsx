import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/navbar";
import koiLogo from "../assets/koi-logo.jpg";
import {
  getCurrentUser,
  getDashboardPath,
  setCurrentUser,
} from "../utils/auth";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "";
const authPanelBackground = {
  background: "linear-gradient(160deg, #2155C4 0%, #0E2A66 100%)",
};

const OtpVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pendingSignup = location.state ?? null;
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const maskedEmail = useMemo(() => {
    const email = pendingSignup?.email || "";
    const [name, domain] = email.split("@");

    if (!name || !domain) {
      return email;
    }

    return `${name.slice(0, 2)}${"*".repeat(Math.max(name.length - 2, 2))}@${domain}`;
  }, [pendingSignup?.email]);

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (currentUser?.role && currentUser?.token) {
      navigate(getDashboardPath(currentUser.role), { replace: true });
    }
  }, [navigate]);

  if (!pendingSignup?.email || !pendingSignup?.password || !pendingSignup?.name) {
    return <Navigate to="/signup" replace />;
  }

  const handleVerify = async (event) => {
    event.preventDefault();

    if (otp.trim().length !== 6) {
      setError("Enter the 6 digit OTP sent to your email.");
      return;
    }

    try {
      setError("");
      setNotice("");
      setIsVerifying(true);

      const response = await fetch(`${apiBaseUrl}/api/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: pendingSignup.name,
          email: pendingSignup.email,
          password: pendingSignup.password,
          confirmPassword: pendingSignup.confirmPassword,
          otp: otp.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || "Invalid or expired OTP.");
        return;
      }

      setCurrentUser({ ...data.user, token: data.token });
      navigate("/user/dashboard", { replace: true });
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      setError("");
      setNotice("");
      setIsResending(true);

      const response = await fetch(`${apiBaseUrl}/api/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: pendingSignup.name,
          email: pendingSignup.email,
          password: pendingSignup.password,
          confirmPassword: pendingSignup.confirmPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || "Unable to resend OTP.");
        return;
      }

      setNotice("A new OTP has been sent to your email.");
      if (data.previewOtp) {
        setNotice(`A new OTP has been generated for local testing: ${data.previewOtp}`);
      }
    } catch {
      setError("Unable to connect to the server.");
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
                src={koiLogo}
                alt="KOI Logo"
                className="h-14 rounded bg-card p-1 shadow-sm"
              />
            </Link>
            <h1 className="text-4xl font-heading font-bold text-white mb-4">
              Verify Your Email
            </h1>
            <p className="text-white/85 text-lg max-w-md">
              Enter the one-time password sent to your student email to finish
              setting up your account.
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors"
            >
              Back to sign up
            </Link>

            <div className="border-0 shadow-lg rounded-lg bg-card">
              <div className="text-center pb-0 p-6">
                <div className="text-2xl font-heading">OTP Verification</div>
                <div className="text-muted-foreground">
                  We sent a 6 digit OTP to {maskedEmail}
                </div>
              </div>

              <div className="pt-6 p-6">
                {pendingSignup.previewOtp ? (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Local test OTP: {pendingSignup.previewOtp}
                  </div>
                ) : null}

                <form onSubmit={handleVerify} className="space-y-4">
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

                  {error ? <p className="text-sm text-red-600">{error}</p> : null}
                  {notice ? (
                    <p className="text-sm text-emerald-700">{notice}</p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full rounded-lg bg-[#f36f21] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#ff8a3d] disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {isVerifying ? "Verifying..." : "Verify and Create Account"}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="mt-4 w-full rounded-lg border border-[#d9e2ec] px-4 py-3 text-sm font-semibold text-[#1f4e79] transition hover:bg-[#f5f7fa] disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  {isResending ? "Sending..." : "Resend OTP"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OtpVerification;
