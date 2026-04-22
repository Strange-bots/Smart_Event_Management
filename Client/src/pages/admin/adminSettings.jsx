import DashboardLayout from "@/components/dashboard/dashboard.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch as UiSwitch } from "@/components/ui/switch";
import {
  Settings,
  Bell,
  Shield,
  Palette,
  Save,
  Upload,
  X,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import koiLogo from "@/assets/koi-logo.jpg";
import { useState, useRef, useEffect } from "react";
import { getCurrentUser } from "@/utils/auth";

// ── Inline Switch ──────────────────────────────────────────────────────────────
function Switch({ checked, onCheckedChange, className = "" }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-primary" : "bg-input"
      } ${className}`}
    >
      <span
        className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ── Inline Tabs ────────────────────────────────────────────────────────────────
function TabsRoot({ defaultValue, className = "", children }) {
  const [active, setActive] = useState(defaultValue);
  const inject = (child) => {
    if (!child || typeof child !== "object") return child;
    return { ...child, props: { ...child.props, _active: active, _setActive: setActive } };
  };
  const kids = Array.isArray(children) ? children.map(inject) : inject(children);
  return <div className={className}>{kids}</div>;
}

function TabsList({ className = "", children, _active, _setActive }) {
  const inject = (child) => {
    if (!child || typeof child !== "object") return child;
    return { ...child, props: { ...child.props, _active, _setActive } };
  };
  const kids = Array.isArray(children) ? children.map(inject) : inject(children);
  return <div className={`inline-flex h-10 items-center justify-center rounded-md p-1 text-muted-foreground ${className}`}>{kids}</div>;
}

function TabsTrigger({ value, className = "", children, _active, _setActive }) {
  const isActive = _active === value;
  return (
    <button
      onClick={() => _setActive(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive ? "bg-background text-foreground shadow-sm" : "hover:bg-muted/50"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function TabsContent({ value, className = "", children, _active }) {
  if (_active !== value) return null;
  return <div className={className}>{children}</div>;
}

// ── Inline Textarea ────────────────────────────────────────────────────────────
function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

// ── Inline Toast ───────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };
  return { toasts, success: (msg) => show(msg, "success") };
}

function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="rounded-md bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── Theme helpers (replaces next-themes) ──────────────────────────────────────
const THEME_KEY = "sem_theme";
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";
const DEFAULT_SETTINGS = {
  organization: {
    name: "King's Own Institute",
    email: "events@koi.edu.au",
    address: "Level 1, 545 Kent Street, Sydney NSW 2000",
    logo: koiLogo,
  },
  events: {
    defaultCapacity: 100,
    registrationDeadline: 3,
    requireApproval: true,
    allowWaitlist: true,
  },
  notifications: {
    newRegistration: true,
    approvalRequests: true,
    eventReminders: true,
    feedbackRequests: true,
  },
  email: {
    smtpHost: "smtp.koi.edu.au",
    smtpPort: "587",
    smtpUser: "events@koi.edu.au",
    smtpPass: "********",
  },
  security: {
    twoFactorAuth: false,
    emailVerification: true,
    passwordComplexity: true,
    sessionTimeout: 30,
    maxSessions: 3,
  },
  appearance: {
    darkMode: false,
    primaryColor: "#1F4E79",
    accentColor: "#F36F21",
  },
};

const mergeSettings = (nextSettings = {}) => ({
  organization: { ...DEFAULT_SETTINGS.organization, ...nextSettings.organization },
  events: { ...DEFAULT_SETTINGS.events, ...nextSettings.events },
  notifications: { ...DEFAULT_SETTINGS.notifications, ...nextSettings.notifications },
  email: { ...DEFAULT_SETTINGS.email, ...nextSettings.email },
  security: { ...DEFAULT_SETTINGS.security, ...nextSettings.security },
  appearance: { ...DEFAULT_SETTINGS.appearance, ...nextSettings.appearance },
});

const settingRowClassName = "flex items-start justify-between gap-4 md:items-center";
const settingTextClassName = "min-w-0 flex-1 pr-2";

const getSettingsHeaders = () => {
  const currentUser = getCurrentUser();

  if (!currentUser?.email) {
    throw new Error("Admin session not found. Please log in again.");
  }

  return {
    "Content-Type": "application/json",
    "x-user-email": currentUser.email,
  };
};

const fetchAdminSettings = async () => {
  const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
    headers: getSettingsHeaders(),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Failed to load admin settings");
  }

  return data?.settings ?? {};
};

const saveAdminSettings = async (settings) => {
  const payload = {
    events: {
      requireApproval: settings.events.requireApproval,
      allowWaitlist: settings.events.allowWaitlist,
    },
    notifications: {
      newRegistration: settings.notifications.newRegistration,
      approvalRequests: settings.notifications.approvalRequests,
      eventReminders: settings.notifications.eventReminders,
      feedbackRequests: settings.notifications.feedbackRequests,
    },
    security: {
      twoFactorAuth: settings.security.twoFactorAuth,
      emailVerification: settings.security.emailVerification,
      passwordComplexity: settings.security.passwordComplexity,
      sessionTimeout: settings.security.sessionTimeout,
      maxSessions: settings.security.maxSessions,
    },
    appearance: {
      darkMode: settings.appearance.darkMode,
      primaryColor: settings.appearance.primaryColor,
      accentColor: settings.appearance.accentColor,
    },
  };

  const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
    method: "PUT",
    headers: getSettingsHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Failed to save admin settings");
  }

  return data?.settings ?? payload;
};

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

function useTheme() {
  const [theme, setThemeState] = useState(() => localStorage.getItem(THEME_KEY) || "system");
  const resolvedTheme = theme === "system" ? getSystemTheme() : theme;

  const setTheme = (t) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    applyTheme(t);
  };

  useEffect(() => {
    applyTheme(theme);
  }, []);

  return { theme, setTheme, resolvedTheme };
}

// ── Main Component ─────────────────────────────────────────────────────────────
const AdminSettings = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [previewLogo, setPreviewLogo] = useState(null);
  const [settings, setSettings] = useState(() => mergeSettings());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const backendSettings = await fetchAdminSettings();

        if (!isMounted) {
          return;
        }

        setSettings((prev) => mergeSettings({ ...prev, ...backendSettings }));
        if (typeof backendSettings?.appearance?.darkMode === "boolean") {
          setTheme(backendSettings.appearance.darkMode ? "dark" : "light");
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [setTheme]);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewLogo(url);
    }
  };

  const handleSaveChanges = async () => {
    if (previewLogo) {
      setSettings((prev) => ({
        ...prev,
        organization: { ...prev.organization, logo: previewLogo },
      }));
    }

    try {
      setIsSaving(true);
      const nextSettings = previewLogo
        ? {
            ...settings,
            organization: { ...settings.organization, logo: previewLogo },
          }
        : settings;
      const savedSettings = await saveAdminSettings(nextSettings);

      setSettings((prev) => mergeSettings({ ...prev, ...savedSettings }));

      if (typeof savedSettings?.appearance?.darkMode === "boolean") {
        setTheme(savedSettings.appearance.darkMode ? "dark" : "light");
      }

      toast.success("Settings saved successfully!");
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateOrganization = (field, value) => {
    setSettings((prev) => ({ ...prev, organization: { ...prev.organization, [field]: value } }));
  };

  const updateEvents = (field, value) => {
    setSettings((prev) => ({ ...prev, events: { ...prev.events, [field]: value } }));
  };

  const updateNotifications = (field, value) => {
    setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, [field]: value } }));
  };

  const updateEmail = (field, value) => {
    setSettings((prev) => ({ ...prev, email: { ...prev.email, [field]: value } }));
  };

  const updateSecurity = (field, value) => {
    setSettings((prev) => ({ ...prev, security: { ...prev.security, [field]: value } }));
  };

  const updateAppearance = (field, value) => {
    setSettings((prev) => ({ ...prev, appearance: { ...prev.appearance, [field]: value } }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-primary">
            System Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure platform settings and preferences
          </p>
          {isLoading && (
            <p className="mt-2 text-sm text-muted-foreground">Loading saved settings...</p>
          )}
          {loadError && (
            <p className="mt-2 text-sm text-red-600">{loadError}</p>
          )}
        </div>

        <TabsRoot defaultValue="general" className="space-y-6">
          <TabsList className="bg-card border">
            <TabsTrigger value="general" className="gap-2">
              <Settings size={16} /> General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell size={16} /> Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield size={16} /> Security
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette size={16} /> Appearance
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Organization Details</CardTitle>
                <CardDescription>Update your organization information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={settings.organization.name}
                      onChange={(e) => updateOrganization("name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgEmail">Contact Email</Label>
                    <Input
                      id="orgEmail"
                      type="email"
                      value={settings.organization.email}
                      onChange={(e) => updateOrganization("email", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgAddress">Address</Label>
                  <Textarea
                    id="orgAddress"
                    value={settings.organization.address}
                    onChange={(e) => updateOrganization("address", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Organization Logo</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={previewLogo || settings.organization.logo}
                        alt="Logo"
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      {previewLogo && (
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => setPreviewLogo(null)}
                        >
                          <X size={12} />
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={16} /> Change Logo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Event Settings</CardTitle>
                <CardDescription>Configure default event settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="defaultCapacity">Default Event Capacity</Label>
                    <Input
                      id="defaultCapacity"
                      type="number"
                      value={settings.events.defaultCapacity}
                      onChange={(e) => updateEvents("defaultCapacity", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationDeadline">Registration Deadline (days before)</Label>
                    <Input
                      id="registrationDeadline"
                      type="number"
                      value={settings.events.registrationDeadline}
                      onChange={(e) => updateEvents("registrationDeadline", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className={settingRowClassName}>
                  <div className={settingTextClassName}>
                    <p className="font-medium text-foreground">Require Admin Approval</p>
                    <p className="text-sm text-muted-foreground">Events need admin approval before going live</p>
                  </div>
                  <UiSwitch
                    checked={settings.events.requireApproval}
                    onCheckedChange={(checked) => updateEvents("requireApproval", checked)}
                    className="mt-1 border-[#c7d2e0] bg-[#dbe4ef] shadow-sm data-[state=checked]:border-[#1f4e79] data-[state=checked]:bg-[#1f4e79] md:mt-0"
                  />
                </div>
                <div className={settingRowClassName}>
                  <div className={settingTextClassName}>
                    <p className="font-medium text-foreground">Allow Waitlist</p>
                    <p className="text-sm text-muted-foreground">Enable waitlist when events are full</p>
                  </div>
                  <UiSwitch
                    checked={settings.events.allowWaitlist}
                    onCheckedChange={(checked) => updateEvents("allowWaitlist", checked)}
                    className="mt-1 border-[#c7d2e0] bg-[#dbe4ef] shadow-sm data-[state=checked]:border-[#1f4e79] data-[state=checked]:bg-[#1f4e79] md:mt-0"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Email Notifications</CardTitle>
                <CardDescription>Configure email notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={settingRowClassName}>
                  <div className={settingTextClassName}>
                    <p className="font-medium text-foreground">New Event Registration</p>
                    <p className="text-sm text-muted-foreground">Notify organizers of new registrations</p>
                  </div>
                  <UiSwitch
                    checked={settings.notifications.newRegistration}
                    onCheckedChange={(checked) => updateNotifications("newRegistration", checked)}
                    className="mt-1 border-[#c7d2e0] bg-[#dbe4ef] shadow-sm data-[state=checked]:border-[#1f4e79] data-[state=checked]:bg-[#1f4e79] md:mt-0"
                  />
                </div>
                <Separator />
                <div className={settingRowClassName}>
                  <div className={settingTextClassName}>
                    <p className="font-medium text-foreground">Event Approval Requests</p>
                    <p className="text-sm text-muted-foreground">Notify admins of pending approvals</p>
                  </div>
                  <UiSwitch
                    checked={settings.notifications.approvalRequests}
                    onCheckedChange={(checked) => updateNotifications("approvalRequests", checked)}
                    className="mt-1 border-[#c7d2e0] bg-[#dbe4ef] shadow-sm data-[state=checked]:border-[#1f4e79] data-[state=checked]:bg-[#1f4e79] md:mt-0"
                  />
                </div>
                <Separator />
                <div className={settingRowClassName}>
                  <div className={settingTextClassName}>
                    <p className="font-medium text-foreground">Event Reminders</p>
                    <p className="text-sm text-muted-foreground">Send reminders to registered users</p>
                  </div>
                  <UiSwitch
                    checked={settings.notifications.eventReminders}
                    onCheckedChange={(checked) => updateNotifications("eventReminders", checked)}
                    className="mt-1 border-[#c7d2e0] bg-[#dbe4ef] shadow-sm data-[state=checked]:border-[#1f4e79] data-[state=checked]:bg-[#1f4e79] md:mt-0"
                  />
                </div>
                <Separator />
                <div className={settingRowClassName}>
                  <div className={settingTextClassName}>
                    <p className="font-medium text-foreground">Feedback Requests</p>
                    <p className="text-sm text-muted-foreground">Request feedback after events</p>
                  </div>
                  <UiSwitch
                    checked={settings.notifications.feedbackRequests}
                    onCheckedChange={(checked) => updateNotifications("feedbackRequests", checked)}
                    className="mt-1 border-[#c7d2e0] bg-[#dbe4ef] shadow-sm data-[state=checked]:border-[#1f4e79] data-[state=checked]:bg-[#1f4e79] md:mt-0"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Email Configuration</CardTitle>
                <CardDescription>Configure SMTP settings for outgoing emails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={settings.email.smtpHost}
                      onChange={(e) => updateEmail("smtpHost", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      value={settings.email.smtpPort}
                      onChange={(e) => updateEmail("smtpPort", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="smtpUser">SMTP Username</Label>
                    <Input
                      id="smtpUser"
                      value={settings.email.smtpUser}
                      onChange={(e) => updateEmail("smtpUser", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPass">SMTP Password</Label>
                    <Input
                      id="smtpPass"
                      type="password"
                      value={settings.email.smtpPass}
                      onChange={(e) => updateEmail("smtpPass", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Authentication Settings</CardTitle>
                <CardDescription>Configure security and authentication options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={settingRowClassName}>
                  <div className={settingTextClassName}>
                    <p className="font-medium text-foreground">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
                  </div>
                  <UiSwitch
                    checked={settings.security.twoFactorAuth}
                    onCheckedChange={(checked) => updateSecurity("twoFactorAuth", checked)}
                    className="mt-1 border-[#c7d2e0] bg-[#dbe4ef] shadow-sm data-[state=checked]:border-[#1f4e79] data-[state=checked]:bg-[#1f4e79] md:mt-0"
                  />
                </div>
                <Separator />
                <div className={settingRowClassName}>
                  <div className={settingTextClassName}>
                    <p className="font-medium text-foreground">Email Verification Required</p>
                    <p className="text-sm text-muted-foreground">Users must verify email to register</p>
                  </div>
                  <UiSwitch
                    checked={settings.security.emailVerification}
                    onCheckedChange={(checked) => updateSecurity("emailVerification", checked)}
                    className="mt-1 border-[#c7d2e0] bg-[#dbe4ef] shadow-sm data-[state=checked]:border-[#1f4e79] data-[state=checked]:bg-[#1f4e79] md:mt-0"
                  />
                </div>
                <Separator />
                <div className={settingRowClassName}>
                  <div className={settingTextClassName}>
                    <p className="font-medium text-foreground">Password Complexity</p>
                    <p className="text-sm text-muted-foreground">Enforce strong password requirements</p>
                  </div>
                  <UiSwitch
                    checked={settings.security.passwordComplexity}
                    onCheckedChange={(checked) => updateSecurity("passwordComplexity", checked)}
                    className="mt-1 border-[#c7d2e0] bg-[#dbe4ef] shadow-sm data-[state=checked]:border-[#1f4e79] data-[state=checked]:bg-[#1f4e79] md:mt-0"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Session Settings</CardTitle>
                <CardDescription>Configure session timeout and security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSecurity("sessionTimeout", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxSessions">Max Concurrent Sessions</Label>
                    <Input
                      id="maxSessions"
                      type="number"
                      value={settings.security.maxSessions}
                      onChange={(e) => updateSecurity("maxSessions", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Theme Settings</CardTitle>
                <CardDescription>Customize the look and feel of the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Toggle Buttons */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Theme Mode</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select your preferred theme for the platform
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      className={`flex flex-col items-center gap-2 h-auto py-4 ${
                        theme === "light" ? "bg-primary text-primary-foreground" : ""
                      }`}
                      onClick={() => {
                        setTheme("light");
                        updateAppearance("darkMode", false);
                        toast.success("Light theme applied");
                      }}
                    >
                      <Sun size={24} />
                      <span className="text-sm font-medium">Light</span>
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      className={`flex flex-col items-center gap-2 h-auto py-4 ${
                        theme === "dark" ? "bg-primary text-primary-foreground" : ""
                      }`}
                      onClick={() => {
                        setTheme("dark");
                        updateAppearance("darkMode", true);
                        toast.success("Dark theme applied");
                      }}
                    >
                      <Moon size={24} />
                      <span className="text-sm font-medium">Dark</span>
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      className={`flex flex-col items-center gap-2 h-auto py-4 ${
                        theme === "system" ? "bg-primary text-primary-foreground" : ""
                      }`}
                      onClick={() => {
                        setTheme("system");
                        toast.success("System theme applied");
                      }}
                    >
                      <Monitor size={24} />
                      <span className="text-sm font-medium">System</span>
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Quick Toggle Switch */}
                <div className={settingRowClassName}>
                  <div className={settingTextClassName}>
                    <p className="font-medium text-foreground">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Quick toggle between light and dark mode
                    </p>
                  </div>
                  <UiSwitch
                    checked={resolvedTheme === "dark"}
                    onCheckedChange={(checked) => {
                      setTheme(checked ? "dark" : "light");
                      updateAppearance("darkMode", checked);
                      toast.success(checked ? "Dark mode enabled" : "Light mode enabled");
                    }}
                    className="mt-1 border-[#c7d2e0] bg-[#dbe4ef] shadow-sm data-[state=checked]:border-[#1f4e79] data-[state=checked]:bg-[#1f4e79] md:mt-0"
                  />
                </div>

                <Separator />

                {/* Color Customization */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Brand Colors</Label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm">Primary Color</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.appearance.primaryColor}
                          onChange={(e) => updateAppearance("primaryColor", e.target.value)}
                          className="w-10 h-10 rounded-lg border cursor-pointer"
                        />
                        <Input
                          value={settings.appearance.primaryColor}
                          onChange={(e) => updateAppearance("primaryColor", e.target.value)}
                          className="max-w-32"
                          placeholder="#1F4E79"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Accent Color</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.appearance.accentColor}
                          onChange={(e) => updateAppearance("accentColor", e.target.value)}
                          className="w-10 h-10 rounded-lg border cursor-pointer"
                        />
                        <Input
                          value={settings.appearance.accentColor}
                          onChange={(e) => updateAppearance("accentColor", e.target.value)}
                          className="max-w-32"
                          placeholder="#F36F21"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Theme Preview */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Preview</Label>
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold">P</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Primary Element</p>
                        <p className="text-sm text-muted-foreground">Using primary color</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="brand" size="sm">Brand Button</Button>
                      <Button variant="outline" size="sm">Outline</Button>
                      <Button variant="secondary" size="sm">Secondary</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </TabsRoot>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button variant="brand" className="gap-2" onClick={handleSaveChanges}>
            <Save size={18} />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <ToastContainer toasts={toast.toasts} />
    </DashboardLayout>
  );
};

export default AdminSettings;
