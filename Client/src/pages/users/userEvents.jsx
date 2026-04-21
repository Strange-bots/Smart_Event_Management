import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/dashboard/dashboard";
import { submitEventFeedback } from "../../services/feedbackService";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const sampleEvents = [
  {
    id: 1,
    registrationId: 101,
    title: "Annual Technology Summit 2024",
    description: "A full-day summit bringing together industry leaders, innovators, and students to explore the latest trends in technology.",
    date: "March 15, 2024",
    time: "9:00 AM - 5:00 PM",
    location: "Main Auditorium",
    status: "upcoming",
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=300&q=80",
    tags: ["AI", "Cloud", "Innovation"],
    capacity: 150,
    registrations: 120,
    price: 0,
    rating: null,
    hasFeedback: false,
    certificate: false,
  },
  {
    id: 102,
    registrationId: 102,
    title: "Career Networking Evening",
    description: "Meet mentors, alumni, and hiring partners across business and technology.",
    date: "May 14, 2026",
    time: "5:30 PM - 8:00 PM",
    location: "Innovation Hub",
    status: "attended",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&q=80",
    tags: ["Career", "Networking", "Mentorship"],
    capacity: 120,
    registrations: 94,
    price: 0,
    rating: 4,
    hasFeedback: true,
    certificate: true,
  },
  {
    id: 3,
    registrationId: 103,
    title: "AI & Machine Learning Seminar",
    description: "An in-depth seminar on the fundamentals and applications of AI and machine learning.",
    date: "March 25, 2024",
    time: "1:00 PM - 4:00 PM",
    location: "Lecture Hall B",
    status: "upcoming",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&q=80",
    tags: ["AI", "Machine Learning"],
    capacity: 100,
    registrations: 80,
    price: 0,
    rating: null,
    hasFeedback: false,
    certificate: false,
  },
  {
    id: 104,
    registrationId: 104,
    title: "Data Science Bootcamp",
    description: "Hands-on labs covering data wrangling, visualization, and machine learning basics.",
    date: "June 18, 2026",
    time: "11:00 AM - 3:00 PM",
    location: "Computer Lab A",
    status: "attended",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&q=80",
    tags: ["Technology", "Data", "Workshop"],
    capacity: 90,
    registrations: 58,
    price: 0,
    rating: null,
    hasFeedback: false,
    certificate: true,
  },
];

const ratingLabels = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Very Good", 5: "Excellent!" };

