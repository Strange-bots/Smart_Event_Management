import { useState } from "react";
import DashboardLayout from "../../components/dashboard/dashboard";
import {
  Bell,
  Calendar,
  Mail,
  CheckCircle,
  AlertCircle,
  CheckCheck,
  User,
  BadgeCheck,
  Clock3,
} from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    type: "approval",
    title: "Event Approved",
    message: "Your event 'Annual Technology Summit 2024' has been approved and is now ready to publish.",
    date: "April 9, 2026",
    isRead: false,
    from: "Admin Team",
  },
  {
    id: "2",
    type: "adminMessage",
    title: "Changes Requested by Admin",
    message: "Please update the venue capacity and upload the revised event banner for 'Startup Pitch Night'.",
    date: "April 8, 2026",
    isRead: false,
    from: "Admin Team",
  },
  {
    id: "3",
    type: "pending",
    title: "Approval In Review",
    message: "Your event 'AI Career Fair' is currently under admin review. You will be notified once a decision is made.",
    date: "April 7, 2026",
    isRead: true,
    from: "Admin Team",
  },
  {
    id: "4",  
    type: "rejected",
    title: "Event Needs Revision",
    message: "Your event 'Data Science Workshop' was sent back for revision because the agenda details were incomplete.",
    date: "April 6, 2026",
    isRead: true,
    from: "Admin Team",
  },
  {
    id: "5",
    type: "adminMessage",
    title: "Publishing Reminder",
    message: "Admin has approved your event draft, but it will stay hidden until you publish it from the organizer dashboard.",
    date: "April 5, 2026",
    isRead: false,
    from: "Admin Team",
  },
];

const OrganizerNotifications = () => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "approval":
        return <BadgeCheck className="text-green-600" size={20} />;
      case "pending":
        return <Clock3 className="text-yellow-600" size={20} />;
      case "rejected":
        return <AlertCircle className="text-red-600" size={20} />;
      case "adminMessage":
        return <Mail className="text-[#1f4e79]" size={20} />;
      case "admin":
        return <User className="text-red-600" size={20} />;
      default:
        return <Bell className="text-gray-400" size={20} />;
    }
  };

  const getTypeBadge = (type) => {
    const colors = {
      approval: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
      rejected: "bg-red-100 text-red-700",
      adminMessage: "bg-blue-50 text-[#1f4e79]",
      admin: "bg-slate-100 text-slate-700",
    };
    const labels = {
      approval: "Approved",
      pending: "Pending Review",
      rejected: "Needs Revision",
      adminMessage: "Admin Message",
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
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1f4e79]">
              Notifications
            </h1>
            <p className="text-gray-500 mt-1">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "No pending admin updates."}
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

        {/* Stats */}
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

        {/* Notifications List */}
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "rounded-xl shadow-sm bg-white transition-all cursor-pointer hover:shadow-md",
                  !notification.isRead && "bg-orange-50 border-l-4 border-l-[#f36f21]"
                )}
                onClick={() => handleMarkAsRead(notification.id)}
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
                        <span>{notification.date}</span>
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
              You will receive admin messages and event approval status updates here.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OrganizerNotifications;
