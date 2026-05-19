import { useEffect, useMemo, useRef, useState } from "react";
import { Moon, Palette, RotateCcw, Save, Settings, Shield, Sun, Upload } from "lucide-react";
import DashboardLayout from "@/components/dashboard/dashboard.jsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import koiLogo from "@/assets/koi-logo.jpg";
import { fetchAdminSettings, saveAdminSettings } from "@/services/adminSettingsService.js";
import { applyAppearanceSettings, getDefaultAppearance } from "@/utils/appearance.js";

const DEFAULT_SETTINGS = {
  organization: {
    name: "King's Own Institute",
    email: "events@koi.edu.au",
    phone: "+61 2 9283 3583",
    address: "Level 1, 545 Kent Street, Sydney NSW 2000",
    logo: koiLogo,
  },
  events: {
    defaultCapacity: 100,
    registrationDeadline: 3,
    requireApproval: true,
    allowWaitlist: true,
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
    themeMode: "light",
    darkMode: false,
    primaryColor: "#1F4E79",
    accentColor: "#F36F21",
  },
};

const mergeSettings = (nextSettings = {}) => ({
  organization: {
    ...DEFAULT_SETTINGS.organization,
    ...nextSettings.organization,
    logo: nextSettings?.organization?.logo || DEFAULT_SETTINGS.organization.logo,
  },
  events: { ...DEFAULT_SETTINGS.events, ...nextSettings.events },
  email: { ...DEFAULT_SETTINGS.email, ...nextSettings.email },
  security: { ...DEFAULT_SETTINGS.security, ...nextSettings.security },
  appearance: { ...DEFAULT_SETTINGS.appearance, ...nextSettings.appearance },
});

const tabs = [
  { id: "general", label: "General", icon: Settings },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
];