const UserEvents = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [userEvents, setUserEvents] = useState(sampleEvents);
  const [activeTab, setActiveTab] = useState("upcoming");

  // Details modal
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Cancel dialog
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [eventToCancel, setEventToCancel] = useState(null);

  // Feedback modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackEvent, setFeedbackEvent] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  const handleCancelClick = (event) => {
    setEventToCancel(event);
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    if (eventToCancel) {
      setUserEvents((prev) =>
        prev.filter((e) => e.registrationId !== eventToCancel.registrationId)
      );
      alert(`Registration for "${eventToCancel.title}" has been cancelled.`);
      setShowCancelDialog(false);
      setEventToCancel(null);
    }
  };

  const handleDownloadCertificate = (event) => {
    alert(`Certificate for "${event.title}" downloaded!`);
  };

  const handleOpenFeedback = (event) => {
    setFeedbackEvent(event);
    setFeedbackRating(event.rating || 0);
    setFeedbackComment("");
    setIsAnonymous(false);
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackEvent) return;
    if (feedbackRating === 0) {
      alert("Please select a rating");
      return;
    }

    try {
      setIsSubmittingFeedback(true);

      await submitEventFeedback({
        eventId: feedbackEvent.id,
        rating: feedbackRating,
        comment: feedbackComment,
        isAnonymous,
      });

      setUserEvents((prev) =>
        prev.map((e) =>
          e.id === feedbackEvent.id
            ? { ...e, rating: feedbackRating, hasFeedback: true }
            : e
        )
      );
      alert("Thank you for your feedback!");
      setShowFeedbackModal(false);
      setFeedbackEvent(null);
      setFeedbackRating(0);
      setFeedbackComment("");
      setIsAnonymous(false);
    } catch (error) {
      alert(error.message || "Unable to submit feedback right now.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const filteredUpcoming = userEvents.filter(
    (e) =>
      e.status === "upcoming" &&
      e.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredAttended = userEvents.filter(
    (e) =>
      e.status === "attended" &&
      e.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const EventCard = ({ event, showRating = false }) => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex">
        <img
          src={event.image}
          alt={event.title}
          className="w-32 h-full object-cover hidden sm:block shrink-0"
        />
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2 gap-2">
            <h3 className="font-semibold text-gray-900">{event.title}</h3>
            {event.status === "upcoming" ? (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full shrink-0">
                Upcoming
              </span>
            ) : event.status === "cancelled" ? (
              <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full shrink-0">
                Cancelled
              </span>
            ) : (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full shrink-0">
                ✔ Attended
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-sm text-gray-500 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[#f36f21]">📅</span>
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#f36f21]">🕐</span>
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#f36f21]">📍</span>
              <span>{event.location}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              className="flex items-center gap-1 border border-gray-300 text-gray-700 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => handleViewDetails(event)}
            >
              👁 View Details
            </button>

            {event.status === "upcoming" && (
              <button
                className="flex items-center gap-1 bg-red-500 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                onClick={() => handleCancelClick(event)}
              >
                ✕ Cancel Registration
              </button>
            )}

            {showRating && event.status === "attended" && (
              <>
                {event.hasFeedback ? (
                  <div className="flex items-center gap-1 text-sm">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={
                          i < (event.rating || 0)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }
                      >
                        ★
                      </span>
                    ))}
                    <span className="text-gray-500 ml-1 text-xs">Your rating</span>
                  </div>
                ) : (
                  <button
                    className="flex items-center gap-1 border border-gray-300 text-gray-700 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => handleOpenFeedback(event)}
                  >
                    💬 Leave Feedback
                  </button>
                )}
                {event.certificate && (
                  <button
                    className="flex items-center gap-1 bg-[#f36f21] text-white text-sm px-3 py-1.5 rounded-lg hover:bg-[#e05e10] transition-colors"
                    onClick={() => handleDownloadCertificate(event)}
                  >
                    ⬇ Certificate
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1f4e79]">
            My Events
          </h1>
          <p className="text-gray-500 mt-1">
            View your registered and attended events
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="relative max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search your events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f4e79]/30 text-sm"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="space-y-6">
          <div className="flex gap-1 bg-white border rounded-xl p-1 w-fit shadow-sm">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === "upcoming"
                  ? "bg-[#1f4e79] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              📅 Upcoming ({filteredUpcoming.length})
            </button>
            <button
              onClick={() => setActiveTab("attended")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === "attended"
                  ? "bg-[#1f4e79] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              ✔ Attended ({filteredAttended.length})
            </button>
          </div>

          {/* Upcoming Tab */}
          {activeTab === "upcoming" && (
            <div className="space-y-4">
              {filteredUpcoming.length > 0 ? (
                filteredUpcoming.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <div className="text-5xl mb-4 opacity-40">📅</div>
                  <h3 className="font-semibold text-gray-900 mb-2">No upcoming events</h3>
                  <p className="text-gray-500 mb-4">
                    Browse available events and register for ones that interest you!
                  </p>
                  <button
                    className="bg-[#f36f21] text-white px-4 py-2 rounded-lg hover:bg-[#e05e10] transition-colors"
                    onClick={() => navigate("/browseEvents")}
                  >
                    Browse Events
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Attended Tab */}
          {activeTab === "attended" && (
            <div className="space-y-4">
              {filteredAttended.length > 0 ? (
                filteredAttended.map((event) => (
                  <EventCard key={event.id} event={event} showRating />
                ))
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <div className="text-5xl mb-4 opacity-40">✔</div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    No attended events yet
                  </h3>
                  <p className="text-gray-500">
                    Events you've attended will appear here
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      {showDetailsModal && selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-xl font-bold text-gray-900">Event Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-6">
              <div className="aspect-video rounded-lg overflow-hidden">
                <img
                  src={selectedEvent.image}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h2 className="text-xl font-bold text-gray-900">{selectedEvent.title}</h2>
                  {selectedEvent.status === "upcoming" ? (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                      Upcoming
                    </span>
                  ) : (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                      Attended
                    </span>
                  )}
                </div>
                <p className="text-gray-500">{selectedEvent.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[#f36f21]">📅</span>
                  <span>{selectedEvent.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#f36f21]">🕐</span>
                  <span>{selectedEvent.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#f36f21]">📍</span>
                  <span>{selectedEvent.location}</span>
                </div>
                {selectedEvent.capacity && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#f36f21]">👥</span>
                    <span>
                      {selectedEvent.registrations} / {selectedEvent.capacity}
                    </span>
                  </div>
                )}
                {selectedEvent.price !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#f36f21]">💲</span>
                    <span>
                      {selectedEvent.price > 0
                        ? `$${selectedEvent.price}`
                        : "Free"}
                    </span>
                  </div>
                )}
              </div>

              {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-orange-50 text-[#f36f21] text-xs px-2 py-1 rounded-full"
                    >
                      🏷 {tag}
                    </span>
                  ))}
                </div>
              )}

              {selectedEvent.status === "upcoming" && (
                <button
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleCancelClick(selectedEvent);
                  }}
                >
                  ✕ Cancel Registration
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && eventToCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowCancelDialog(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900">Cancel Registration?</h2>
            <p className="text-gray-500 text-sm">
              Are you sure you want to cancel your registration for "
              {eventToCancel.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                onClick={() => setShowCancelDialog(false)}
              >
                Keep Registration
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                onClick={handleConfirmCancel}
              >
                Yes, Cancel Registration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && feedbackEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowFeedbackModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                💬 Leave Feedback
              </h2>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Event</p>
              <p className="font-medium text-gray-900">{feedbackEvent.title}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Your Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110 text-2xl"
                  >
                    <span
                      className={
                        star <= (hoverRating || feedbackRating)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }
                    >
                      ★
                    </span>
                  </button>
                ))}
                {feedbackRating > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    {ratingLabels[feedbackRating]}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="feedback-comment"
                className="text-sm font-medium text-gray-700"
              >
                Comments (Optional)
              </label>
              <textarea
                id="feedback-comment"
                placeholder="Share your thoughts about this event..."
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]/30 resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 accent-[#1f4e79] cursor-pointer"
              />
              <label
                htmlFor="anonymous"
                className="text-sm text-gray-600 cursor-pointer"
              >
                Submit anonymously
              </label>
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                onClick={() => setShowFeedbackModal(false)}
                disabled={isSubmittingFeedback}
              >
                Cancel
              </button>
              <button
                className="bg-[#f36f21] text-white px-4 py-2 rounded-lg hover:bg-[#e05e10] transition-colors text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70"
                onClick={handleSubmitFeedback}
                disabled={isSubmittingFeedback}
              >
                {isSubmittingFeedback ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default UserEvents;
