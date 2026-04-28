import { useEffect, useMemo, useState } from "react";
import { Calendar, Eye, Mail, Send, Users, X } from "lucide-react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "../../components/dashboard/dashboard.jsx";
import { fetchOrganizerMessageLogs } from "../../services/messagingService.js";

const cn = (...classes) => classes.filter(Boolean).join(" ");

function getAudienceConfig(audience) {
  switch (audience) {
    case "all":
      return {
        label: "All Registrants",
        className: "bg-blue-100 text-blue-700",
      };
    case "paid":
      return {
        label: "Paid Only",
        className: "bg-green-100 text-green-700",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        className: "bg-yellow-100 text-yellow-700",
      };
    default:
      return {
        label: audience,
        className: "bg-slate-100 text-slate-700",
      };
  }
}

function OrganizerEmailLog() {
  const storedUser = window.localStorage.getItem("smart_event_user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailLogs, setEmailLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser || currentUser.role !== "organizer") {
      return undefined;
    }

    let isMounted = true;

    fetchOrganizerMessageLogs()
      .then((logs) => {
        if (isMounted) {
          setEmailLogs(logs);
          setError("");
        }
      })
      .catch((loadError) => {
        if (isMounted) {
          setEmailLogs([]);
          setError(loadError.message || "Unable to load email history.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser?.email, currentUser?.role]);

  if (!currentUser || currentUser.role !== "organizer") {
    return <Navigate to="/login" replace />;
  }

  const totalRecipients = emailLogs.reduce(
    (sum, log) => sum + Number(log.recipientCount || 0),
    0,
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-[#0f1e33]">Email Log</h1>
          <p className="mt-2 text-[#6b7c93]">
            View the history of emails sent to your event attendees.
          </p>
        </div>

        {error ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
            {error}
          </section>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf4ff]">
                <Mail size={24} className="text-[#1f4e79]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f1e33]">
                  {emailLogs.length}
                </p>
                <p className="text-sm text-[#6b7c93]">Total Emails Sent</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
                <Users size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f1e33]">
                  {totalRecipients}
                </p>
                <p className="text-sm text-[#6b7c93]">Total Recipients</p>
              </div>
            </div>
          </section>
        </div>

        {emailLogs.length > 0 ? (
          <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#e8eef5]">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-[#0f1e33]">
                      Event
                    </th>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-[#0f1e33]">
                      Subject
                    </th>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-[#0f1e33]">
                      Audience
                    </th>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-[#0f1e33]">
                      Recipients
                    </th>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-[#0f1e33]">
                      Sent At
                    </th>
                    <th className="px-5 py-4 text-right text-sm font-semibold text-[#0f1e33]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef2f7]">
                  {emailLogs.map((log) => {
                    const audience = getAudienceConfig(log.audience);

                    return (
                      <tr key={log.id} className="hover:bg-[#fafcff]">
                        <td className="px-5 py-4 font-medium text-[#0f1e33]">
                          {log.eventTitle}
                        </td>
                        <td className="max-w-[260px] truncate px-5 py-4 text-sm text-[#0f1e33]">
                          {log.subject}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                              audience.className,
                            )}
                          >
                            {audience.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-[#0f1e33]">
                          {log.recipientCount}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-[#6b7c93]">
                            <Calendar size={14} />
                            <span>{log.sentAtLabel || log.sentAt}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedEmail(log)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d9e2ec] text-[#1f4e79] transition hover:border-[#1f4e79] hover:bg-[#f8fbff]"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <Send size={48} className="mx-auto text-[#9aa9bc]" />
            <h3 className="mt-4 text-xl font-semibold text-[#0f1e33]">
              {isLoading ? "Loading email history..." : "No emails sent yet"}
            </h3>
            <p className="mt-2 text-[#6b7c93]">
              {isLoading
                ? "Fetching organizer mail history from the backend."
                : "Emails you send to event attendees will appear here."}
            </p>
          </section>
        )}
      </div>

      {selectedEmail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[#0f1e33]">
                  Email Details
                </h2>
                <p className="mt-1 text-sm text-[#6b7c93]">
                  Sent to {selectedEmail.recipientCount} recipients on{" "}
                  {selectedEmail.sentAtLabel || selectedEmail.sentAt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmail(null)}
                className="rounded-full border border-[#d9e2ec] p-2 text-[#6b7c93] transition hover:text-[#0f1e33]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-[#6b7c93]">Event</p>
                <p className="mt-1 text-[#0f1e33]">{selectedEmail.eventTitle}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#6b7c93]">Subject</p>
                <p className="mt-1 text-[#0f1e33]">{selectedEmail.subject}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#6b7c93]">Audience</p>
                <span
                  className={cn(
                    "mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                    getAudienceConfig(selectedEmail.audience).className,
                  )}
                >
                  {getAudienceConfig(selectedEmail.audience).label}
                </span>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-[#6b7c93]">
                  Message Body
                </p>
                <div className="rounded-2xl bg-[#f5f7fa] p-4">
                  <p className="whitespace-pre-wrap text-[#0f1e33]">
                    {selectedEmail.body}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}

export default OrganizerEmailLog;
