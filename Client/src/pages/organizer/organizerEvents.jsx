import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  Copy,
  DollarSign,
  Edit,
  Eye,
  Mail,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import DashboardLayout from "../../components/dashboard/dashboard.jsx";
import {
  deleteOrganizerEvent,
  duplicateOrganizerEvent,
  fetchOrganizerEvents,
  updateOrganizerEvent,
} from "../../services/organizerEventService.js";

const EMAIL_LOG_STORAGE_KEY = "smart_event_organizer_email_logs";
const NOTIFICATION_STORAGE_KEY = "smart_event_notifications";

const aiTemplates = (event) => [
  {
    type: "Reminder",
    subject: `Reminder: ${event.title} is coming up!`,
    body: `Dear Attendee,\n\nThis is a friendly reminder that "${event.title}" is scheduled for ${event.dateLabel || event.date} at ${event.time}.\n\nLocation: ${event.venue}\n\nPlease arrive 10 minutes early. We look forward to seeing you there.\n\nBest regards,\nEvent Organizer Team`,
  },
  {
    type: "Update",
    subject: `Important Update: ${event.title}`,
    body: `Dear Attendee,\n\nWe wanted to share an important update regarding "${event.title}".\n\n[Add your update details here]\n\nIf you have questions, please reply to this message.\n\nBest regards,\nEvent Organizer Team`,
  },
  {
    type: "Thank You",
    subject: `Thank you for attending ${event.title}!`,
    body: `Dear Attendee,\n\nThank you for attending "${event.title}". We hope you found it valuable and enjoyable.\n\nWe would love your feedback and hope to see you again at future events.\n\nBest regards,\nEvent Organizer Team`,
  },
];

const cn = (...classes) => classes.filter(Boolean).join(" ");

const normalizeSearchValue = (value) => String(value || "").toLowerCase();

const getEventSearchText = (event) =>
  [
    event.title,
    event.description,
    event.category,
    event.venue,
    event.location,
    event.status,
    event.date,
    event.dateLabel,
    event.time,
    event.isPaid ? "paid" : "free",
    event.price,
    ...(event.tags || []),
  ]
    .map(normalizeSearchValue)
    .join(" ");

function getStatusBadge(status) {
  switch (status) {
    case "approved":
      return { label: "Approved", className: "bg-green-100 text-green-700" };
    case "pending":
      return { label: "Pending", className: "bg-yellow-100 text-yellow-700" };
    case "rejected":
      return { label: "Rejected", className: "bg-red-100 text-red-700" };
    default:
      return { label: status, className: "bg-slate-100 text-slate-700" };
  }
}

function getAudienceRecipients(event, audience) {
  const totalRegistrations = Number(event.registrations || 0);

  if (audience === "paid") {
    return Math.max(0, Math.floor(totalRegistrations * 0.6));
  }

  if (audience === "cancelled") {
    return Math.max(0, Math.floor(totalRegistrations * 0.15));
  }

  return totalRegistrations;
}

