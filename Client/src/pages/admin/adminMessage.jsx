import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/dashboard/dashboard.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  CheckCircle,
  Eye,
  FileText,
  Mail,
  Search,
  Send,
  Users,
} from "lucide-react";
import AIEmailComposer from "@/components/messaging/AIemailComposer.jsx";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  fetchAdminMailTemplates,
  fetchAdminMessageLogs,
  sendAdminMessage,
} from "@/services/messagingService.js";
import { fetchAdminUsers } from "@/services/adminUserService.js";

function AdminMessage() {
  const [activeTab, setActiveTab] = useState("compose");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [selectedRecipients, setSelectedRecipients] = useState("");
  const [selectedTone, setSelectedTone] = useState("formal");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [emailLogs, setEmailLogs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState([]);

  const normalizeRole = (role) => String(role || "").trim().toLowerCase();

  useEffect(() => {
    let isMounted = true;

    const loadMessagingData = async () => {
      try {
        setIsLoading(true);
        const [logs, users] = await Promise.all([
          fetchAdminMessageLogs(),
          fetchAdminUsers(),
        ]);

        if (!isMounted) {
          return;
        }

        setEmailLogs(logs);
        setAllUsers(users);
        setError(
          users.length === 0
            ? "No non-admin users are currently available for admin messaging."
            : ""
        );
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setEmailLogs([]);
        setAllUsers([]);
        setError(loadError.message || "Unable to load message history.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadMessagingData();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalUsers = useMemo(
    () =>
      allUsers.filter((user) => {
        const role = normalizeRole(user.role);
        return role !== "admin" && role !== "organizer";
      }).length,
    [allUsers]
  );

  const totalOrganizers = useMemo(
    () =>
      allUsers.filter((user) => normalizeRole(user.role) === "organizer").length,
    [allUsers]
  );

  const recipientOptions = [
    { value: "all-users", label: "All Users", count: totalUsers },
    { value: "all-organizers", label: "All Organizers", count: totalOrganizers },
    { value: "all", label: "Everyone", count: totalUsers + totalOrganizers },
  ];

  const individualRecipientOptions = useMemo(
    () =>
      allUsers
        .filter((user) => normalizeRole(user.role) !== "admin")
        .map((user) => ({
          value: `individual:${user.email}`,
          label: `${user.name} (${user.role})`,
          count: 1,
        })),
    [allUsers]
  );

  const allRecipientOptions = useMemo(
    () => [
      ...recipientOptions,
      ...individualRecipientOptions,
    ],
    [individualRecipientOptions, recipientOptions]
  );

  const recipientCount = useMemo(() => {
    switch (selectedRecipients) {
      case "all-users":
        return totalUsers;
      case "all-organizers":
        return totalOrganizers;
      case "all":
        return totalUsers + totalOrganizers;
      default:
        return selectedRecipients.startsWith("individual:") ? 1 : 0;
    }
  }, [selectedRecipients, totalOrganizers, totalUsers]);

  const loadTemplates = async ({ tone, recipientGroup, subjectHint }) => {
    if (!recipientGroup) {
      setTemplates([]);
      return;
    }

    const result = await fetchAdminMailTemplates({
      tone,
      recipientGroup,
      subjectHint,
    });

    setTemplates(result.templates);

    if (result.source !== "gemini" && result.reason) {
      toast.info(`Mail templates loaded with server fallback: ${result.reason}`);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedRecipients) {
      toast.error("Select a recipient group first.");
      return;
    }

    await loadTemplates({
      tone: selectedTone,
      recipientGroup: selectedRecipients,
      subjectHint: subject,
    });
  };

  useEffect(() => {
    if (!selectedRecipients) {
      setTemplates([]);
      return;
    }

    loadTemplates({
      tone: selectedTone,
      recipientGroup: selectedRecipients,
      subjectHint: subject,
    }).catch((loadError) => {
      setTemplates([]);
      toast.error(loadError.message || "Unable to load AI templates.");
    });
  }, [selectedRecipients, selectedTone, subject]);

  const handleSend = async () => {
    if (!subject || !body || !selectedRecipients) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSending(true);
      const result = await sendAdminMessage({
        recipientGroup: selectedRecipients,
        subject,
        body,
      });

      setEmailLogs((prev) => [result.log, ...prev]);
      setSubject("");
      setBody("");
      setSelectedRecipients("");
      setActiveTab("sent");
      toast.success(`Email sent to ${result.recipientCount} recipient(s)!`);
    } catch (sendError) {
      toast.error(sendError.message || "Could not send message.");
    } finally {
      setIsSending(false);
    }
  };

  const filteredLogs = emailLogs.filter((log) => {
    const normalizedQuery = searchQuery.toLowerCase();
    return (
      log.subject.toLowerCase().includes(normalizedQuery) ||
      log.recipientGroup.toLowerCase().includes(normalizedQuery)
    );
  });

  const getRecipientLabel = (group) => {
    if (String(group || "").startsWith("individual:")) {
      const email = String(group).slice("individual:".length);
      const matchedUser = allUsers.find(
        (user) => user.email.toLowerCase() === email.toLowerCase()
      );

      return matchedUser
        ? `${matchedUser.name} (${matchedUser.role})`
        : email;
    }

    switch (group) {
      case "all-users":
        return "All Users";
      case "all-organizers":
        return "All Organizers";
      case "all":
        return "Everyone";
      default:
        return group;
    }
  };

  const getLogRecipientLabel = (log) =>
    log.recipientGroup === "individual"
      ? log.recipient
      : `${getRecipientLabel(log.recipientGroup)} (${log.recipientCount})`;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary md:text-3xl">
            Messages
          </h1>
          <p className="mt-1 text-muted-foreground">
            Compose and send emails to users with AI-powered templates
          </p>
        </div>

        {error ? (
          <Card className="border border-rose-200 bg-rose-50 shadow-sm">
            <CardContent className="p-4 text-sm text-rose-700">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#8b5e3c]/12">
                <Send size={24} className="text-[#8b5e3c]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {emailLogs.length}
                </p>
                <p className="text-sm text-muted-foreground">Emails Sent</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f36f21]/12">
                <Users size={24} className="text-[#f36f21]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {totalUsers}
                </p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {emailLogs.filter((log) => log.status === "sent").length}
                </p>
                <p className="text-sm text-muted-foreground">Delivered</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto gap-2 rounded-xl border bg-card p-1 shadow-sm">
            <TabsTrigger
              value="compose"
              className={cn(
                "gap-2 rounded-lg px-4 py-2.5",
                activeTab === "compose"
                  ? "bg-gradient-to-r from-[#1f4e79] to-[#163a5a] text-white shadow-sm"
                  : "hover:bg-gradient-to-r hover:from-[#1f4e79] hover:to-[#163a5a] hover:text-white"
              )}
            >
              <Mail size={16} />
              Compose
            </TabsTrigger>
            <TabsTrigger
              value="sent"
              className={cn(
                "gap-2 rounded-lg px-4 py-2.5",
                activeTab === "sent"
                  ? "bg-gradient-to-r from-[#1f4e79] to-[#163a5a] text-white shadow-sm"
                  : "hover:bg-gradient-to-r hover:from-[#1f4e79] hover:to-[#163a5a] hover:text-white"
              )}
            >
              <FileText size={16} />
              Sent Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="mt-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail size={20} className="text-brand-orange" />
                  Compose Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIEmailComposer
                  role="admin"
                  recipientOptions={allRecipientOptions}
                  selectedRecipients={selectedRecipients}
                  onRecipientsChange={setSelectedRecipients}
                  templates={templates}
                  subject={subject}
                  onSubjectChange={setSubject}
                  body={body}
                  onBodyChange={setBody}
                  recipientCount={recipientCount}
                  isSending={isSending}
                  onSend={handleSend}
                  onRegenerate={handleRegenerate}
                  toneOptions={true}
                  selectedTone={selectedTone}
                  onToneChange={setSelectedTone}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sent" className="mt-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <FileText size={20} className="text-brand-orange" />
                    Sent Emails
                  </CardTitle>
                  <div className="relative w-64">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      placeholder="Search emails..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredLogs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Recipients</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {log.sentAtLabel || log.sentAt}
                          </TableCell>
                          <TableCell className="max-w-xs truncate font-medium">
                            {log.subject}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="gap-1">
                              <Users size={12} />
                              {getLogRecipientLabel(log)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              <CheckCircle size={12} className="mr-1" />
                              Sent
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 hover:bg-gradient-to-r hover:from-[#1f4e79] hover:to-[#163a5a] hover:text-white"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye size={14} />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-12 text-center">
                    <Mail
                      size={48}
                      className="mx-auto mb-4 text-muted-foreground"
                    />
                    <h3 className="mb-2 font-heading font-semibold text-foreground">
                      {isLoading ? "Loading emails..." : "No emails sent yet"}
                    </h3>
                    <p className="text-muted-foreground">
                      {isLoading
                        ? "Fetching message history from the backend."
                        : "Compose your first email to get started"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Details</DialogTitle>
          </DialogHeader>
          {selectedLog ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Sent:</span>
                  <p className="mt-1 flex items-center gap-2 font-medium">
                    <Calendar size={14} />
                    {selectedLog.sentAtLabel || selectedLog.sentAt}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Recipients:</span>
                  <p className="mt-1 flex items-center gap-2 font-medium">
                    <Users size={14} />
                    {getLogRecipientLabel(selectedLog)}
                  </p>
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Subject:</span>
                <p className="mt-1 font-semibold">{selectedLog.subject}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Message:</span>
                <div className="mt-1 rounded-lg bg-secondary p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {selectedLog.body}
                  </pre>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export default AdminMessage;
