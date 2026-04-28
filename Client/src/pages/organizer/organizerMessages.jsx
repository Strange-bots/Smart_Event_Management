import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle,
  Eye,
  FileText,
  Mail,
  Search,
  Send,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "../../components/dashboard/dashboard.jsx";
import { fetchOrganizerEvents } from "../../services/organizerEventService.js";
import {
  fetchOrganizerMessageLogs,
  sendOrganizerMessage,
} from "../../services/messagingService.js";

const cn = (...classes) => classes.filter(Boolean).join(" ");

function getOrganizerTemplates(event, tone) {
  if (!event) {
    return [];
  }

  const templates = {
    formal: [
      {
        type: "Reminder",
        subject: `Reminder: ${event.title} is approaching`,
        body: `Dear Attendee,\n\nThis is a courteous reminder that "${event.title}" is scheduled for ${event.dateLabel || event.date} at ${event.time}.\n\nVenue: ${event.venue}\n\nPlease arrive 10 minutes early.\n\nBest regards,\nEvent Organizer`,
      },
      {
        type: "Update",
        subject: `Important Update: ${event.title}`,
        body: `Dear Attendee,\n\nWe are writing to share an important update regarding "${event.title}".\n\n[Please add the update details here]\n\nThank you for your understanding.\n\nSincerely,\nEvent Organizer`,
      },
      {
        type: "Thank You",
        subject: `Thank You for Attending ${event.title}`,
        body: `Dear Attendee,\n\nThank you for attending "${event.title}". We appreciate your participation and hope you found the session valuable.\n\nBest regards,\nEvent Organizer`,
      },
    ],
    friendly: [
      {
        type: "Reminder",
        subject: `Don't forget: ${event.title} is coming up!`,
        body: `Hey there!\n\nJust a quick reminder that "${event.title}" is happening on ${event.dateLabel || event.date} at ${event.time}.\n\nWe’ll see you at ${event.venue}.\n\nCheers,\nThe Event Team`,
      },
      {
        type: "Update",
        subject: `Quick update about ${event.title}`,
        body: `Hi!\n\nWe wanted to share a quick update about "${event.title}".\n\n[What's changed]\n\nThanks for your understanding.\n\nThe Event Team`,
      },
      {
        type: "Recommended Events",
        subject: `You might love these events too`,
        body: `Hi!\n\nSince you're interested in "${event.title}", we thought you might enjoy some similar events coming up soon.\n\nSee you again soon!\n\nThe Event Team`,
      },
    ],
    short: [
      {
        type: "Reminder",
        subject: `Reminder: ${event.title} - ${event.dateLabel || event.date}`,
        body: `Quick reminder:\n\n${event.title}\n${event.dateLabel || event.date} at ${event.time}\n${event.venue}\n\nSee you there!`,
      },
      {
        type: "Update",
        subject: `Update: ${event.title}`,
        body: `Event update for ${event.title}:\n\n[Change details]\n\nQuestions? Reply to this email.`,
      },
      {
        type: "Thank You",
        subject: `Thanks for coming to ${event.title}`,
        body: `Thanks for attending ${event.title}.\n\nWe'd love your feedback and hope to see you again soon.`,
      },
    ],
  };

  return templates[tone];
}

function getAudienceLabel(audience) {
  switch (audience) {
    case "all":
      return "All Registrants";
    case "paid":
      return "Paid Only";
    case "cancelled":
      return "Cancelled";
    case "attended":
      return "Attended";
    case "no-show":
      return "No-Shows";
    default:
      return audience;
  }
}

function getRecipientCount(event, audience) {
  const total = Number(event?.registrations || 0);

  switch (audience) {
    case "paid":
      return Math.floor(total * 0.6);
    case "cancelled":
      return Math.floor(total * 0.15);
    case "attended":
      return Math.floor(total * 0.7);
    case "no-show":
      return Math.floor(total * 0.1);
    case "all":
      return total;
    default:
      return 0;
  }
}