function AdminSettings() {
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState(() => mergeSettings());
  const [previewLogo, setPreviewLogo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");

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

        const merged = mergeSettings(backendSettings);
        setSettings(merged);
        applyAppearanceSettings(merged.appearance);
      } catch (error) {
        if (isMounted) {
          setLoadError(error.message || "Failed to load admin settings.");
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
  }, []);

  const logoPreview = useMemo(
    () => previewLogo || settings.organization.logo || koiLogo,
    [previewLogo, settings.organization.logo],
  );

  const updateSection = (section, field, value) => {
    setSettings((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    if (section === "appearance") {
      const nextAppearance = {
        ...settings.appearance,
        [field]: value,
      };
      applyAppearanceSettings(nextAppearance);
    }
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreviewLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetAppearance = () => {
    const defaultAppearance = getDefaultAppearance();
    setSettings((prev) => ({ ...prev, appearance: defaultAppearance }));
    applyAppearanceSettings(defaultAppearance);
    window.localStorage.removeItem("sem-theme");
    window.localStorage.removeItem("sem-brand-color");
    window.localStorage.removeItem("sem-secondary-color");
    setNotice("Appearance reset to defaults.");
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      setLoadError("");
      setNotice("");
      const nextSettings = previewLogo
        ? {
            ...settings,
            organization: { ...settings.organization, logo: previewLogo },
          }
        : settings;

      const savedSettings = await saveAdminSettings(nextSettings);
      const merged = mergeSettings(savedSettings);
      setSettings(merged);
      setPreviewLogo(null);
      applyAppearanceSettings(merged.appearance);
      setNotice("Settings saved successfully.");
    } catch (error) {
      setLoadError(error.message || "Failed to save admin settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary md:text-3xl">System Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Manage platform settings that are currently active in the application.
          </p>
          {isLoading ? <p className="mt-2 text-sm text-muted-foreground">Loading saved settings...</p> : null}
          {loadError ? <p className="mt-2 text-sm text-red-600">{loadError}</p> : null}
          {notice ? <p className="mt-2 text-sm text-emerald-700">{notice}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "border-[#f36f21] bg-[#f36f21] text-white"
                    : "border-[#d9e2ec] bg-white text-[#0f1e33] hover:border-[#1f4e79]"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "general" ? (
          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>Update the public organization details shown across the app.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input id="orgName" value={settings.organization.name} onChange={(e) => updateSection("organization", "name", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgEmail">Contact Email</Label>
                    <Input id="orgEmail" type="email" value={settings.organization.email} onChange={(e) => updateSection("organization", "email", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgPhone">Contact Phone</Label>
                    <Input id="orgPhone" value={settings.organization.phone} onChange={(e) => updateSection("organization", "phone", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgAddress">Address</Label>
                    <Input id="orgAddress" value={settings.organization.address} onChange={(e) => updateSection("organization", "address", e.target.value)} />
                  </div>
                </div>

                <div className="flex flex-col gap-4 rounded-xl border border-[#d9e2ec] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <img src={logoPreview} alt={settings.organization.name} className="h-16 w-16 rounded-lg object-cover" />
                    <div>
                      <p className="font-medium text-[#0f1e33]">Organization Logo</p>
                      <p className="text-sm text-muted-foreground">Upload a square logo for branding across the platform.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    <Button type="button" variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                      <Upload size={16} />
                      Upload Logo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Event Defaults</CardTitle>
                <CardDescription>Control the default event setup values used across admin workflows.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="defaultCapacity">Default Capacity</Label>
                    <Input id="defaultCapacity" type="number" min="1" value={settings.events.defaultCapacity} onChange={(e) => updateSection("events", "defaultCapacity", Number(e.target.value) || 1)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationDeadline">Registration Deadline (days)</Label>
                    <Input id="registrationDeadline" type="number" min="1" value={settings.events.registrationDeadline} onChange={(e) => updateSection("events", "registrationDeadline", Number(e.target.value) || 1)} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex items-center justify-between rounded-xl border border-[#d9e2ec] px-4 py-3">
                    <span className="text-sm font-medium text-[#0f1e33]">Require approval</span>
                    <Switch checked={settings.events.requireApproval} onCheckedChange={(checked) => updateSection("events", "requireApproval", checked)} />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-[#d9e2ec] px-4 py-3">
                    <span className="text-sm font-medium text-[#0f1e33]">Allow waitlist</span>
                    <Switch checked={settings.events.allowWaitlist} onCheckedChange={(checked) => updateSection("events", "allowWaitlist", checked)} />
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Email Settings</CardTitle>
                <CardDescription>SMTP details used by the platform for outgoing mail.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input id="smtpHost" value={settings.email.smtpHost} onChange={(e) => updateSection("email", "smtpHost", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input id="smtpPort" value={settings.email.smtpPort} onChange={(e) => updateSection("email", "smtpPort", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpUser">SMTP User</Label>
                    <Input id="smtpUser" value={settings.email.smtpUser} onChange={(e) => updateSection("email", "smtpUser", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPass">SMTP Password</Label>
                    <Input id="smtpPass" type="password" value={settings.email.smtpPass} onChange={(e) => updateSection("email", "smtpPass", e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {activeTab === "security" ? (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>These settings affect authentication and account protection rules.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center justify-between rounded-xl border border-[#d9e2ec] px-4 py-3">
                  <span className="text-sm font-medium text-[#0f1e33]">Two-factor authentication</span>
                  <Switch checked={settings.security.twoFactorAuth} onCheckedChange={(checked) => updateSection("security", "twoFactorAuth", checked)} />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-[#d9e2ec] px-4 py-3">
                  <span className="text-sm font-medium text-[#0f1e33]">Email verification</span>
                  <Switch checked={settings.security.emailVerification} onCheckedChange={(checked) => updateSection("security", "emailVerification", checked)} />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-[#d9e2ec] px-4 py-3 sm:col-span-2">
                  <span className="text-sm font-medium text-[#0f1e33]">Password complexity</span>
                  <Switch checked={settings.security.passwordComplexity} onCheckedChange={(checked) => updateSection("security", "passwordComplexity", checked)} />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input id="sessionTimeout" type="number" min="1" value={settings.security.sessionTimeout} onChange={(e) => updateSection("security", "sessionTimeout", Number(e.target.value) || 1)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxSessions">Max Concurrent Sessions</Label>
                  <Input id="maxSessions" type="number" min="1" value={settings.security.maxSessions} onChange={(e) => updateSection("security", "maxSessions", Number(e.target.value) || 1)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {activeTab === "appearance" ? (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Update the public brand colors and default theme mode.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => updateSection("appearance", "themeMode", "light")}
                  className={`rounded-xl border p-4 text-left ${settings.appearance.themeMode === "light" ? "border-[#f36f21]" : "border-[#d9e2ec]"}`}
                >
                  <Sun size={18} className="mb-2 text-[#f36f21]" />
                  <p className="font-medium text-[#0f1e33]">Light</p>
                </button>
                <button
                  type="button"
                  onClick={() => updateSection("appearance", "themeMode", "dark")}
                  className={`rounded-xl border p-4 text-left ${settings.appearance.themeMode === "dark" ? "border-[#f36f21]" : "border-[#d9e2ec]"}`}
                >
                  <Moon size={18} className="mb-2 text-[#1f4e79]" />
                  <p className="font-medium text-[#0f1e33]">Dark</p>
                </button>
                <button
                  type="button"
                  onClick={() => updateSection("appearance", "themeMode", "system")}
                  className={`rounded-xl border p-4 text-left ${settings.appearance.themeMode === "system" ? "border-[#f36f21]" : "border-[#d9e2ec]"}`}
                >
                  <Palette size={18} className="mb-2 text-[#0f1e33]" />
                  <p className="font-medium text-[#0f1e33]">System</p>
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-3">
                    <Input id="primaryColor" type="color" value={settings.appearance.primaryColor} onChange={(e) => updateSection("appearance", "primaryColor", e.target.value.toUpperCase())} className="h-11 w-16 p-1" />
                    <Input value={settings.appearance.primaryColor} onChange={(e) => updateSection("appearance", "primaryColor", e.target.value.toUpperCase())} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-3">
                    <Input id="accentColor" type="color" value={settings.appearance.accentColor} onChange={(e) => updateSection("appearance", "accentColor", e.target.value.toUpperCase())} className="h-11 w-16 p-1" />
                    <Input value={settings.appearance.accentColor} onChange={(e) => updateSection("appearance", "accentColor", e.target.value.toUpperCase())} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" className="gap-2" onClick={handleResetAppearance}>
                  <RotateCcw size={16} />
                  Reset Appearance
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="flex justify-end">
          <Button type="button" variant="brand" className="gap-2" disabled={isSaving || isLoading} onClick={handleSaveChanges}>
            <Save size={16} />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AdminSettings;
