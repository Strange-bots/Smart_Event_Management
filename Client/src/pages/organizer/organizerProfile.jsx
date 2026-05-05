import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Mail,
  Phone,
  Save,
  Shield,
  Sparkles,
  Star,
  Upload,
  User,
  Users,
  Award,
  GraduationCap,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "../../components/dashboard/dashboard.jsx";
import { fetchOrganizerEvents } from "../../services/organizerEventService.js";
import { getCurrentUser, setCurrentUser } from "../../utils/auth.js";

const FEEDBACK_STORAGE_KEY = "smart_event_organizer_feedback";

const sampleFeedback = [
  { id: "feedback-1", organizerEmail: "organizer@demo.com", rating: 5 },
  { id: "feedback-2", organizerEmail: "organizer@demo.com", rating: 4 },
  { id: "feedback-3", organizerEmail: "organizer@demo.com", rating: 4 },
];

const EMPTY_PROFILE = {
  id: "",
  name: "",
  email: "",
  role: "",
  status: "",
  createdAt: "",
  avatar: null,
  phone: "",
};

const EMPTY_PROFILE_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

const EMPTY_PASSWORD_FORM = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "";

const cn = (...classes) => classes.filter(Boolean).join(" ");

function OrganizerProfile() {
  const currentUser = getCurrentUser();
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE_FORM);
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [notice, setNotice] = useState(null);
  const [events, setEvents] = useState([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "organizer") {
      return undefined;
    }

    let isMounted = true;

    fetchOrganizerEvents()
      .then((organizerEvents) => {
        if (isMounted) {
          setEvents(organizerEvents);
        }
      })
      .catch(() => {
        if (isMounted) {
          setEvents([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser?.email, currentUser?.role]);

  useEffect(() => {
    if (!currentUser?.token || currentUser.role !== "organizer") {
      setIsLoadingProfile(false);
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Unable to load profile.");
        }

        if (!isMounted) {
          return;
        }

        const nextProfile = data.user ?? EMPTY_PROFILE;
        const nameParts = nextProfile.name?.trim().split(/\s+/).filter(Boolean) ?? [];

        setProfile(nextProfile);
        setProfileForm({
          firstName: nameParts[0] ?? "",
          lastName: nameParts.slice(1).join(" "),
          email: nextProfile.email ?? "",
          phone: nextProfile.phone ?? "",
        });
        setNotice(null);
      } catch (error) {
        if (isMounted) {
          setNotice({
            type: "error",
            message: error.message || "Unable to load profile.",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.role, currentUser?.token]);

  const feedback = useMemo(() => {
    const storedFeedback = JSON.parse(
      window.localStorage.getItem(FEEDBACK_STORAGE_KEY) || "[]",
    );
    const combinedFeedback =
      storedFeedback.length > 0 ? storedFeedback : sampleFeedback;

    return combinedFeedback.filter(
      (item) =>
        !currentUser ||
        item.organizerEmail === currentUser.email ||
        item.organizerId === currentUser.id,
    );
  }, [currentUser]);

  if (!currentUser || currentUser.role !== "organizer") {
    return <Navigate to="/login" replace />;
  }

  const totalAttendees = events.reduce(
    (sum, event) => sum + Number(event.registrations || 0),
    0,
  );
  const averageRating = feedback.length
    ? (
        feedback.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
        feedback.length
      ).toFixed(1)
    : "0.0";

  const nameParts = profile.name.trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? "";
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "N/A";
  const roleLabel = profile.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : "Organizer";

  const handleSaveProfile = async () => {
    if (!currentUser?.token) {
      setNotice({ type: "error", message: "You need to sign in to update your profile." });
      return;
    }

    const fullName = `${profileForm.firstName} ${profileForm.lastName}`.trim();

    try {
      setIsUpdatingProfile(true);

      const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName,
          phone: profileForm.phone,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to update profile.");
      }

      const updatedProfile = data.user ?? profile;
      const updatedSessionUser = {
        ...currentUser,
        ...updatedProfile,
        token: data.token || currentUser.token,
      };

      setProfile(updatedProfile);
      setCurrentUser(updatedSessionUser);
      setNotice({ type: "success", message: "Profile updated successfully." });
    } catch (error) {
      setNotice({
        type: "error",
        message: error.message || "Unable to update profile.",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentUser?.token) {
      setNotice({ type: "error", message: "You need to sign in to update your password." });
      return;
    }

    try {
      setIsUpdatingPassword(true);

      const response = await fetch(`${apiBaseUrl}/api/auth/change-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordForm),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to update password.");
      }

      setPasswordForm(EMPTY_PASSWORD_FORM);
      setNotice({ type: "success", message: "Password updated successfully." });
    } catch (error) {
      setNotice({
        type: "error",
        message: error.message || "Unable to update password.",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {notice ? (
          <div
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm font-medium",
              notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700",
            )}
          >
            {notice.message}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-1">
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 mx-auto">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile.name || "avatar"}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#1f4e79] text-3xl font-semibold text-white">
                      {(firstName[0] || profile.email[0] || "O").toUpperCase()}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#f36f21] text-white shadow"
                >
                  <Upload size={14} />
                </button>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isLoadingProfile ? "Loading..." : profile.name || "Unknown Organizer"}
              </h2>
              <p className="text-gray-500 mb-2">{profile.email || currentUser.email}</p>
              <span className="text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                {roleLabel}
              </span>
            </div>

            <hr className="my-6 border-gray-200" />

            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Calendar size={18} className="text-[#1f4e79]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                  <p className="text-sm text-gray-500">Events Created</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Users size={18} className="text-[#f36f21]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalAttendees}</p>
                  <p className="text-sm text-gray-500">Total Attendees</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Star size={18} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{averageRating}</p>
                  <p className="text-sm text-gray-500">Average Rating</p>
                </div>
              </div>
            </div>
          </section>

          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-xl shadow-sm bg-white">
              <div className="px-6 pt-6 pb-2">
                <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                <p className="text-sm text-gray-500">Update your personal details</p>
              </div>
              <div className="px-6 pb-6 space-y-4 mt-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="firstName"
                        value={profileForm.firstName}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="lastName"
                        value={profileForm.lastName}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        readOnly
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm bg-gray-50 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="phone"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="organizerId" className="text-sm font-medium text-gray-700">User ID</label>
                    <div className="relative">
                      <GraduationCap size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="organizerId"
                        value={profile.id}
                        readOnly
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm bg-gray-50 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="organizerRole" className="text-sm font-medium text-gray-700">Role</label>
                    <div className="relative">
                      <GraduationCap size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="organizerRole"
                        value={roleLabel}
                        readOnly
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm bg-gray-50 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="organizerStatus" className="text-sm font-medium text-gray-700">Account Status</label>
                    <div className="relative">
                      <Award size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="organizerStatus"
                        value={profile.status || "N/A"}
                        readOnly
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm bg-gray-50 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="memberSince" className="text-sm font-medium text-gray-700">Member Since</label>
                    <div className="relative">
                      <Sparkles size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="memberSince"
                        value={memberSince}
                        readOnly
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm bg-gray-50 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isUpdatingProfile}
                    className="flex items-center gap-2 bg-[#f36f21] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#e05e10] transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Save size={18} />
                    {isUpdatingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-[#1f4e79]" />
                <h2 className="text-xl font-semibold text-[#0f1e33]">
                  Security Settings
                </h2>
              </div>
              <p className="mt-1 text-sm text-[#6b7c93]">
                Manage your account security.
              </p>

              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="currentPassword" className="mb-2 block text-sm font-medium text-[#0f1e33]">
                      Current Password
                    </label>
                    <input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          currentPassword: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-[#d9e2ec] px-4 py-3 outline-none transition focus:border-[#1f4e79]"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-[#0f1e33]">
                      New Password
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          newPassword: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-[#d9e2ec] px-4 py-3 outline-none transition focus:border-[#1f4e79]"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-[#0f1e33]">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          confirmPassword: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-[#d9e2ec] px-4 py-3 outline-none transition focus:border-[#1f4e79]"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={isUpdatingPassword}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#f36f21] px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Save size={18} />
                    {isUpdatingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default OrganizerProfile;
