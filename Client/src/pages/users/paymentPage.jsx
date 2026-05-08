import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/dashboard/dashboard";
import {
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  CreditCard,
  ExternalLink,
  Lock,
  MapPin,
} from "lucide-react";
import { fetchEventById } from "../../services/eventService.js";
import {
  confirmStripeCheckoutSession,
  createStripeCheckoutSession,
} from "../../services/paymentService.js";
import { getCurrentUser } from "../../utils/auth.js";

const formatEventDate = (dateString) => {
  if (!dateString) {
    return "Date to be announced";
  }

  const parsedDate = new Date(dateString);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
};

const useToast = () => {
  const [toast, setToast] = useState(null);

  const show = (text, type = "success") => {
    setToast({ text, type });
    window.setTimeout(() => setToast(null), 2500);
  };

  return { toast, show };
};

const PaymentPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const eventId = searchParams.get("eventId") || "";
  const checkoutStatus = searchParams.get("checkout") || "";
  const sessionId = searchParams.get("session_id") || "";

  const [event, setEvent] = useState(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [eventError, setEventError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [acceptedBookingTerms, setAcceptedBookingTerms] = useState(false);
  const { toast, show } = useToast();
  const hasConfirmedSessionRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const loadEvent = async () => {
      try {
        setIsLoadingEvent(true);
        const serverEvent = await fetchEventById(eventId);

        if (!isMounted) {
          return;
        }

        if (!serverEvent) {
          setEvent(null);
          setEventError("The event you're trying to pay for doesn't exist.");
          return;
        }

        setEvent({
          ...serverEvent,
          date: formatEventDate(serverEvent.date),
          venue: serverEvent.venue || serverEvent.location,
          price: Number(serverEvent.price || 0),
          image: serverEvent.image || serverEvent.imagePreview,
        });
        setEventError("");
      } catch (error) {
        if (isMounted) {
          setEvent(null);
          setEventError(error.message || "Unable to load this event right now.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingEvent(false);
        }
      }
    };

    loadEvent();

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  useEffect(() => {
    if (checkoutStatus !== "cancel") {
      return;
    }

    setPaymentError("Stripe checkout was cancelled. Your registration has not been completed.");
  }, [checkoutStatus]);

  useEffect(() => {
    if (checkoutStatus !== "success" || !sessionId || hasConfirmedSessionRef.current) {
      return;
    }

    hasConfirmedSessionRef.current = true;
    let isMounted = true;

    const confirmSession = async () => {
      try {
        setIsConfirming(true);
        setPaymentError("");
        const result = await confirmStripeCheckoutSession(sessionId);

        if (!isMounted) {
          return;
        }

        setReceipt(result.receipt || null);
        setIsComplete(true);
        show("Payment confirmed. Your registration is complete.");

        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("checkout");
        nextParams.delete("session_id");
        setSearchParams(nextParams, { replace: true });
      } catch (error) {
        if (isMounted) {
          setPaymentError(error.message || "Payment was received, but confirmation could not be completed.");
        }
      } finally {
        if (isMounted) {
          setIsConfirming(false);
        }
      }
    };

    confirmSession();

    return () => {
      isMounted = false;
    };
  }, [checkoutStatus, searchParams, sessionId, setSearchParams, show]);

  const handleStripeCheckout = async () => {
    if (!event) {
      return;
    }

    if (!acceptedBookingTerms) {
      setPaymentError(
        "You must acknowledge the booking payment terms before proceeding to Stripe.",
      );
      return;
    }

    try {
      setIsRedirecting(true);
      setPaymentError("");
      const result = await createStripeCheckoutSession(event.id);

      if (!result?.checkoutUrl) {
        throw new Error("Stripe checkout URL was not returned by the server.");
      }

      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setIsRedirecting(false);
      show(error.message || "Unable to start Stripe checkout right now.", "error");
    }
  };

  if (isLoadingEvent) {
    return (
      <DashboardLayout>
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <h3 className="mb-2 font-semibold text-gray-900">Loading event...</h3>
          <p className="text-gray-500">Fetching the latest event details from the server.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout>
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="mb-2 font-semibold text-gray-900">Event not found</h3>
          <p className="mb-4 text-gray-500">
            {eventError || "The event you're trying to pay for doesn't exist."}
          </p>
          <button
            onClick={() => navigate("/browseEvents")}
            className="rounded-lg bg-[#f36f21] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#e05e10]"
          >
            Browse Events
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (isComplete) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="text-green-600" size={40} />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Payment Successful</h2>
            <p className="mb-6 text-gray-500">
              Your registration for {event.title} has been confirmed.
            </p>

            <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-6 text-left">
              <p className="mb-1 text-center text-sm text-gray-500">Receipt ID</p>
              <p className="mb-4 text-center font-mono text-xl font-bold text-gray-900">
                {receipt?.receiptId || "Pending"}
              </p>
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

            <span className="mb-6 inline-block rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
              Receipt recorded for {currentUser?.email || "your account"}
            </span>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => navigate("/userPayments")}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                View Receipts
              </button>
              <button
                onClick={() => navigate("/userEvents")}
                className="rounded-lg bg-[#f36f21] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#e05e10]"
              >
                My Events
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {toast && (
        <div
          className={`fixed right-5 top-5 z-50 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg ${
            toast.type === "error" ? "bg-red-500" : "bg-[#1f4e79]"
          }`}
        >
          {toast.text}
        </div>
      )}

      <div className="mx-auto max-w-4xl">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="rounded-xl bg-white shadow-lg">
              <div className="px-6 pb-2 pt-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Lock size={20} className="text-green-600" />
                  Secure Stripe Checkout
                </h2>
                <p className="text-sm text-gray-500">
                  Card entry is handled on Stripe&apos;s hosted payment page. Your app account
                  never stores the full card details used for this purchase.
                </p>
              </div>

              <div className="mt-4 space-y-6 px-6 pb-6">
                <div className="rounded-xl border border-[#dbe4ef] bg-[#f7fafc] p-5">
                  <div className="flex items-start gap-3">
                    <CreditCard size={20} className="mt-0.5 text-[#1f4e79]" />
                    <div>
                      <h3 className="font-semibold text-gray-900">What happens next</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        You&apos;ll be redirected to Stripe to complete the payment for this event.
                        After Stripe confirms the payment, your registration will be recorded
                        automatically in Smart Events.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <h3 className="font-semibold text-amber-900">Booking Payment Terms</h3>
                  <p className="mt-2 text-sm leading-6 text-amber-900/80">
                    Booking payments are generally non-refundable unless there is a
                    reasonable issue that is reviewed and confirmed through Student
                    Services.
                  </p>
                  <label className="mt-4 flex items-start gap-3 text-sm text-amber-900">
                    <input
                      type="checkbox"
                      checked={acceptedBookingTerms}
                      onChange={(event) =>
                        setAcceptedBookingTerms(event.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-amber-300 text-[#1f4e79] focus:ring-[#1f4e79]"
                    />
                    <span>
                      I understand that this booking payment will not be refunded
                      unless there is a reasonable issue confirmed through Student
                      Services.
                    </span>
                  </label>
                </div>

                {paymentError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {paymentError}
                  </div>
                ) : null}

                {isConfirming ? (
                  <div className="rounded-xl border border-[#dbe4ef] bg-white p-4 text-sm text-gray-600">
                    Confirming your Stripe payment and finalising the registration...
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleStripeCheckout}
                  disabled={isRedirecting || isConfirming}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#f36f21] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#e05e10] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRedirecting ? (
                    "Redirecting to Stripe..."
                  ) : (
                    <>
                      <ExternalLink size={18} />
                      Pay ${event.price.toFixed(2)} with Stripe
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-xl bg-white shadow-lg">
              <div className="px-6 pb-2 pt-6">
                <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
              </div>
              <div className="mt-2 space-y-4 px-6 pb-6">
                <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
                  <img src={event.image} alt={event.title} className="h-full w-full object-cover" />
                </div>

                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">{event.title}</h3>
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

                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-green-600">${event.price.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Lock size={12} />
                  <span>Protected by Stripe Checkout and server-side registration confirmation</span>
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
