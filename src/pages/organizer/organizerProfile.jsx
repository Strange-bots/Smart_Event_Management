import { useMemo, useState } from "react";
import {
  Building,
  Calendar,
  Mail,
  Phone,
  Save,
  Shield,
  Star,
  Upload,
  User,
  Users,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "../../components/dashboard/dashboard.jsx";

const EVENT_STORAGE_KEY = "smart_event_organizer_events";
const FEEDBACK_STORAGE_KEY = "smart_event_organizer_feedback";
const ORGANIZER_PROFILE_STORAGE_KEY = "smart_event_organizer_profile";

const sampleEvents = [
  { id: "event-sample-1", organizerEmail: "organizer@demo.com", registrations: 48 },
  { id: "event-sample-2", organizerEmail: "organizer@demo.com", registrations: 22 },
];

const sampleFeedback = [
  { id: "feedback-1", organizerEmail: "organizer@demo.com", rating: 5 },
  { id: "feedback-2", organizerEmail: "organizer@demo.com", rating: 4 },
  { id: "feedback-3", organizerEmail: "organizer@demo.com", rating: 4 },
];

const defaultProfile = {
  firstName: "Event",
  lastName: "Manager",
  email: "manager@koi.edu.au",
  phone: "+61 400 123 456",
  department: "Student Services",
  bio: "Passionate event organizer with 5+ years of experience in coordinating educational and networking events at KOI.",
  avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
};

const cn = (...classes) => classes.filter(Boolean).join(" ");

function OrganizerProfile() {
  const storedUser = window.localStorage.getItem("smart_event_user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const savedProfiles = JSON.parse(
    window.localStorage.getItem(ORGANIZER_PROFILE_STORAGE_KEY) || "{}",
  );
  const initialProfile = savedProfiles[currentUser?.email] || {
    ...defaultProfile,
    email: currentUser?.email || defaultProfile.email,
    firstName: currentUser?.name?.split(" ")[0] || defaultProfile.firstName,
    lastName:
      currentUser?.name?.split(" ").slice(1).join(" ") || defaultProfile.lastName,
  };

  const [profile, setProfile] = useState(initialProfile);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState(null);

  const events = useMemo(() => {
    const storedEvents = JSON.parse(
      window.localStorage.getItem(EVENT_STORAGE_KEY) || "[]",
    );
    const combinedEvents = storedEvents.length > 0 ? storedEvents : sampleEvents;

    return combinedEvents.filter(
      (event) =>
        !currentUser ||
        event.organizerEmail === currentUser.email ||
        event.organizerId === currentUser.id,
    );
  }, [currentUser]);

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

  const initials = `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase();

  const handleProfileChange = (field) => (event) => {
    setProfile((prev) => ({ ...prev, [field]: event.target.value }));
    if (notice) {
      setNotice(null);
    }
  };

  const handleSave = () => {
    if (!profile.firstName.trim() || !profile.lastName.trim() || !profile.email.trim()) {
      setNotice({ type: "error", message: "Please complete the required profile fields." });
      return;
    }

    if ((newPassword || confirmPassword || currentPassword) && newPassword !== confirmPassword) {
      setNotice({ type: "error", message: "New password and confirmation do not match." });
      return;
    }

    const nextProfiles = {
      ...savedProfiles,
      [currentUser.email]: profile,
    };
    window.localStorage.setItem(
      ORGANIZER_PROFILE_STORAGE_KEY,
      JSON.stringify(nextProfiles),
    );

    const updatedUser = {
      ...currentUser,
      name: `${profile.firstName} ${profile.lastName}`.trim(),
      email: profile.email,
    };
    window.localStorage.setItem("smart_event_user", JSON.stringify(updatedUser));

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setNotice({ type: "success", message: "Profile updated successfully." });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-[#0f1e33]">My Profile</h1>
          <p className="mt-2 text-[#6b7c93]">
            Manage your personal information and organizer preferences.
          </p>
        </div>

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
              <div className="relative inline-block">
                <img
                  src={profile.avatarUrl}
                  alt={`${profile.firstName} ${profile.lastName}`}
                  className="h-24 w-24 rounded-full object-cover"
                />
                <button
                  type="button"
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#f36f21] text-white shadow"
                >
                  <Upload size={14} />
                </button>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-[#0f1e33]">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-[#6b7c93]">{profile.email}</p>
              <span className="mt-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                Event Organizer
              </span>
            </div>

            <div className="my-6 border-t border-[#e8eef5]" />

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf4ff]">
                  <Calendar size={18} className="text-[#1f4e79]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0f1e33]">{events.length}</p>
                  <p className="text-sm text-[#6b7c93]">Events Created</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff1e8]">
                  <Users size={18} className="text-[#f36f21]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0f1e33]">{totalAttendees}</p>
                  <p className="text-sm text-[#6b7c93]">Total Attendees</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-100">
                  <Star size={18} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0f1e33]">{averageRating}</p>
                  <p className="text-sm text-[#6b7c93]">Average Rating</p>
                </div>
              </div>
            </div>
          </section>

          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#0f1e33]">
                Personal Information
              </h2>
              <p className="mt-1 text-sm text-[#6b7c93]">
                Update your personal details.
              </p>

              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-[#0f1e33]">
                      First Name
                    </label>
                    <div className="relative">
                      <User size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7c93]" />
                      <input
                        id="firstName"
                        value={profile.firstName}
                        onChange={handleProfileChange("firstName")}
                        className="w-full rounded-xl border border-[#d9e2ec] py-3 pl-10 pr-4 outline-none transition focus:border-[#1f4e79]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-[#0f1e33]">
                      Last Name
                    </label>
                    <div className="relative">
                      <User size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7c93]" />
                      <input
                        id="lastName"
                        value={profile.lastName}
                        onChange={handleProfileChange("lastName")}
                        className="w-full rounded-xl border border-[#d9e2ec] py-3 pl-10 pr-4 outline-none transition focus:border-[#1f4e79]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#0f1e33]">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7c93]" />
                      <input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={handleProfileChange("email")}
                        className="w-full rounded-xl border border-[#d9e2ec] py-3 pl-10 pr-4 outline-none transition focus:border-[#1f4e79]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="mb-2 block text-sm font-medium text-[#0f1e33]">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7c93]" />
                      <input
                        id="phone"
                        value={profile.phone}
                        onChange={handleProfileChange("phone")}
                        className="w-full rounded-xl border border-[#d9e2ec] py-3 pl-10 pr-4 outline-none transition focus:border-[#1f4e79]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="department" className="mb-2 block text-sm font-medium text-[#0f1e33]">
                    Department
                  </label>
                  <div className="relative">
                    <Building size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7c93]" />
                    <input
                      id="department"
                      value={profile.department}
                      onChange={handleProfileChange("department")}
                      className="w-full rounded-xl border border-[#d9e2ec] py-3 pl-10 pr-4 outline-none transition focus:border-[#1f4e79]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="bio" className="mb-2 block text-sm font-medium text-[#0f1e33]">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    rows="4"
                    value={profile.bio}
                    onChange={handleProfileChange("bio")}
                    className="w-full rounded-xl border border-[#d9e2ec] px-4 py-3 outline-none transition focus:border-[#1f4e79]"
                  />
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
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
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
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
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
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="w-full rounded-xl border border-[#d9e2ec] px-4 py-3 outline-none transition focus:border-[#1f4e79]"
                    />
                  </div>
                </div>
              </div>
            </section>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-xl bg-[#f36f21] px-4 py-2.5 font-medium text-white"
              >
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default OrganizerProfile;
