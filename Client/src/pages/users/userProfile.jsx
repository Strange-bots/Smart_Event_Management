import { useState, useEffect } from "react";
import DashboardLayout from "../../components/dashboard/dashboard";
import { getCurrentUser, setCurrentUser } from "../../utils/auth";
import {
  deleteMyPaymentPreference,
  fetchMyPaymentPreference,
  saveMyPaymentPreference,
} from "../../services/paymentPreferenceService";
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
  Sparkles,
  CreditCard,
  Trash2,
} from "lucide-react";

// ── tiny Switch toggle ────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-8 w-14 items-center rounded-full border-2 p-[3px] shadow-[0_0_0_2px_rgba(209,219,232,0.9)] transition-all focus:outline-none focus:ring-2 focus:ring-[#1f4e79]/30 ${
      checked
        ? "border-[#1f4e79] bg-[#1f4e79] shadow-[0_0_0_2px_rgba(31,78,121,0.12)]"
        : "border-[#d1dbe8] bg-[#dbe4ef]"
    }`}
  >
    <span
      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${
        checked ? "translate-x-6" : "translate-x-0"
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
  cardBrand: null,
  cardholderName: "",
  cardNumber: "",
  expiryMonth: "",
  expiryYear: "",
  cvv: "",
  lastFourDigits: "",
  billingPostcode: "",
  rememberPreference: false,
};

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "";

const EMPTY_PROFILE = {
  id: "",
  name: "",
  email: "",
  role: "",
  status: "",
  createdAt: "",
  avatar: null,
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

// ── component ─────────────────────────────────────────────────────────────────
const UserProfile = () => {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE_FORM);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [paymentPrefs, setPaymentPrefs] = useState(EMPTY_PREFS);
  const [isLoadingPaymentPrefs, setIsLoadingPaymentPrefs] = useState(true);
  const [hasSaved, setHasSaved] = useState(false);
  const [isEditingPaymentPrefs, setIsEditingPaymentPrefs] = useState(false);
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const { msg, show } = useToast();

  const currentUser = getCurrentUser();
  const profileNameParts = profile.name.trim().split(/\s+/).filter(Boolean);
  const firstName = profileNameParts[0] ?? "";
  const lastName = profileNameParts.slice(1).join(" ");
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "N/A";
  const roleLabel = profile.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : "User";

  useEffect(() => {
    let isMounted = true;

    const loadPaymentPreference = async () => {
      try {
        const savedPreference = await fetchMyPaymentPreference();

        if (!isMounted) {
          return;
        }

        if (savedPreference) {
          setPaymentPrefs({
            preferredMethod: savedPreference.preferredMethod ?? null,
            cardBrand: savedPreference.cardBrand ?? null,
            cardholderName: savedPreference.cardholderName ?? "",
            cardNumber: "",
            expiryMonth: savedPreference.expiryMonth ?? "",
            expiryYear: savedPreference.expiryYear ?? "",
            cvv: "",
            lastFourDigits: savedPreference.lastFourDigits ?? "",
            billingPostcode: savedPreference.billingPostcode ?? "",
            rememberPreference: savedPreference.rememberPreference === true,
          });
          setHasSaved(true);
          setIsEditingPaymentPrefs(false);
          return;
        }

        setPaymentPrefs(EMPTY_PREFS);
        setHasSaved(false);
        setIsEditingPaymentPrefs(true);
      } catch (error) {
        if (isMounted) {
          show(error.message || "Unable to load payment preferences.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingPaymentPrefs(false);
        }
      }
    };

    loadPaymentPreference();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!currentUser?.token) {
        if (isMounted) {
          setProfileError("You need to sign in to view your profile.");
          setIsLoadingProfile(false);
        }
        return;
      }

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

        if (isMounted) {
          const nextProfile = data.user ?? EMPTY_PROFILE;
          const nameParts = nextProfile.name?.trim().split(/\s+/).filter(Boolean) ?? [];

          setProfile(nextProfile);
          setProfileForm({
            firstName: nameParts[0] ?? "",
            lastName: nameParts.slice(1).join(" "),
            email: nextProfile.email ?? "",
            phone: nextProfile.phone ?? "",
          });
          setProfileError("");
        }
      } catch (error) {
        if (isMounted) {
          setProfileError(error.message || "Unable to load profile.");
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
  }, [currentUser?.token]);

  const handleSavePaymentPrefs = async () => {
    try {
      const savedPreference = await saveMyPaymentPreference(paymentPrefs);

      setPaymentPrefs({
        preferredMethod: savedPreference?.preferredMethod ?? null,
        cardBrand: savedPreference?.cardBrand ?? null,
        cardholderName: savedPreference?.cardholderName ?? "",
        cardNumber: "",
        expiryMonth: savedPreference?.expiryMonth ?? "",
        expiryYear: savedPreference?.expiryYear ?? "",
        cvv: "",
        lastFourDigits: savedPreference?.lastFourDigits ?? "",
        billingPostcode: savedPreference?.billingPostcode ?? "",
        rememberPreference: savedPreference?.rememberPreference === true,
      });
      setHasSaved(true);
      setIsEditingPaymentPrefs(false);
      show("Payment preferences saved securely.");
    } catch (error) {
      show(error.message || "Unable to save payment preferences.");
    }
  };

  const handleClearPaymentPrefs = async () => {
    try {
      await deleteMyPaymentPreference();
      setPaymentPrefs(EMPTY_PREFS);
      setHasSaved(false);
      setIsEditingPaymentPrefs(true);
      show("Payment preferences cleared.");
    } catch (error) {
      show(error.message || "Unable to clear payment preferences.");
    }
  };

  const handleEditSavedCard = () => {
    setIsEditingPaymentPrefs(true);
    setPaymentPrefs((prev) => ({
      ...prev,
      cardNumber: "",
      cvv: "",
    }));
  };

  const handleSaveProfile = async () => {
    if (!currentUser?.token) {
      show("You need to sign in to update your profile.");
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
      show("Profile updated successfully.");
    } catch (error) {
      show(error.message || "Unable to update profile.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentUser?.token) {
      show("You need to sign in to update your password.");
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
      show("Password updated successfully.");
    } catch (error) {
      show(error.message || "Unable to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
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
                    {(firstName[0] || profile.email[0] || "U").toUpperCase()}
                  </div>
                )}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#f36f21] text-white rounded-full flex items-center justify-center hover:bg-[#e05e10] transition-colors">
                <Upload size={14} />
              </button>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isLoadingProfile ? "Loading..." : profile.name || "Unknown User"}
            </h2>
            <p className="text-gray-500 mb-2">{profile.email || currentUser?.email || "No email"}</p>
            <span className="text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
              {roleLabel}
            </span>

            <hr className="my-6 border-gray-200" />

            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Calendar size={18} className="text-[#1f4e79]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{profile.status || "N/A"}</p>
                  <p className="text-sm text-gray-500">Account Status</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Award size={18} className="text-[#f36f21]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{profile.id || "N/A"}</p>
                  <p className="text-sm text-gray-500">User ID</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Sparkles size={18} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{memberSince}</p>
                  <p className="text-sm text-gray-500">Member Since</p>
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
                {profileError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {profileError}
                  </div>
                )}
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
                    <label htmlFor="studentId" className="text-sm font-medium text-gray-700">User ID</label>
                    <div className="relative">
                      <GraduationCap size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input id="studentId" value={profile.id} readOnly className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm bg-gray-50 focus:outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="course" className="text-sm font-medium text-gray-700">Role</label>
                    <div className="relative">
                      <GraduationCap size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input id="course" value={roleLabel} readOnly className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm bg-gray-50 focus:outline-none" />
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
            </div>

            {/* Payment Preferences */}
            <div className="rounded-xl shadow-sm bg-white">
              <div className="px-6 pt-6 pb-2">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard size={20} className="text-[#1f4e79]" />
                  Payment Preferences
                </h2>
                <p className="text-sm text-gray-500">
                  Enter full card details to update your saved payment preference. Only masked card details are stored.
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
                    onChange={(checked) => {
                      setPaymentPrefs((p) => ({ ...p, rememberPreference: checked }));
                      if (!checked) {
                        setIsEditingPaymentPrefs(true);
                      }
                    }}
                  />
                </div>

                {paymentPrefs.rememberPreference && hasSaved && !isEditingPaymentPrefs && (
                  <>
                    <hr className="border-gray-200" />
                    <div className="rounded-lg border border-[#d9e2ec] bg-[#f8fafc] p-4">
                      <p className="text-sm font-medium text-gray-900">
                        {paymentPrefs.cardholderName || "Saved Card"}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {(paymentPrefs.cardBrand || "card").toUpperCase()} ending in {paymentPrefs.lastFourDigits || "----"}
                      </p>
                      {(paymentPrefs.expiryMonth || paymentPrefs.expiryYear) && (
                        <p className="mt-1 text-sm text-gray-500">
                          Expires {paymentPrefs.expiryMonth || "--"}/{paymentPrefs.expiryYear || "----"}
                        </p>
                      )}
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={handleEditSavedCard}
                          className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Save size={16} />
                          Update Card
                        </button>
                        <button
                          onClick={handleClearPaymentPrefs}
                          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                          Delete Card
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {paymentPrefs.rememberPreference && (!hasSaved || isEditingPaymentPrefs) && (
                  <>
                    <hr className="border-gray-200" />
                    <div className="space-y-1.5">
                      <label htmlFor="preferredMethod" className="text-sm font-medium text-gray-700">Preferred Method</label>
                      <select
                        id="preferredMethod"
                        value={paymentPrefs.preferredMethod ?? ""}
                        onChange={(e) => setPaymentPrefs((p) => ({ ...p, preferredMethod: e.target.value || null }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                      >
                        <option value="">Select a payment method</option>
                        <option value="card">Card</option>
                        <option value="paypal">PayPal</option>
                        <option value="bank-transfer">Bank Transfer</option>
                      </select>
                    </div>
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
                        <label htmlFor="cardNumber" className="text-sm font-medium text-gray-700">Card Number</label>
                        <input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          inputMode="numeric"
                          maxLength={23}
                          value={paymentPrefs.cardNumber}
                          onChange={(e) =>
                            setPaymentPrefs((p) => ({
                              ...p,
                              cardNumber: e.target.value.replace(/[^\d\s]/g, ""),
                            }))
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <label htmlFor="expiryMonth" className="text-sm font-medium text-gray-700">Expiry Month</label>
                        <input
                          id="expiryMonth"
                          placeholder="MM"
                          inputMode="numeric"
                          maxLength={2}
                          value={paymentPrefs.expiryMonth}
                          onChange={(e) => setPaymentPrefs((p) => ({ ...p, expiryMonth: e.target.value.replace(/\D/g, "").slice(0, 2) }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="expiryYear" className="text-sm font-medium text-gray-700">Expiry Year</label>
                        <input
                          id="expiryYear"
                          placeholder="YYYY"
                          inputMode="numeric"
                          maxLength={4}
                          value={paymentPrefs.expiryYear}
                          onChange={(e) => setPaymentPrefs((p) => ({ ...p, expiryYear: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="cvv" className="text-sm font-medium text-gray-700">CVV</label>
                        <input
                          id="cvv"
                          placeholder="123"
                          inputMode="numeric"
                          maxLength={4}
                          value={paymentPrefs.cvv}
                          onChange={(e) => setPaymentPrefs((p) => ({ ...p, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
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
                        disabled={isLoadingPaymentPrefs}
                        className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Save size={16} />
                        {hasSaved ? "Update Card" : "Save Card"}
                      </button>
                      {hasSaved && (
                        <button
                          onClick={() => setIsEditingPaymentPrefs(false)}
                          className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      {hasSaved && (
                        <button
                          onClick={handleClearPaymentPrefs}
                          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                          Delete Card
                        </button>
                      )}
                    </div>
                  </>
                )}
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
                    <input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                    />
                  </div>
                  <div />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">New Password</label>
                    <input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleChangePassword}
                    disabled={isUpdatingPassword}
                    className="flex items-center gap-2 bg-[#f36f21] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#e05e10] transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Save size={18} />
                    {isUpdatingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserProfile;