function OrganizerEvents() {
  const storedUser = window.localStorage.getItem("smart_event_user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [emailAudience, setEmailAudience] = useState("all");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [notice, setNotice] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "organizer") {
      return undefined;
    }

    let isMounted = true;

    const loadEvents = async () => {
      setIsLoadingEvents(true);

      try {
        const organizerEvents = await fetchOrganizerEvents();

        if (!isMounted) {
          return;
        }

        setEvents(
          organizerEvents.map((event) => ({
            ...event,
            imagePreview:
              event.imagePreview ||
              "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
            registrations: Number(event.registrations || 0),
            capacity: Number(event.capacity || 0),
          })),
        );
        setNotice(null);
      } catch (error) {
        if (isMounted) {
          setNotice({ type: "error", message: error.message || "Unable to load events." });
        }
      } finally {
        if (isMounted) {
          setIsLoadingEvents(false);
        }
      }
    };

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.email, currentUser?.role]);

  const filteredEvents = useMemo(
    () => {
      const normalizedSearch = normalizeSearchValue(searchQuery).trim();

      return events.filter((event) => {
        const matchesSearch =
          !normalizedSearch ||
          getEventSearchText(event).includes(normalizedSearch);
        const matchesStatus =
          statusFilter === "all" || event.status === statusFilter;
        return matchesSearch && matchesStatus;
      });
    },
    [events, searchQuery, statusFilter],
  );

  if (!currentUser || currentUser.role !== "organizer") {
    return <Navigate to="/login" replace />;
  }

  const setSuccess = (message) => setNotice({ type: "success", message });
  const setError = (message) => setNotice({ type: "error", message });

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
    setActiveMenuId(null);
  };

  const handleOpenEmail = (event) => {
    setSelectedEvent(event);
    setEmailAudience("all");
    setEmailSubject("");
    setEmailBody("");
    setShowEmailModal(true);
    setShowDetailsModal(false);
    setActiveMenuId(null);
  };

  const handleDuplicate = async (event) => {
    try {
      const duplicatedEvent = await duplicateOrganizerEvent(event.id);
      setEvents((currentEvents) => [
        {
          ...duplicatedEvent,
          imagePreview:
            duplicatedEvent.imagePreview ||
            "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
          registrations: Number(duplicatedEvent.registrations || 0),
          capacity: Number(duplicatedEvent.capacity || 0),
        },
        ...currentEvents,
      ]);
      setSuccess(`Event "${event.title}" duplicated successfully.`);
    } catch (error) {
      setError(error.message || "Unable to duplicate event.");
    } finally {
      setActiveMenuId(null);
    }
  };

  const handleDelete = (event) => {
    setEventToDelete(event);
    setShowDeleteDialog(true);
    setActiveMenuId(null);
  };

  const handleEditEvent = async (event) => {
    const nextTitle = window.prompt("Update event title", event.title);

    if (nextTitle === null) {
      setActiveMenuId(null);
      return;
    }

    const nextDescription = window.prompt(
      "Update event description",
      event.description,
    );

    if (nextDescription === null) {
      setActiveMenuId(null);
      return;
    }

    try {
      const updatedEvent = await updateOrganizerEvent(event.id, {
        ...event,
        title: nextTitle,
        description: nextDescription,
      });

      setEvents((currentEvents) =>
        currentEvents.map((item) =>
          item.id === updatedEvent.id
            ? {
                ...updatedEvent,
                imagePreview:
                  updatedEvent.imagePreview ||
                  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
                registrations: Number(updatedEvent.registrations || 0),
                capacity: Number(updatedEvent.capacity || 0),
              }
            : item,
        ),
      );
      setSelectedEvent((currentEvent) =>
        currentEvent?.id === updatedEvent.id ? updatedEvent : currentEvent,
      );
      setSuccess(`Event "${updatedEvent.title}" updated successfully.`);
    } catch (error) {
      setError(error.message || "Unable to update event.");
    } finally {
      setActiveMenuId(null);
    }
  };

  const confirmDelete = async () => {
    if (!eventToDelete) {
      return;
    }

    try {
      await deleteOrganizerEvent(eventToDelete.id);
      setEvents((currentEvents) =>
        currentEvents.filter((event) => event.id !== eventToDelete.id),
      );
      setSuccess(`Event "${eventToDelete.title}" deleted successfully.`);
      setShowDeleteDialog(false);
      setEventToDelete(null);
      if (selectedEvent?.id === eventToDelete.id) {
        setSelectedEvent(null);
        setShowDetailsModal(false);
      }
    } catch (error) {
      setError(error.message || "Unable to delete event.");
    }
  };

  const handleSelectTemplate = (template) => {
    setEmailSubject(template.subject);
    setEmailBody(template.body);
  };

  const handleSendEmail = async () => {
    if (!selectedEvent || !emailSubject.trim() || !emailBody.trim()) {
      setError("Please fill in both the subject and the message.");
      return;
    }

    setIsSending(true);
    await new Promise((resolve) => window.setTimeout(resolve, 1200));

    const recipientCount = getAudienceRecipients(selectedEvent, emailAudience);
    const nextEmailLog = {
      id: `email-${Date.now()}`,
      organizerEmail: currentUser.email,
      organizerId: currentUser.id,
      eventId: selectedEvent.id,
      eventTitle: selectedEvent.title,
      audience: emailAudience,
      subject: emailSubject.trim(),
      body: emailBody.trim(),
      sentAt: new Intl.DateTimeFormat("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date()),
      recipientCount,
    };

    const storedEmailLogs = JSON.parse(
      window.localStorage.getItem(EMAIL_LOG_STORAGE_KEY) || "[]",
    );
    window.localStorage.setItem(
      EMAIL_LOG_STORAGE_KEY,
      JSON.stringify([nextEmailLog, ...storedEmailLogs]),
    );

    const storedNotifications = JSON.parse(
      window.localStorage.getItem(NOTIFICATION_STORAGE_KEY) || "[]",
    );
    const nextNotification = {
      id: `notification-${Date.now()}`,
      type: "organizer",
      title: emailSubject.trim(),
      message: `${emailBody.trim().slice(0, 180)}${emailBody.trim().length > 180 ? "..." : ""}`,
      date: new Intl.DateTimeFormat("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
      isRead: false,
      eventId: selectedEvent.id,
      from: "Event Organizer",
      audience: emailAudience,
    };
    window.localStorage.setItem(
      NOTIFICATION_STORAGE_KEY,
      JSON.stringify([nextNotification, ...storedNotifications]),
    );

    setIsSending(false);
    setShowEmailModal(false);
    setSuccess(`Email sent to ${recipientCount} recipient(s).`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0f1e33]">My Events</h1>
            <p className="mt-2 text-[#6b7c93]">
              View and manage all your created events.
            </p>
          </div>
          <Link
            to="/organizer/create"
            className="inline-flex items-center gap-2 rounded-xl bg-[#f36f21] px-4 py-2.5 font-medium text-white transition hover:bg-[#d95e17]"
          >
            <Plus size={18} />
            Create New Event
          </Link>
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

        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7c93]"
              />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search events..."
                className="w-full rounded-xl border border-[#d9e2ec] py-3 pl-10 pr-4 outline-none transition focus:border-[#1f4e79]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {["all", "approved", "pending", "rejected"].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={cn(
                    "rounded-xl px-4 py-2 text-sm font-medium transition",
                    statusFilter === filter
                      ? "bg-[#1f4e79] text-white"
                      : "border border-[#d9e2ec] bg-white text-[#0f1e33]",
                  )}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {isLoadingEvents ? (
          <section className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <Calendar size={48} className="mx-auto text-[#9aa9bc]" />
            <h3 className="mt-4 text-xl font-semibold text-[#0f1e33]">
              Loading events...
            </h3>
            <p className="mt-2 text-[#6b7c93]">
              Fetching your organizer-owned events from the server.
            </p>
          </section>
        ) : null}

        {!isLoadingEvents ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map((event) => {
            const status = getStatusBadge(event.status);
            const progress =
              event.capacity > 0
                ? Math.min(100, (event.registrations / event.capacity) * 100)
                : 0;

            return (
              <section
                key={event.id}
                className="group relative overflow-hidden rounded-[1.35rem] border border-[#d9e2ec] bg-[#f8fafc] shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-xl sm:min-h-[13.25rem] sm:bg-[#0f1e33]"
              >
                <div className="absolute inset-0 hidden bg-[#f8fafc] sm:block" />

                <div className="relative h-44 overflow-hidden sm:absolute sm:inset-0 sm:z-30 sm:h-auto">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07111f]/85 via-[#07111f]/30 to-transparent transition duration-500 group-hover:opacity-0 sm:block" />
                  <img
                    src={event.imagePreview}
                    alt={event.title}
                    className="h-full w-full object-cover transition-all duration-700 ease-out sm:group-hover:w-[34%] sm:group-hover:translate-x-0 sm:group-hover:scale-105 sm:group-hover:w-[32%] xl:group-hover:w-[30%]"
                  />
                </div>

                <div className="absolute inset-x-0 bottom-0 z-10 hidden p-3.5 text-white transition duration-500 sm:block sm:p-4 sm:group-hover:translate-y-2 sm:group-hover:opacity-0">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-semibold backdrop-blur",
                        status.className,
                      )}
                    >
                      {status.label}
                    </span>
                    <span className="rounded-full bg-black/35 px-2.5 py-1 text-[0.68rem] font-medium text-white">
                      {event.isPaid ? `$${Number(event.price || 0).toFixed(2)}` : "Free"}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold leading-tight sm:text-[1.2rem]">
                    {event.title}
                  </h3>
                  <p className="mt-1 text-[0.68rem] font-medium tracking-[0.08em] text-white/75 sm:text-xs sm:tracking-[0.1em]">
                    {event.dateLabel || event.date} • {event.time}
                  </p>
                </div>

                <div className="relative z-20 flex h-full flex-col justify-end p-2.5 sm:min-h-[13.25rem] sm:p-3">
                  <div className="rounded-[1.1rem] bg-white p-3 shadow-sm transition-all duration-500 ease-out sm:ml-0 sm:bg-white/97 sm:shadow-lg sm:backdrop-blur sm:translate-x-3 sm:translate-y-6 sm:opacity-0 sm:delay-0 sm:group-hover:ml-[32%] sm:group-hover:translate-x-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-hover:delay-150 xl:group-hover:ml-[30%]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-semibold",
                            status.className,
                          )}
                        >
                          {status.label}
                        </span>
                        <h3 className="mt-1.5 text-[0.95rem] font-semibold leading-snug text-[#0f1e33]">
                          {event.title}
                        </h3>
                        <p className="mt-1 max-h-8 overflow-hidden text-[0.72rem] leading-4 text-[#5f7088] sm:text-[0.76rem]">
                          {event.description ||
                            "Keep attendees informed with a clean event summary, logistics, and current registration progress."}
                        </p>
                      </div>
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId((current) =>
                              current === event.id ? null : event.id,
                            )
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#0f1e33] shadow-sm transition hover:text-[#f36f21]"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                        {activeMenuId === event.id ? (
                          <div className="absolute right-0 top-12 z-30 w-48 rounded-2xl border border-[#d9e2ec] bg-white p-2 shadow-xl">
                            <button type="button" onClick={() => handleViewDetails(event)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[#0f1e33] hover:bg-[#f5f7fa]">
                              <Eye size={14} />
                              View Details
                            </button>
                            <button type="button" onClick={() => handleEditEvent(event)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[#0f1e33] hover:bg-[#f5f7fa]">
                              <Edit size={14} />
                              Edit Event
                            </button>
                            <button type="button" onClick={() => handleOpenEmail(event)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[#0f1e33] hover:bg-[#f5f7fa]">
                              <Mail size={14} />
                              Send Notification
                            </button>
                            <button type="button" onClick={() => handleDuplicate(event)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[#0f1e33] hover:bg-[#f5f7fa]">
                              <Copy size={14} />
                              Duplicate
                            </button>
                            <button type="button" onClick={() => handleDelete(event)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-[0.72rem] font-medium text-[#516072] sm:text-[0.76rem]">
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-[#f36f21]" />
                        <span>{event.dateLabel || event.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-[#f36f21]" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-[#f36f21]" />
                        <span>{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign size={13} className="text-[#f36f21]" />
                        <span>
                          {event.isPaid
                            ? `$${Number(event.price || 0).toFixed(2)} per ticket`
                            : "Free entry"}
                        </span>
                      </div>
                    </div>

                    {event.tags?.length ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {event.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-[#f5f7fa] px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-[#1f4e79]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-3 rounded-[0.95rem] bg-[#f8fafc] p-2.5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-[0.72rem] sm:text-xs">
                          <Users size={13} className="text-[#1f4e79]" />
                          <span className="font-medium text-[#0f1e33]">
                            {event.registrations}
                          </span>
                          <span className="text-[#6b7c93]">
                            / {event.capacity} registered
                          </span>
                        </div>
                        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#1f4e79]">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#dfe8f2]">
                        <div
                          className="h-full rounded-full bg-[#f36f21] transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
        ) : null}

        {!isLoadingEvents && filteredEvents.length === 0 ? (
          <section className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <Calendar size={48} className="mx-auto text-[#9aa9bc]" />
            <h3 className="mt-4 text-xl font-semibold text-[#0f1e33]">
              No events found
            </h3>
            <p className="mt-2 text-[#6b7c93]">
              {searchQuery
                ? "Try adjusting your search terms."
                : "Create your first event to get started."}
            </p>
            <Link
              to="/organizer/create"
              className="mt-5 inline-flex rounded-xl bg-[#f36f21] px-4 py-2.5 font-medium text-white"
            >
              Create Event
            </Link>
          </section>
        ) : null}
      </div>

      {showDetailsModal && selectedEvent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-semibold text-[#0f1e33]">
                Event Details
              </h2>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="rounded-full border border-[#d9e2ec] p-2 text-[#6b7c93]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <div className="overflow-hidden rounded-2xl">
                <img
                  src={selectedEvent.imagePreview}
                  alt={selectedEvent.title}
                  className="aspect-video w-full object-cover"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-bold text-[#0f1e33]">
                    {selectedEvent.title}
                  </h3>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                      getStatusBadge(selectedEvent.status).className,
                    )}
                  >
                    {getStatusBadge(selectedEvent.status).label}
                  </span>
                </div>
                <p className="mt-3 text-[#6b7c93]">
                  {selectedEvent.description}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-[#0f1e33]">
                  <Calendar size={16} className="text-[#f36f21]" />
                  <span>{selectedEvent.dateLabel || selectedEvent.date}</span>
                </div>
                <div className="flex items-center gap-2 text-[#0f1e33]">
                  <Clock size={16} className="text-[#f36f21]" />
                  <span>{selectedEvent.time}</span>
                </div>
                <div className="flex items-center gap-2 text-[#0f1e33]">
                  <MapPin size={16} className="text-[#f36f21]" />
                  <span>{selectedEvent.venue}</span>
                </div>
                <div className="flex items-center gap-2 text-[#0f1e33]">
                  <Users size={16} className="text-[#f36f21]" />
                  <span>
                    {selectedEvent.registrations} / {selectedEvent.capacity}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#0f1e33]">
                  <DollarSign size={16} className="text-[#f36f21]" />
                  <span>
                    {selectedEvent.isPaid
                      ? `$${selectedEvent.price} AUD`
                      : "Free"}
                  </span>
                </div>
              </div>

              {selectedEvent.tags?.length ? (
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#fff1e8] px-3 py-1 text-xs font-medium text-[#f36f21]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenEmail(selectedEvent)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#f36f21] px-4 py-2.5 font-medium text-white"
                >
                  <Mail size={16} />
                  Send Notification
                </button>
                <button
                  type="button"
                  onClick={() => handleEditEvent(selectedEvent)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#d9e2ec] px-4 py-2.5 font-medium text-[#0f1e33]"
                >
                  <Edit size={16} />
                  Edit Event
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showEmailModal && selectedEvent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[#0f1e33]">
                  Send Notification
                </h2>
                <p className="mt-1 text-sm text-[#6b7c93]">
                  Send an email to attendees of "{selectedEvent.title}".
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="rounded-full border border-[#d9e2ec] p-2 text-[#6b7c93]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <p className="mb-3 flex items-center gap-2 text-sm font-medium text-[#0f1e33]">
                  <Sparkles size={16} className="text-[#1f4e79]" />
                  AI Recommended Templates
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  {aiTemplates(selectedEvent).map((template) => (
                    <button
                      key={template.type}
                      type="button"
                      onClick={() => handleSelectTemplate(template)}
                      className="rounded-2xl border border-[#d9e2ec] p-4 text-left transition hover:border-[#1f4e79]"
                    >
                      <p className="font-medium text-[#0f1e33]">
                        {template.type}
                      </p>
                      <p className="mt-1 truncate text-xs text-[#6b7c93]">
                        {template.subject}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#0f1e33]">
                  Select Audience
                </label>
                <select
                  value={emailAudience}
                  onChange={(event) => setEmailAudience(event.target.value)}
                  className="w-full rounded-xl border border-[#d9e2ec] px-4 py-3 outline-none transition focus:border-[#1f4e79]"
                >
                  <option value="all">All Registrants</option>
                  <option value="paid">Paid Only</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="emailSubject"
                  className="mb-2 block text-sm font-medium text-[#0f1e33]"
                >
                  Subject
                </label>
                <input
                  id="emailSubject"
                  value={emailSubject}
                  onChange={(event) => setEmailSubject(event.target.value)}
                  placeholder="Email subject..."
                  className="w-full rounded-xl border border-[#d9e2ec] px-4 py-3 outline-none transition focus:border-[#1f4e79]"
                />
              </div>

              <div>
                <label
                  htmlFor="emailBody"
                  className="mb-2 block text-sm font-medium text-[#0f1e33]"
                >
                  Message
                </label>
                <textarea
                  id="emailBody"
                  rows="10"
                  value={emailBody}
                  onChange={(event) => setEmailBody(event.target.value)}
                  placeholder="Write your message..."
                  className="w-full rounded-xl border border-[#d9e2ec] px-4 py-3 outline-none transition focus:border-[#1f4e79]"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="rounded-xl border border-[#d9e2ec] px-4 py-2.5 font-medium text-[#0f1e33]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={isSending}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#f36f21] px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Send size={16} />
                  {isSending ? "Sending..." : "Send Email"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showDeleteDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-semibold text-[#0f1e33]">
              Delete Event
            </h2>
            <p className="mt-3 text-[#6b7c93]">
              Are you sure you want to delete "{eventToDelete?.title}"? This
              action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setEventToDelete(null);
                }}
                className="rounded-xl border border-[#d9e2ec] px-4 py-2.5 font-medium text-[#0f1e33]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-rose-600 px-4 py-2.5 font-medium text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}

export default OrganizerEvents;
