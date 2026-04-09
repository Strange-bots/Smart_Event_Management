import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/dashboard/dashboard";
import {
  CreditCard,
  Calendar,
  MapPin,
  Clock,
  Lock,
  CheckCircle,
  AlertCircle,
  Trash2,
} from "lucide-react";

// ── payment preferences (localStorage) ───────────────────────────────────────
const PREF_KEY = "sem_payment_prefs";
const getPaymentPreferences = () => {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const savePaymentPreferences = (prefs) => localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
const clearPaymentPreferences = () => localStorage.removeItem(PREF_KEY);

// ── mock event store ──────────────────────────────────────────────────────────
const MOCK_EVENTS = [
  {
    id: 1,
    title: "Annual Technology Summit 2024",
    date: "March 15, 2024",
    time: "9:00 AM – 5:00 PM",
    venue: "Main Auditorium",
    price: 50.0,
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&q=80",
  },
  {
    id: 2,
    title: "Business Analytics Workshop",
    date: "March 20, 2024",
    time: "10:00 AM – 2:00 PM",
    venue: "Room 301",
    price: 30.0,
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80",
  },
  {
    id: 3,
    title: "AI & Machine Learning Seminar",
    date: "March 25, 2024",
    time: "2:00 PM – 6:00 PM",
    venue: "Lecture Hall B",
    price: 75.0,
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80",
  },
];

const getEventById = (id) => MOCK_EVENTS.find((e) => e.id === id) || null;

const generateReceiptId = () =>
  `RCP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`;

// ── toast ─────────────────────────────────────────────────────────────────────
const useToast = () => {
  const [toast, setToast] = useState(null);
  const show = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 2500);
  };
  return { toast, show };
};

// ── toggle switch ─────────────────────────────────────────────────────────────
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

