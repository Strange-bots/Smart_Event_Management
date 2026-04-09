// Global event and notification store for the application
// This store uses localStorage for session persistence

const EVENTS_STORAGE_KEY = "sem_events";
const REGISTRATIONS_STORAGE_KEY = "sem_registrations";
const NOTIFICATIONS_STORAGE_KEY = "sem_notifications";
const RECEIPTS_STORAGE_KEY = "sem_receipts";

// Initial mock events for organizers
const initialEvents = [
  {
    id: 1,
    title: "Tech Workshop 2024",
    description: "Learn the latest in web development technologies including React, Node.js, and cloud computing.",
    date: "March 10, 2024",
    time: "10:00 AM - 4:00 PM",
    venue: "Computer Lab A",
    capacity: 50,
    price: 0,
    isPaid: false,
    tags: ["Technology", "Workshop"],
    category: "Technology",
    registrations: 45,
    status: "approved",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=300&q=80",
    organizerId: "organizer-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Career Guidance Session",
    description: "Expert career counselors will help you navigate your professional journey.",
    date: "March 15, 2024",
    time: "2:00 PM - 5:00 PM",
    venue: "Conference Hall",
    capacity: 100,
    price: 0,
    isPaid: false,
    tags: ["Career", "Professional Development"],
    category: "Professional Development",
    registrations: 32,
    status: "pending",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=300&q=80",
    organizerId: "organizer-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    title: "Annual Seminar",
    description: "Our annual seminar bringing together students, faculty, and industry leaders.",
    date: "March 20, 2024",
    time: "9:00 AM - 5:00 PM",
    venue: "Main Auditorium",
    capacity: 200,
    price: 25,
    isPaid: true,
    tags: ["Academic", "Networking"],
    category: "Academic",
    registrations: 73,
    status: "approved",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&q=80",
    organizerId: "organizer-1",
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    title: "AI & Machine Learning Seminar",
    description: "Explore the future of artificial intelligence and its applications in business.",
    date: "March 25, 2024",
    time: "9:00 AM - 12:00 PM",
    venue: "Main Auditorium",
    capacity: 150,
    price: 15,
    isPaid: true,
    tags: ["Technology", "AI"],
    category: "Technology",
    registrations: 85,
    status: "approved",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&q=80",
    organizerId: "organizer-1",
    createdAt: new Date().toISOString(),
  },
];

