import { useState, useEffect } from "react";
import DashboardLayout from "../../components/dashboard/dashboard";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  Award,
  Upload,
  Save,
  Shield,
  Bell,
  Sparkles,
  CreditCard,
  Trash2,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────
const PREF_KEY = "sem_payment_prefs";

const getPaymentPreferences = () => {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const savePaymentPreferences = (prefs) => {
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
};

const clearPaymentPreferences = () => {
  localStorage.removeItem(PREF_KEY);
};

// ── tiny Switch toggle ────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
      checked ? "bg-[#1f4e79]" : "bg-gray-200"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

// ── toast replacement ─────────────────────────────────────────────────────────
const useToast = () => {
  const [msg, setMsg] = useState(null);
  const show = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 2500);
  };
  return { msg, show };
};

const EMPTY_PREFS = {
  preferredMethod: null,
  cardholderName: "",
  lastFourDigits: "",
  billingPostcode: "",
  rememberPreference: false,
};

// ── component ─────────────────────────────────────────────────────────────────
const UserProfile = () => {
  const [paymentPrefs, setPaymentPrefs] = useState(EMPTY_PREFS);
  const [hasSaved, setHasSaved] = useState(false);
  const { msg, show } = useToast();

  useEffect(() => {
    const prefs = getPaymentPreferences();
    if (prefs) {
      setPaymentPrefs(prefs);
      setHasSaved(true);
    }
  }, []);

  const handleSavePaymentPrefs = () => {
    if (paymentPrefs.rememberPreference) {
      savePaymentPreferences(paymentPrefs);
      setHasSaved(true);
      show("Payment preferences saved!");
    }
  };

  const handleClearPaymentPrefs = () => {
    clearPaymentPreferences();
    setPaymentPrefs(EMPTY_PREFS);
    setHasSaved(false);
    show("Payment preferences cleared!");
  };

  const handleSaveProfile = () => {
    show("Profile updated successfully!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Toast */}
        {msg && (
          <div className="fixed top-5 right-5 z-50 bg-[#1f4e79] text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
            {msg}
          </div>
        )}

        {/* Page Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1f4e79]">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your personal information and preferences</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="rounded-xl shadow-sm bg-white p-6 text-center lg:col-span-1">
            <div className="relative inline-block mb-4">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 mx-auto">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80"
                  alt="avatar"
                  className="h-full w-full object-cover"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#f36f21] text-white rounded-full flex items-center justify-center hover:bg-[#e05e10] transition-colors">
                <Upload size={14} />
              </button>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Student Name</h2>
            <p className="text-gray-500 mb-2">student@koi.edu.au</p>
            <span className="text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
              Student
            </span>

            <hr className="my-6 border-gray-200" />

            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Calendar size={18} className="text-[#1f4e79]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">17</p>
                  <p className="text-sm text-gray-500">Events Attended</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Award size={18} className="text-[#f36f21]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                  <p className="text-sm text-gray-500">Certificates Earned</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Sparkles size={18} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">95%</p>
                  <p className="text-sm text-gray-500">AI Match Score</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="rounded-xl shadow-sm bg-white">
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
                      <input id="firstName" defaultValue="Student" className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input id="lastName" defaultValue="Name" className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]" />
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input id="email" type="email" defaultValue="student@koi.edu.au" className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input id="phone" defaultValue="+61 400 123 456" className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]" />
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="studentId" className="text-sm font-medium text-gray-700">Student ID</label>
                    <div className="relative">
                      <GraduationCap size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input id="studentId" defaultValue="KOI2024001" readOnly className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm bg-gray-50 focus:outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="course" className="text-sm font-medium text-gray-700">Course</label>
                    <div className="relative">
                      <GraduationCap size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input id="course" defaultValue="Bachelor of Information Technology" className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Preferences */}
            <div className="rounded-xl shadow-sm bg-white">
              <div className="px-6 pt-6 pb-2">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard size={20} className="text-[#1f4e79]" />
                  Payment Preferences
                </h2>
                <p className="text-sm text-gray-500">
                  Save your payment details for faster checkout. We never store your full card number or CVV.
                </p>
              </div>
              <div className="px-6 pb-6 space-y-4 mt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Remember Payment Details</p>
                    <p className="text-sm text-gray-500">Auto-fill payment info on checkout</p>
                  </div>
                  <Toggle
                    checked={paymentPrefs.rememberPreference}
                    onChange={(checked) => setPaymentPrefs((p) => ({ ...p, rememberPreference: checked }))}
                  />
                </div>

                {paymentPrefs.rememberPreference && (
                  <>
                    <hr className="border-gray-200" />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label htmlFor="cardholderName" className="text-sm font-medium text-gray-700">Cardholder Name</label>
                        <input
                          id="cardholderName"
                          placeholder="Name on card"
                          value={paymentPrefs.cardholderName}
                          onChange={(e) => setPaymentPrefs((p) => ({ ...p, cardholderName: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="lastFour" className="text-sm font-medium text-gray-700">Card Last 4 Digits</label>
                        <input
                          id="lastFour"
                          placeholder="1234"
                          maxLength={4}
                          value={paymentPrefs.lastFourDigits}
                          onChange={(e) => setPaymentPrefs((p) => ({ ...p, lastFourDigits: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="billingPostcode" className="text-sm font-medium text-gray-700">Billing Postcode</label>
                      <input
                        id="billingPostcode"
                        placeholder="2000"
                        value={paymentPrefs.billingPostcode}
                        onChange={(e) => setPaymentPrefs((p) => ({ ...p, billingPostcode: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSavePaymentPrefs}
                        className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Save size={16} />
                        Save Preferences
                      </button>
                      {hasSaved && (
                        <button
                          onClick={handleClearPaymentPrefs}
                          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                          Clear Saved
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="rounded-xl shadow-sm bg-white">
              <div className="px-6 pt-6 pb-2">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Bell size={20} className="text-[#1f4e79]" />
                  Notification Preferences
                </h2>
                <p className="text-sm text-gray-500">Manage how you receive notifications</p>
              </div>
              <div className="px-6 pb-6 space-y-4 mt-2">
                {[
                  { label: "Event Reminders", desc: "Get reminded about upcoming events", defaultOn: true },
                  { label: "New Event Notifications", desc: "Get notified about new events matching your interests", defaultOn: true },
                  { label: "AI Recommendations", desc: "Receive personalized event recommendations", defaultOn: true },
                  { label: "Email Digest", desc: "Weekly summary of events and activities", defaultOn: false },
                ].map(({ label, desc, defaultOn }, i, arr) => {
                  const [on, setOn] = useState(defaultOn);
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{label}</p>
                          <p className="text-sm text-gray-500">{desc}</p>
                        </div>
                        <Toggle checked={on} onChange={setOn} />
                      </div>
                      {i < arr.length - 1 && <hr className="border-gray-200 mt-4" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Security Settings */}
            <div className="rounded-xl shadow-sm bg-white">
              <div className="px-6 pt-6 pb-2">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Shield size={20} className="text-[#1f4e79]" />
                  Security Settings
                </h2>
                <p className="text-sm text-gray-500">Manage your account security</p>
              </div>
              <div className="px-6 pb-6 space-y-4 mt-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">Current Password</label>
                    <input id="currentPassword" type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]" />
                  </div>
                  <div />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">New Password</label>
                    <input id="newPassword" type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input id="confirmPassword" type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveProfile}
                className="flex items-center gap-2 bg-[#f36f21] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#e05e10] transition-colors"
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
};

export default UserProfile;
