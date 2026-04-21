import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Clock,
  Download,
  Mail,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "../../components/dashboard/dashboard.jsx";
import {
  exportOrganizerRegistrations,
  fetchOrganizerRegistrations,
} from "../../services/registrationService.js";
import { getCurrentUser } from "../../utils/auth.js";

const cn = (...classes) => classes.filter(Boolean).join(" ");

function calculateAttendanceRisk(registration) {
  if (registration.attendanceStatus === "no-show") {
    return "red";
  }
  if (registration.paymentStatus === "unpaid" || registration.attendanceStatus === "cancelled") {
    return "amber";
  }
  return "green";
}

function getRiskReason(registration) {
  const risk = calculateAttendanceRisk(registration);
  if (risk === "red") {
    return "This attendee has a no-show status, which suggests a higher attendance risk.";
  }
  if (risk === "amber") {
    return "This attendee has an unpaid or cancelled registration that may need attention.";
  }
  return "This attendee appears low risk based on current registration and attendance data.";
}

function getPaymentBadge(status) {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-700";
    case "unpaid":
      return "bg-red-100 text-red-700";
    case "refunded":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getAttendanceBadge(status) {
  switch (status) {
    case "attended":
      return "border-green-300 text-green-700";
    case "registered":
      return "border-blue-300 text-blue-700";
    case "no-show":
      return "border-red-300 text-red-700";
    case "cancelled":
      return "border-slate-300 text-slate-500";
    default:
      return "border-slate-300 text-slate-700";
  }
}

function getRiskConfig(registration) {
  const risk = calculateAttendanceRisk(registration);
  if (risk === "red") {
    return {
      label: "High Risk",
      className: "bg-red-100 text-red-700 border-red-200",
      icon: <ShieldAlert size={12} />,
    };
  }
  if (risk === "amber") {
    return {
      label: "Medium Risk",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
      icon: <Clock size={12} />,
    };
  }
  return {
    label: "Low Risk",
    className: "bg-green-100 text-green-700 border-green-200",
    icon: <CheckCircle size={12} />,
  };
}

function OrganizerRegistrations() {
  const currentUser = useMemo(() => getCurrentUser(), []);
  const currentUserRole = currentUser?.role ?? null;
  const [searchQuery, setSearchQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("All Events");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [notice, setNotice] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allRegistrations, setAllRegistrations] = useState([]);

  useEffect(() => {
    let isMounted = true;

    if (currentUserRole !== "organizer") {
      return undefined;
    }

    const loadRegistrations = async () => {
      try {
        setIsLoading(true);
        const result = await fetchOrganizerRegistrations();

        if (!isMounted) {
          return;
        }

        setAllRegistrations(result.registrations);
        setNotice(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setAllRegistrations([]);
        setNotice({
          type: "error",
          message: error.message || "Could not load registrations right now.",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRegistrations();

    return () => {
      isMounted = false;
    };
  }, [currentUserRole]);

  const events = useMemo(
    () =>
      Array.from(
        new Set(allRegistrations.map((registration) => registration.eventName))
      ).map((eventName) => ({ title: eventName })),
    [allRegistrations]
  );

  const eventOptions = ["All Events", ...events.map((event) => event.title)];

  const filteredRegistrations = useMemo(
    () =>
      allRegistrations.filter((registration) => {
        const haystack = `${registration.attendeeName} ${registration.attendeeEmail}`.toLowerCase();
        const matchesSearch = haystack.includes(searchQuery.toLowerCase());
        const matchesEvent =
          eventFilter === "All Events" || registration.eventName === eventFilter;
        const matchesStatus =
          statusFilter === "all" || registration.paymentStatus === statusFilter;
        const matchesRisk =
          riskFilter === "all" || calculateAttendanceRisk(registration) === riskFilter;
        return matchesSearch && matchesEvent && matchesStatus && matchesRisk;
      }),
    [allRegistrations, searchQuery, eventFilter, statusFilter, riskFilter],
  );

  if (currentUserRole !== "organizer") {
    return <Navigate to="/login" replace />;
  }

  const redListCount = allRegistrations.filter(
    (registration) => calculateAttendanceRisk(registration) === "red",
  ).length;

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const { blob, fileName } = await exportOrganizerRegistrations({
        search: searchQuery,
        eventName: eventFilter,
        paymentStatus: statusFilter,
        riskLevel: riskFilter,
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setNotice({
        type: "success",
        message: `Downloaded ${filteredRegistrations.length} registration record(s) from the backend.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: error.message || "Could not export registrations right now.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0f1e33]">Registrations</h1>
            <p className="mt-2 text-[#6b7c93]">
              Manage attendee registrations for your events.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-xl border border-[#d9e2ec] px-4 py-2.5 font-medium text-[#0f1e33]"
          >
            <Download size={18} />
            {isExporting ? "Exporting..." : "Export List"}
          </button>
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf4ff]">
                <Users size={24} className="text-[#1f4e79]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f1e33]">{allRegistrations.length}</p>
                <p className="text-sm text-[#6b7c93]">Total</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f1e33]">
                  {allRegistrations.filter((item) => item.paymentStatus === "paid").length}
                </p>
                <p className="text-sm text-[#6b7c93]">Paid</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100">
                <Clock size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f1e33]">
                  {allRegistrations.filter((item) => item.paymentStatus === "unpaid").length}
                </p>
                <p className="text-sm text-[#6b7c93]">Unpaid</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1e8]">
                <CheckCircle size={24} className="text-[#f36f21]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f1e33]">
                  {allRegistrations.filter((item) => item.attendanceStatus === "attended").length}
                </p>
                <p className="text-sm text-[#6b7c93]">Attended</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border-l-4 border-l-red-500 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
                <ShieldAlert size={24} className="text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f1e33]">{redListCount}</p>
                <p className="text-sm text-[#6b7c93]">Red List</p>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7c93]"
              />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-[#d9e2ec] py-3 pl-10 pr-4 outline-none transition focus:border-[#1f4e79]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={eventFilter}
                onChange={(event) => setEventFilter(event.target.value)}
                className="rounded-xl border border-[#d9e2ec] px-4 py-3 outline-none transition focus:border-[#1f4e79]"
              >
                {eventOptions.map((event) => (
                  <option key={event} value={event}>
                    {event}
                  </option>
                ))}
              </select>

              {["all", "paid", "unpaid"].map((filter) => (
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

              <button
                type="button"
                onClick={() => setRiskFilter(riskFilter === "red" ? "all" : "red")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-medium transition",
                  riskFilter === "red"
                    ? "bg-rose-600 text-white"
                    : "border border-[#d9e2ec] bg-white text-[#0f1e33]",
                )}
              >
                <ShieldAlert size={14} />
                Red List Only
              </button>
            </div>
          </div>
        </section>

        {isLoading ? (
          <section className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <Users size={48} className="mx-auto mb-4 text-[#9aa9bc]" />
            <h3 className="text-xl font-semibold text-[#0f1e33]">
              Loading registrations...
            </h3>
            <p className="mt-2 text-[#6b7c93]">
              Fetching registration data for your organizer account.
            </p>
          </section>
        ) : null}

        {!isLoading && filteredRegistrations.length > 0 ? (
          <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#e8eef5]">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-[#0f1e33]">
                      Attendee
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-[#0f1e33]">
                      Event
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-[#0f1e33]">
                      Date
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-[#0f1e33]">
                      Payment
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-[#0f1e33]">
                      Attendance
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-[#0f1e33]">
                      AI Risk
                    </th>
                    <th className="px-4 py-4 text-right text-sm font-semibold text-[#0f1e33]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef2f7]">
                  {filteredRegistrations.map((registration) => {
                    const risk = getRiskConfig(registration);
                    return (
                      <tr
                        key={registration.id}
                        className={cn(
                          calculateAttendanceRisk(registration) === "red"
                            ? "bg-red-50/50"
                            : "",
                        )}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f7fa] text-sm font-semibold text-[#1f4e79]">
                              {registration.attendeeName
                                .split(" ")
                                .map((part) => part[0])
                                .join("")
                                .slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium text-[#0f1e33]">
                                {registration.attendeeName}
                              </p>
                              <p className="text-sm text-[#6b7c93]">
                                {registration.attendeeEmail}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-medium text-[#0f1e33]">
                          {registration.eventName}
                        </td>
                        <td className="px-4 py-4 text-sm text-[#0f1e33]">
                          {registration.registrationDate}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                              getPaymentBadge(registration.paymentStatus),
                            )}
                          >
                            {registration.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                              getAttendanceBadge(registration.attendanceStatus),
                            )}
                          >
                            {registration.attendanceStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div title={getRiskReason(registration)} className="inline-flex items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold",
                                risk.className,
                              )}
                            >
                              {risk.icon}
                              {risk.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setNotice({
                                type: "success",
                                message: `Ready to message ${registration.attendeeName}.`,
                              })
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d9e2ec] text-[#1f4e79]"
                          >
                            <Mail size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {!isLoading && filteredRegistrations.length === 0 ? (
          <section className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <Users size={48} className="mx-auto mb-4 text-[#9aa9bc]" />
            <h3 className="text-xl font-semibold text-[#0f1e33]">
              No registrations found
            </h3>
            <p className="mt-2 text-[#6b7c93]">
              {searchQuery || eventFilter !== "All Events" || statusFilter !== "all" || riskFilter !== "all"
                ? "Try adjusting your filters."
                : "Registrations for your events will appear here."}
            </p>
          </section>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

export default OrganizerRegistrations;