const initialRegistrations = [
  { id: 1, userId: "user-1", userName: "John Smith", userEmail: "john.smith@student.koi.edu.au", userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80", eventId: 1, eventTitle: "Tech Workshop 2024", registrationDate: "March 1, 2024", paymentStatus: "paid", attendanceStatus: "attended", amount: 0, noShowCount: 0, lateCancellations: 0, unpaidCount: 0 },
  { id: 2, userId: "user-2", userName: "Sarah Johnson", userEmail: "sarah.johnson@student.koi.edu.au", userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80", eventId: 1, eventTitle: "Tech Workshop 2024", registrationDate: "March 2, 2024", paymentStatus: "paid", attendanceStatus: "registered", amount: 0, noShowCount: 2, lateCancellations: 1, unpaidCount: 0 },
  { id: 3, userId: "user-3", userName: "Michael Chen", userEmail: "michael.chen@student.koi.edu.au", userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80", eventId: 2, eventTitle: "Career Guidance Session", registrationDate: "March 3, 2024", paymentStatus: "unpaid", attendanceStatus: "registered", amount: 0, noShowCount: 3, lateCancellations: 2, unpaidCount: 3 },
  { id: 4, userId: "user-4", userName: "Emily Davis", userEmail: "emily.davis@student.koi.edu.au", userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80", eventId: 3, eventTitle: "Annual Seminar", registrationDate: "March 4, 2024", paymentStatus: "paid", attendanceStatus: "registered", amount: 25, noShowCount: 0, lateCancellations: 0, unpaidCount: 0 },
  { id: 5, userId: "user-5", userName: "Robert Wilson", userEmail: "robert.wilson@student.koi.edu.au", userAvatar: null, eventId: 1, eventTitle: "Tech Workshop 2024", registrationDate: "March 5, 2024", paymentStatus: "unpaid", attendanceStatus: "cancelled", amount: 0, noShowCount: 1, lateCancellations: 3, unpaidCount: 2 },
  { id: 6, userId: "user-demo-1", userName: "Demo User", userEmail: "user@demo.com", userAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=DU", eventId: 1, eventTitle: "Tech Workshop 2024", registrationDate: "March 6, 2024", paymentStatus: "paid", attendanceStatus: "attended", amount: 0, noShowCount: 0, lateCancellations: 0, unpaidCount: 0 },
  { id: 7, userId: "user-demo-1", userName: "Demo User", userEmail: "user@demo.com", userAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=DU", eventId: 3, eventTitle: "Annual Seminar", registrationDate: "March 5, 2024", paymentStatus: "paid", attendanceStatus: "registered", amount: 25, noShowCount: 0, lateCancellations: 0, unpaidCount: 0 },
  { id: 8, userId: "user-demo-1", userName: "Demo User", userEmail: "user@demo.com", userAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=DU", eventId: 4, eventTitle: "AI & Machine Learning Seminar", registrationDate: "March 20, 2024", paymentStatus: "paid", attendanceStatus: "attended", amount: 15, noShowCount: 0, lateCancellations: 0, unpaidCount: 0 },
];

const initialFeedback = [
  { id: 1, eventId: 1, eventTitle: "Tech Workshop 2024", userId: "user-1", userName: "John Smith", rating: 5, comment: "Excellent workshop! The content was very practical and the instructors were knowledgeable.", dateSubmitted: "March 11, 2024", isAnonymous: false },
  { id: 2, eventId: 1, eventTitle: "Tech Workshop 2024", userId: "user-2", userName: "Anonymous", rating: 4, comment: "Great session, would love more hands-on exercises.", dateSubmitted: "March 11, 2024", isAnonymous: true },
];

const initialNotifications = [
  { id: "notif-1", userId: "user-1", type: "registration", title: "Registration Confirmed", message: "Your registration for Tech Workshop 2024 has been confirmed.", date: "March 1, 2024", isRead: true, eventId: 1 },
  { id: "notif-2", userId: "user-1", type: "reminder", title: "Event Reminder", message: "Tech Workshop 2024 is happening tomorrow at 10:00 AM!", date: "March 9, 2024", isRead: false, eventId: 1 },
  { id: "notif-3", userId: "user-1", type: "system", title: "Welcome to Smart Events", message: "Welcome to the Smart Events platform. Explore upcoming events tailored for you!", date: "February 28, 2024", isRead: true },
];

const initializeEvents = () => {
  const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(initialEvents));
  return [...initialEvents];
};

const initializeRegistrations = () => {
  const stored = localStorage.getItem(REGISTRATIONS_STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(initialRegistrations));
  return [...initialRegistrations];
};

const initializeNotifications = () => {
  const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(initialNotifications));
  return [...initialNotifications];
};

const initializeReceipts = () => {
  const stored = localStorage.getItem(RECEIPTS_STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  return [];
};

let events = initializeEvents();
let registrations = initializeRegistrations();
let feedback = [...initialFeedback];
let notifications = initializeNotifications();
let emailLogs = [];
let adminEmailLogs = [];
let receipts = initializeReceipts();

const saveEvents = () => localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
const saveRegistrations = () => localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(registrations));
const saveNotifications = () => localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
const saveReceipts = () => localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(receipts));

export const resetDemoData = () => {
  localStorage.removeItem(EVENTS_STORAGE_KEY);
  localStorage.removeItem(REGISTRATIONS_STORAGE_KEY);
  localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
  localStorage.removeItem(RECEIPTS_STORAGE_KEY);
  events = [...initialEvents];
  registrations = [...initialRegistrations];
  notifications = [...initialNotifications];
  feedback = [...initialFeedback];
  receipts = [];
  emailLogs = [];
  adminEmailLogs = [];
  saveEvents();
  saveRegistrations();
  saveNotifications();
  window.dispatchEvent(new Event("storage"));
};

export const getEvents = () => [...events];
export const getApprovedEvents = () => events.filter(e => e.status === "approved");
export const getPendingEvents = () => events.filter(e => e.status === "pending");
export const getEventById = (id) => events.find(e => e.id === id);
export const getOrganizerEvents = (organizerId) => events.filter(e => e.organizerId === organizerId);

export const addEvent = (event) => {
  const newEvent = {
    ...event,
    id: Math.max(...events.map(e => e.id), 0) + 1,
    registrations: 0,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  events = [...events, newEvent];
  saveEvents();
  return newEvent;
};

export const updateEvent = (id, updates) => {
  events = events.map(e => e.id === id ? { ...e, ...updates } : e);
  saveEvents();
  return events.find(e => e.id === id);
};

export const approveEvent = (id) => updateEvent(id, { status: "approved" });
export const rejectEvent = (id) => updateEvent(id, { status: "rejected" });

export const deleteEvent = (id) => {
  events = events.filter(e => e.id !== id);
  saveEvents();
};

export const getRegistrations = () => [...registrations];
export const getEventRegistrations = (eventId) => registrations.filter(r => r.eventId === eventId);
export const getUserRegistrations = (userId) => registrations.filter(r => r.userId === userId);

export const addRegistration = (registration) => {
  const newReg = {
    ...registration,
    id: Math.max(...registrations.map(r => r.id), 0) + 1,
  };
  registrations = [...registrations, newReg];
  saveRegistrations();
  const event = events.find(e => e.id === registration.eventId);
  if (event) {
    updateEvent(event.id, { registrations: event.registrations + 1 });
  }
  return newReg;
};

export const updateRegistration = (id, updates) => {
  registrations = registrations.map(r => r.id === id ? { ...r, ...updates } : r);
  saveRegistrations();
  return registrations.find(r => r.id === id);
};

export const cancelRegistration = (id) => {
  const reg = registrations.find(r => r.id === id);
  if (reg) {
    updateRegistration(id, { attendanceStatus: "cancelled" });
    const event = events.find(e => e.id === reg.eventId);
    if (event && event.registrations > 0) {
      updateEvent(event.id, { registrations: event.registrations - 1 });
    }
  }
};

export const getFeedback = () => [...feedback];
export const getEventFeedback = (eventId) => feedback.filter(f => f.eventId === eventId);
export const getOrganizerFeedback = (organizerId) => {
  const orgEvents = events.filter(e => e.organizerId === organizerId);
  const eventIds = orgEvents.map(e => e.id);
  return feedback.filter(f => eventIds.includes(f.eventId));
};

export const addFeedback = (fb) => {
  const newFeedback = {
    ...fb,
    id: Math.max(...feedback.map(f => f.id), 0) + 1,
  };
  feedback = [...feedback, newFeedback];
  return newFeedback;
};

export const getNotifications = () => [...notifications];
export const getUserNotifications = (userId) =>
  notifications.filter(n => n.userId === userId).sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

export const addNotification = (notification) => {
  const newNotif = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
  };
  notifications = [...notifications, newNotif];
  saveNotifications();
  return newNotif;
};

export const markNotificationRead = (id) => {
  notifications = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
  saveNotifications();
};

export const markAllNotificationsRead = (userId) => {
  notifications = notifications.map(n => n.userId === userId ? { ...n, isRead: true } : n);
  saveNotifications();
};

export const getEmailLogs = () => [...emailLogs];
export const getOrganizerEmailLogs = (organizerId) => emailLogs.filter(log => log.sentBy === organizerId);

export const addEmailLog = (log) => {
  const newLog = { ...log, id: `email-${Date.now()}` };
  emailLogs = [...emailLogs, newLog];
  return newLog;
};

export const getAdminEmailLogs = () => [...adminEmailLogs];

export const addAdminEmailLog = (log) => {
  const newLog = { ...log, id: `admin-email-${Date.now()}` };
  adminEmailLogs = [...adminEmailLogs, newLog];
  return newLog;
};

export const getReceipts = () => [...receipts];
export const getUserReceipts = (userId) => receipts.filter(r => r.userId === userId);

export const addReceipt = (receipt) => {
  const newReceipt = {
    ...receipt,
    id: `RCP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  };
  receipts = [...receipts, newReceipt];
  saveReceipts();
  return newReceipt;
};

export const calculateAttendanceRisk = (registration) => {
  const { noShowCount, lateCancellations, unpaidCount } = registration;
  if (noShowCount >= 3 || (noShowCount >= 2 && lateCancellations >= 2) || unpaidCount >= 3) return "red";
  if (noShowCount >= 1 || lateCancellations >= 2 || unpaidCount >= 2) return "amber";
  return "green";
};

export const getRiskReason = (registration) => {
  const { noShowCount, lateCancellations, unpaidCount } = registration;
  const reasons = [];
  if (noShowCount > 0) reasons.push(`${noShowCount} no-show(s) in past events`);
  if (lateCancellations > 0) reasons.push(`${lateCancellations} late cancellation(s)`);
  if (unpaidCount > 0) reasons.push(`${unpaidCount} unpaid registration(s)`);
  return reasons.length > 0 ? reasons.join(", ") : "Good attendance history";
};