function OrganizerMessages() {
  const storedUser = window.localStorage.getItem("smart_event_user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const [activeTab, setActiveTab] = useState("compose");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedAudience, setSelectedAudience] = useState("");
  const [selectedTone, setSelectedTone] = useState("formal");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState(null);
  const [events, setEvents] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

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

  const [emailLogs, setEmailLogs] = useState([]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "organizer") {
      return undefined;
    }

    let isMounted = true;

    fetchOrganizerMessageLogs()
      .then((logs) => {
        if (isMounted) {
          setEmailLogs(logs);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setEmailLogs([]);
          setNotice({
            type: "error",
            message: error.message || "Unable to load email history.",
          });
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingLogs(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser?.email, currentUser?.role]);

  const selectedEvent =
    events.find((event) => String(event.id) === selectedEventId) || null;

  const recipientOptions = useMemo(() => {
    const total = Number(selectedEvent?.registrations || 0);

    return [
      { value: "all", label: "All Registrants", count: total },
      { value: "paid", label: "Paid Only", count: Math.floor(total * 0.6) },
      { value: "cancelled", label: "Cancelled", count: Math.floor(total * 0.15) },
      { value: "attended", label: "Attended", count: Math.floor(total * 0.7) },
      { value: "no-show", label: "No-Shows", count: Math.floor(total * 0.1) },
    ];
  }, [selectedEvent]);

  const recipientCount = useMemo(
    () => getRecipientCount(selectedEvent, selectedAudience),
    [selectedEvent, selectedAudience],
  );

  const templates = useMemo(
    () => getOrganizerTemplates(selectedEvent, selectedTone),
    [selectedEvent, selectedTone],
  );

  const filteredLogs = useMemo(
    () =>
      emailLogs.filter(
        (log) =>
          log.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [emailLogs, searchQuery],
  );

  if (!currentUser || currentUser.role !== "organizer") {
    return <Navigate to="/login" replace />;
  }

  const handleRegenerate = () => {
    const tones = ["formal", "friendly", "short"];
    const currentIndex = tones.indexOf(selectedTone);
    const nextTone = tones[(currentIndex + 1) % tones.length];
    setSelectedTone(nextTone);
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim() || !selectedEventId || !selectedAudience) {
      setNotice({ type: "error", message: "Please fill in all required fields." });
      return;
    }

    try {
      setIsSending(true);
      const result = await sendOrganizerMessage({
        eventId: selectedEvent.id,
        audience: selectedAudience,
        subject: subject.trim(),
        body: body.trim(),
      });

      setEmailLogs((prev) => [result.log, ...prev]);
      setSubject("");
      setBody("");
      setSelectedAudience("");
      setActiveTab("sent");
      setNotice({
        type: "success",
        message: `Email sent to ${result.recipientCount} recipient(s).`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: error.message || "Unable to send email right now.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-[#0f1e33]">Messages</h1>
          <p className="mt-2 text-[#6b7c93]">
            Send event notifications to your attendees with AI-powered templates.
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

        <div className="grid gap-4 sm:grid-cols-3">
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf4ff]">
                <Send size={24} className="text-[#1f4e79]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f1e33]">{emailLogs.length}</p>
                <p className="text-sm text-[#6b7c93]">Emails Sent</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1e8]">
                <Calendar size={24} className="text-[#f36f21]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f1e33]">{events.length}</p>
                <p className="text-sm text-[#6b7c93]">Your Events</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100">
                <Sparkles size={24} className="text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f1e33]">AI</p>
                <p className="text-sm text-[#6b7c93]">Templates Ready</p>
              </div>
            </div>
          </section>
        </div>

        <div className="rounded-3xl bg-white p-2 shadow-sm">
          <div className="flex gap-2">
            {[
              { value: "compose", label: "Compose", icon: Mail },
              { value: "sent", label: "Sent Log", icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition",
                    activeTab === tab.value
                      ? "bg-[#1f4e79] text-white"
                      : "text-[#0f1e33] hover:bg-[#f5f7fa]",
                  )}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === "compose" ? (
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Mail size={20} className="text-[#f36f21]" />
              <h2 className="text-xl font-semibold text-[#0f1e33]">
                Compose Event Email
              </h2>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#0f1e33]">
                  Select Event *
                </label>
                <select
                  value={selectedEventId}
                  onChange={(event) => {
                    setSelectedEventId(event.target.value);
                    setSelectedAudience("");
                    setSubject("");
                    setBody("");
                  }}
                  className="w-full rounded-xl border border-[#d9e2ec] px-4 py-3 outline-none transition focus:border-[#1f4e79]"
                >
                  <option value="">Choose an event</option>
                  {events.map((event) => (
                    <option key={event.id} value={String(event.id)}>
                      {event.title} ({event.registrations || 0} reg)
                    </option>
                  ))}
                </select>
              </div>

              {selectedEvent ? (
                <div className="space-y-6">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#0f1e33]">
                        Audience *
                      </label>
                      <select
                        value={selectedAudience}
                        onChange={(event) => setSelectedAudience(event.target.value)}
                        className="w-full rounded-xl border border-[#d9e2ec] px-4 py-3 outline-none transition focus:border-[#1f4e79]"
                      >
                        <option value="">Choose audience</option>
                        {recipientOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label} ({option.count})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#0f1e33]">
                        Tone
                      </label>
                      <select
                        value={selectedTone}
                        onChange={(event) => setSelectedTone(event.target.value)}
                        className="w-full rounded-xl border border-[#d9e2ec] px-4 py-3 outline-none transition focus:border-[#1f4e79]"
                      >
                        <option value="formal">Formal</option>
                        <option value="friendly">Friendly</option>
                        <option value="short">Short</option>
                      </select>
                    </div>

                    <div className="rounded-2xl border border-[#d9e2ec] bg-[#f8fbff] p-4">
                      <p className="text-sm font-medium text-[#0f1e33]">Recipients</p>
                      <p className="mt-1 text-2xl font-bold text-[#1f4e79]">
                        {recipientCount}
                      </p>
                      <p className="text-xs text-[#6b7c93]">
                        {selectedAudience ? getAudienceLabel(selectedAudience) : "Select an audience"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-sm font-medium text-[#0f1e33]">
                        <Sparkles size={16} className="text-violet-600" />
                        AI Templates
                      </p>
                      <button
                        type="button"
                        onClick={handleRegenerate}
                        className="rounded-xl border border-[#d9e2ec] px-3 py-2 text-sm font-medium text-[#0f1e33]"
                      >
                        Switch Tone
                      </button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {templates.map((template) => (
                        <button
                          key={template.type}
                          type="button"
                          onClick={() => {
                            setSubject(template.subject);
                            setBody(template.body);
                          }}
                          className="rounded-2xl border border-[#d9e2ec] p-4 text-left transition hover:border-[#1f4e79]"
                        >
                          <p className="font-medium text-[#0f1e33]">{template.type}</p>
                          <p className="mt-1 truncate text-xs text-[#6b7c93]">
                            {template.subject}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="messageSubject"
                      className="mb-2 block text-sm font-medium text-[#0f1e33]"
                    >
                      Subject *
                    </label>
                    <input
                      id="messageSubject"
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      placeholder="Email subject..."
                      className="w-full rounded-xl border border-[#d9e2ec] px-4 py-3 outline-none transition focus:border-[#1f4e79]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="messageBody"
                      className="mb-2 block text-sm font-medium text-[#0f1e33]"
                    >
                      Message *
                    </label>
                    <textarea
                      id="messageBody"
                      rows="10"
                      value={body}
                      onChange={(event) => setBody(event.target.value)}
                      placeholder="Write your message..."
                      className="w-full rounded-xl border border-[#d9e2ec] px-4 py-3 outline-none transition focus:border-[#1f4e79]"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={isSending}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#f36f21] px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Send size={16} />
                      {isSending ? "Sending..." : "Send Email"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-[#6b7c93]">
                  <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Select an event to compose an email.</p>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-[#f36f21]" />
                <h2 className="text-xl font-semibold text-[#0f1e33]">Sent Emails</h2>
              </div>
              <div className="relative w-full sm:w-72">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7c93]"
                />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search emails..."
                  className="w-full rounded-xl border border-[#d9e2ec] py-3 pl-9 pr-4 outline-none transition focus:border-[#1f4e79]"
                />
              </div>
            </div>

            {filteredLogs.length > 0 ? (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-[#e8eef5]">
                  <thead className="bg-[#f8fafc]">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f1e33]">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f1e33]">
                        Event
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f1e33]">
                        Subject
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#0f1e33]">
                        Audience
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-[#0f1e33]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eef2f7]">
                    {filteredLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-4 py-4 text-sm text-[#6b7c93]">
                          {log.sentAtLabel || log.sentAt}
                        </td>
                        <td className="px-4 py-4 font-medium text-[#0f1e33]">
                          {log.eventTitle}
                        </td>
                        <td className="max-w-xs truncate px-4 py-4 text-sm text-[#0f1e33]">
                          {log.subject}
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#f5f7fa] px-3 py-1 text-xs font-medium text-[#1f4e79]">
                            <Users size={12} />
                            {getAudienceLabel(log.audience)} ({log.recipientCount})
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedLog(log)}
                            className="inline-flex items-center gap-1 rounded-xl border border-[#d9e2ec] px-3 py-2 text-sm font-medium text-[#0f1e33]"
                          >
                            <Eye size={14} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Mail size={48} className="mx-auto mb-4 text-[#9aa9bc]" />
                <h3 className="text-xl font-semibold text-[#0f1e33]">
                  {isLoadingLogs ? "Loading email history..." : "No emails sent yet"}
                </h3>
                <p className="mt-2 text-[#6b7c93]">
                  {isLoadingLogs
                    ? "Fetching organizer message logs from the backend."
                    : "Compose your first event email to get started."}
                </p>
              </div>
            )}
          </section>
        )}
      </div>

      {selectedLog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-semibold text-[#0f1e33]">
                Email Details
              </h2>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-full border border-[#d9e2ec] p-2 text-[#6b7c93]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-[#6b7c93]">Event:</span>
                  <p className="mt-1 flex items-center gap-2 font-medium text-[#0f1e33]">
                    <Calendar size={14} className="text-[#f36f21]" />
                    {selectedLog.eventTitle}
                  </p>
                </div>
                <div>
                  <span className="text-[#6b7c93]">Sent:</span>
                  <p className="mt-1 font-medium text-[#0f1e33]">
                    {selectedLog.sentAtLabel || selectedLog.sentAt}
                  </p>
                </div>
                <div>
                  <span className="text-[#6b7c93]">Audience:</span>
                  <p className="mt-1 flex items-center gap-2 font-medium text-[#0f1e33]">
                    <Users size={14} />
                    {getAudienceLabel(selectedLog.audience)} ({selectedLog.recipientCount})
                  </p>
                </div>
                <div>
                  <span className="text-[#6b7c93]">Status:</span>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    <CheckCircle size={12} />
                    Sent
                  </span>
                </div>
              </div>

              <div>
                <span className="text-sm text-[#6b7c93]">Subject:</span>
                <p className="mt-1 font-semibold text-[#0f1e33]">{selectedLog.subject}</p>
              </div>

              <div>
                <span className="text-sm text-[#6b7c93]">Message:</span>
                <div className="mt-2 rounded-2xl bg-[#f5f7fa] p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-[#0f1e33]">
                    {selectedLog.body}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}

export default OrganizerMessages;
