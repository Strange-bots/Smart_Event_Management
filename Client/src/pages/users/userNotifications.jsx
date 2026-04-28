import { useEffect, useState } from "react";
import DashboardLayout from "../../components/dashboard/dashboard";
import {
  Bell,
  Calendar,
  CreditCard,
  Mail,
  CheckCircle,
  AlertCircle,
  Info,
  CheckCheck,
  User,
  X,
} from "lucide-react";
import {
  fetchMyNotifications,
  markAllMyNotificationsRead,
  markMyNotificationRead,
} from "../../services/notificationService.js";

const cn = (...classes) => classes.filter(Boolean).join(" ");
const formatEmailLine = (name, email, fallbackEmail) => {
  const resolvedEmail = email || fallbackEmail;
  const resolvedName = name || resolvedEmail;

  return resolvedEmail ? `${resolvedName} <${resolvedEmail}>` : resolvedName;
};

const UserNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        const result = await fetchMyNotifications();

        if (!isMounted) {
          return;
        }

        setNotifications(result);
        setNotice(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setNotifications([]);
        setNotice({
          type: "error",
          message: error.message || "Could not load notifications.",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleMarkAsRead = async (id) => {
    const target = notifications.find((notification) => notification.id === id);

    if (!target || target.isRead) {
      return;
    }

    try {
      await markMyNotificationRead(id);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setSelectedNotification((current) =>
        current?.id === id ? { ...current, isRead: true } : current
      );
    } catch (error) {
      setNotice({
        type: "error",
        message: error.message || "Could not update this notification.",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllMyNotificationsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      setNotice({
        type: "error",
        message: error.message || "Could not update all notifications.",
      });
    }
  };

  const openNotification = async (notification) => {
    setSelectedNotification(notification);
    await handleMarkAsRead(notification.id);
  };

  const closeNotification = () => {
    setSelectedNotification(null);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "registration":
        return <Calendar className="text-[#f36f21]" size={20} />;
      case "payment":
        return <CreditCard className="text-green-600" size={20} />;
      case "reminder":
        return <Bell className="text-yellow-600" size={20} />;
      case "update":
        return <AlertCircle className="text-blue-600" size={20} />;
      case "organizer":
        return <Mail className="text-[#1f4e79]" size={20} />;
      case "admin":
        return <User className="text-red-600" size={20} />;
      default:
        return <Info className="text-gray-400" size={20} />;
    }
  };

  const getTypeBadge = (type) => {
    const colors = {
      registration: "bg-orange-100 text-[#f36f21]",
      payment: "bg-green-100 text-green-700",
      reminder: "bg-yellow-100 text-yellow-700",
      update: "bg-blue-100 text-blue-700",
      system: "bg-gray-100 text-gray-700",
      organizer: "bg-blue-50 text-[#1f4e79]",
      admin: "bg-red-100 text-red-700",
    };
    const labels = {
      registration: "Registration",
      payment: "Payment",
      reminder: "Reminder",
      update: "Update",
      system: "System",
      organizer: "Organizer",
      admin: "Admin",
    };
    return (
      <span
        className={cn(
          "text-xs font-medium px-2 py-0.5 rounded-full hover:opacity-90",
          colors[type] || "bg-gray-100 text-gray-700"
        )}
      >
        {labels[type] || type}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1f4e79]">
              Notifications
            </h1>
            <p className="text-gray-500 mt-1">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck size={18} />
              Mark All as Read
            </button>
          )}
        </div>

        {notice ? (
          <div
            className={cn(
              "rounded-xl border px-4 py-3 text-sm font-medium",
              notice.type === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            )}
          >
            {notice.message}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl shadow-sm bg-white p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center relative">
              <Bell size={24} className="text-red-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              <p className="text-sm text-gray-500">Unread</p>
            </div>
          </div>

          <div className="rounded-xl shadow-sm bg-white p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {notifications.filter((n) => n.isRead).length}
              </p>
              <p className="text-sm text-gray-500">Read</p>
            </div>
          </div>

          <div className="rounded-xl shadow-sm bg-white p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <Mail size={24} className="text-[#1f4e79]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-xl shadow-sm bg-white p-12 text-center">
            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">
              Loading notifications
            </h3>
            <p className="text-gray-500">
              Fetching your notifications from the backend.
            </p>
          </div>
        ) : null}

        {!isLoading && notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "rounded-xl shadow-sm bg-white transition-all cursor-pointer hover:shadow-md",
                  !notification.isRead && "bg-orange-50 border-l-4 border-l-[#f36f21]"
                )}
                onClick={() => openNotification(notification)}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={cn(
                              "font-medium text-gray-900",
                              !notification.isRead && "font-semibold"
                            )}
                          >
                            {notification.title}
                          </h3>
                          {getTypeBadge(notification.type)}
                        </div>
                        {!notification.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#f36f21] shrink-0 mt-2" />
                        )}
                      </div>
                      <p className="text-gray-500 text-sm mb-2">{notification.message}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar size={12} />
                        <span>{notification.createdAtLabel}</span>
                        {notification.from && (
                          <>
                            <span>•</span>
                            <span>From: {notification.from}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl shadow-sm bg-white p-12 text-center">
            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">
              You'll receive notifications about your registrations, payments, and event updates here
            </p>
          </div>
        )}
      </div>

      {selectedNotification ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 sm:p-6">
          <div className="grid h-[min(78vh,760px)] w-full max-w-4xl overflow-hidden rounded-none bg-white shadow-2xl md:grid-cols-[240px_1fr]">
            <div className="flex flex-col justify-between border-b border-slate-200 bg-slate-100 p-6 md:border-b-0 md:border-r">
              <div>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-none bg-white shadow-sm">
                  {getNotificationIcon(selectedNotification.type)}
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Inbox Message
                </p>
                <div className="mt-3">{getTypeBadge(selectedNotification.type)}</div>
              </div>

              <div className="space-y-3 text-sm text-slate-600">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Status
                  </p>
                  <p className="mt-1 font-medium text-slate-700">
                    {selectedNotification.isRead ? "Read" : "Unread"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Received
                  </p>
                  <p className="mt-1 font-medium text-slate-700">
                    {selectedNotification.createdAtLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-col">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedNotification.title}
                  </h2>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600">
                    <p>
                      <span className="mr-2 font-semibold text-slate-800">From:</span>
                      {formatEmailLine(
                        selectedNotification.from,
                        selectedNotification.fromEmail,
                        "no-reply@smartevents.local"
                      )}
                    </p>
                    <p>
                      <span className="mr-2 font-semibold text-slate-800">To:</span>
                      {formatEmailLine(
                        selectedNotification.recipientName,
                        selectedNotification.recipientEmail,
                        "user@demo.com"
                      )}
                    </p>
                    <p>
                      <span className="mr-2 font-semibold text-slate-800">Date:</span>
                      {selectedNotification.createdAtLabel}
                    </p>
                    <p>
                      <span className="mr-2 font-semibold text-slate-800">Subject:</span>
                      {selectedNotification.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeNotification}
                  className="rounded-none border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                  aria-label="Close notification"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-white px-6 py-6">
                <div className="mx-auto min-h-full max-w-2xl border border-slate-200 bg-white p-8 shadow-sm">
                  <div>
                    <p className="whitespace-pre-wrap text-[15px] leading-8 text-slate-700">
                      {selectedNotification.body || selectedNotification.message}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
};

export default UserNotifications;