// ── component ─────────────────────────────────────────────────────────────────
const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const eventId = parseInt(searchParams.get("eventId") || "0");
  const event = getEventById(eventId);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [receiptId, setReceiptId] = useState("");
  const [hasSavedPrefs, setHasSavedPrefs] = useState(!!getPaymentPreferences());
  const { toast, show } = useToast();

  // Payment form state
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [billingPostcode, setBillingPostcode] = useState("");
  const [rememberPreference, setRememberPreference] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const prefs = getPaymentPreferences();
    if (prefs) {
      setCardholderName(prefs.cardholderName || "");
      setBillingPostcode(prefs.billingPostcode || "");
      setRememberPreference(prefs.rememberPreference || false);
      if (prefs.lastFourDigits) {
        setCardNumber(`**** **** **** ${prefs.lastFourDigits}`);
      }
    }
  }, []);

  const handleClearPreferences = () => {
    clearPaymentPreferences();
    setCardholderName("");
    setCardNumber("");
    setBillingPostcode("");
    setRememberPreference(false);
    setHasSavedPrefs(false);
    show("Saved payment preferences cleared");
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!event) return;

    if (!cardholderName || !cardNumber || !expiryDate || !cvv || !billingPostcode) {
      show("Please fill in all payment details", "error");
      return;
    }

    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (rememberPreference) {
      const clean = cardNumber.replace(/\s/g, "");
      savePaymentPreferences({
        preferredMethod: "card",
        cardholderName,
        lastFourDigits: clean.slice(-4),
        billingPostcode,
        rememberPreference: true,
      });
      setHasSavedPrefs(true);
    }

    const newReceiptId = generateReceiptId();
    setReceiptId(newReceiptId);
    setIsProcessing(false);
    setIsComplete(true);
    show("Payment successful! Receipt emailed to you.");
  };

  // ── event not found ───────────────────────────────────────────────────────
  if (!event) {
    return (
      <DashboardLayout>
        <div className="rounded-xl shadow-sm bg-white p-12 text-center">
          <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Event not found</h3>
          <p className="text-gray-500 mb-4">The event you're trying to pay for doesn't exist.</p>
          <button
            onClick={() => navigate("/browseEvents")}
            className="bg-[#f36f21] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#e05e10] transition-colors"
          >
            Browse Events
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // ── success screen ────────────────────────────────────────────────────────
  if (isComplete) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="rounded-xl shadow-lg bg-white p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-600" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-500 mb-6">
              Your registration for {event.title} has been confirmed.
            </p>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 mb-6 text-left">
              <p className="text-sm text-gray-500 mb-1 text-center">Receipt ID</p>
              <p className="font-mono text-xl font-bold text-gray-900 mb-4 text-center">{receiptId}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Event</p>
                  <p className="font-medium text-gray-900">{event.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">Amount Paid</p>
                  <p className="font-bold text-green-600">${event.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">{event.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">Location</p>
                  <p className="font-medium text-gray-900">{event.venue}</p>
                </div>
              </div>
            </div>

            <span className="inline-block bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full mb-6">
              ✉️ Receipt emailed to student@koi.edu.au
            </span>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate("/userPayments")}
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                View Receipts
              </button>
              <button
                onClick={() => navigate("/userEvents")}
                className="bg-[#f36f21] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[#e05e10] transition-colors"
              >
                My Events
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── payment form ──────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg ${
            toast.type === "error" ? "bg-red-500" : "bg-[#1f4e79]"
          }`}
        >
          {toast.text}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Payment Form */}
          <div className="lg:col-span-3">
            <div className="rounded-xl shadow-lg bg-white">
              <div className="px-6 pt-6 pb-2">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Lock size={20} className="text-green-600" />
                  Secure Payment
                </h2>
                <p className="text-sm text-gray-500">Your payment information is encrypted and secure</p>
              </div>

              <form onSubmit={handlePayment} className="px-6 pb-6 mt-4 space-y-6">
                <div className="space-y-4">
                  {/* Cardholder Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="cardholderName" className="text-sm font-medium text-gray-700">
                      Cardholder Name
                    </label>
                    <input
                      id="cardholderName"
                      placeholder="Name on card"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                    />
                  </div>

                  {/* Card Number */}
                  <div className="space-y-1.5">
                    <label htmlFor="cardNumber" className="text-sm font-medium text-gray-700">
                      Card Number
                    </label>
                    <div className="relative">
                      <CreditCard
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        required
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                      />
                    </div>
                  </div>

                  {/* Expiry + CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="expiryDate" className="text-sm font-medium text-gray-700">
                        Expiry Date
                      </label>
                      <input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="cvv" className="text-sm font-medium text-gray-700">
                        CVV
                      </label>
                      <input
                        id="cvv"
                        placeholder="123"
                        type="password"
                        maxLength={4}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                      />
                    </div>
                  </div>

                  {/* Billing Postcode */}
                  <div className="space-y-1.5">
                    <label htmlFor="billingPostcode" className="text-sm font-medium text-gray-700">
                      Billing Postcode
                    </label>
                    <input
                      id="billingPostcode"
                      placeholder="2000"
                      value={billingPostcode}
                      onChange={(e) => setBillingPostcode(e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                    />
                  </div>
                </div>

                <hr className="border-gray-200" />

                {/* Save preferences */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Toggle checked={rememberPreference} onChange={setRememberPreference} />
                    <label className="text-sm font-medium text-gray-700 cursor-pointer">
                      Save payment preferences
                    </label>
                  </div>
                  {hasSavedPrefs && (
                    <button
                      type="button"
                      onClick={handleClearPreferences}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={14} />
                      Clear Saved
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 bg-[#f36f21] text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-[#e05e10] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    "Processing..."
                  ) : (
                    <>
                      <Lock size={18} />
                      Pay ${event.price.toFixed(2)}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="rounded-xl shadow-lg bg-white sticky top-24">
              <div className="px-6 pt-6 pb-2">
                <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
              </div>
              <div className="px-6 pb-6 mt-2 space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-[#f36f21]" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-[#f36f21]" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-[#f36f21]" />
                      <span>{event.venue}</span>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-200" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Event Registration</span>
                    <span className="text-gray-900">${event.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Processing Fee</span>
                    <span className="text-gray-900">$0.00</span>
                  </div>
                </div>

                <hr className="border-gray-200" />

                <div className="flex justify-between font-semibold text-lg">
                  <span className="text-gray-900">Total</span>
                  <span className="text-green-600">${event.price.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Lock size={12} />
                  <span>Secured by 256-bit SSL encryption</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentPage;
