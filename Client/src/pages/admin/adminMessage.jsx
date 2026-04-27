import { useMemo, useState } from "react";
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
  addAdminEmailLog,
  addNotification,
  getAdminEmailLogs,
  getRegistrations,
} from "@/stores/eventStore.jsx";

const getAdminAITemplates = (tone) => {
  const templates = {
    formal: [
      {
        type: "Announcement",
        subject: "Important Announcement: Platform Updates",
        body: `Dear Users,

We are pleased to announce important updates to the Smart Events platform that will enhance your experience.

[Add announcement details here]

Thank you for being a valued member of our community.

Best regards,
Smart Events Administration`,
        tone: "formal",
      },
      {
        type: "Policy Update",
        subject: "Policy Update: Terms of Service Changes",
        body: `Dear Users,

We are writing to inform you of updates to our Terms of Service and Privacy Policy, effective [DATE].

Key changes include:
• [Change 1]
• [Change 2]
• [Change 3]

Please review the full policy at [LINK]. Your continued use of the platform constitutes acceptance of these terms.

Sincerely,
Smart Events Administration`,
        tone: "formal",
      },
      {
        type: "Payment Reminder",
        subject: "Action Required: Outstanding Payment",
        body: `Dear User,

This is a reminder regarding an outstanding payment for your event registration.

Amount Due: $[AMOUNT]
Due Date: [DATE]

Please complete your payment to secure your registration.

If you have already made this payment, please disregard this notice.

Best regards,
Smart Events Administration`,
        tone: "formal",
      },
    ],
    friendly: [
      {
        type: "Announcement",
        subject: "Exciting News: New Features Just Dropped! 🎉",
        body: `Hey there!

We've got some exciting news to share - we've just rolled out some awesome new features to make your event experience even better!

[Add announcement details here]

Can't wait for you to try them out!

Cheers,
The Smart Events Team`,
        tone: "friendly",
      },
      {
        type: "Policy Update",
        subject: "Quick Heads Up: Some Policy Updates",
        body: `Hi there!

Just wanted to give you a quick heads up about some changes we've made to our policies.

Don't worry - nothing major, but we want to keep you in the loop!

Here's what's new:
• [Change 1]
• [Change 2]

Check out the full details at [LINK] when you get a chance.

Thanks for being awesome!
The Smart Events Team`,
        tone: "friendly",
      },
      {
        type: "General Support",
        subject: "We're Here to Help! 💪",
        body: `Hi there!

Just checking in to make sure everything is going smoothly with your events.

If you ever need any help or have questions, don't hesitate to reach out - we're always here!

Happy eventing!
The Smart Events Team`,
        tone: "friendly",
      },
    ],
    short: [
      {
        type: "Announcement",
        subject: "Platform Update",
        body: `Quick update: [Brief description]

Details: [LINK]

- Smart Events Team`,
        tone: "short",
      },
      {
        type: "Payment Reminder",
        subject: "Payment Due",
        body: `Payment reminder:
Amount: $[AMOUNT]
Due: [DATE]

Pay now: [LINK]`,
        tone: "short",
      },
      {
        type: "Event Notice",
        subject: "Event Change Notice",
        body: `Notice: [Event Name] has been updated.

What changed: [Brief description]

Check details: [LINK]`,
        tone: "short",
      },
    ],
  };

  return templates[tone];
};

function AdminMessage() {
  const [activeTab, setActiveTab] = useState("compose");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [selectedRecipients, setSelectedRecipients] = useState("");
  const [selectedTone, setSelectedTone] = useState("formal");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [emailLogs, setEmailLogs] = useState(() => getAdminEmailLogs());

  const allUsers = useMemo(() => {
    const registrations = getRegistrations();
    const userMap = new Map();

    registrations.forEach((registration) => {
      if (!userMap.has(registration.userId)) {
        userMap.set(registration.userId, {
          id: registration.userId,
          name: registration.userName,
          email: registration.userEmail,
        });
      }
    });

    return Array.from(userMap.values());
  }, []);

  const recipientOptions = [
    { value: "all-users", label: "All Users", count: allUsers.length },
    { value: "all-organizers", label: "All Organizers", count: 3 },
    { value: "all", label: "Everyone", count: allUsers.length + 3 },
  ];

  const recipientCount = useMemo(() => {
    switch (selectedRecipients) {
      case "all-users":
        return allUsers.length;
      case "all-organizers":
        return 3;
      case "all":
        return allUsers.length + 3;
      default:
        return 0;
    }
  }, [selectedRecipients, allUsers.length]);

  const templates = useMemo(
    () => getAdminAITemplates(selectedTone),
    [selectedTone]
  );

  const handleRegenerate = () => {
    const tones = ["formal", "friendly", "short"];
    const currentIndex = tones.indexOf(selectedTone);
    const nextTone = tones[(currentIndex + 1) % tones.length];
    setSelectedTone(nextTone);
  };

  const handleSend = async () => {
    if (!subject || !body || !selectedRecipients) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSending(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    addAdminEmailLog({
      recipientGroup: selectedRecipients,
      recipientCount,
      subject,
      body,
      sentAt: new Date().toLocaleDateString("en-AU", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "sent",
    });

    allUsers.forEach((user) => {
      addNotification({
        userId: user.id,
        type: "admin",
        title: subject,
        message: body.substring(0, 200) + (body.length > 200 ? "..." : ""),
        date: new Date().toLocaleDateString("en-AU", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        isRead: false,
        from: "Smart Events Admin",
      });
    });

    setEmailLogs(getAdminEmailLogs());
    setIsSending(false);
    setSubject("");
    setBody("");
    setSelectedRecipients("");
    setActiveTab("sent");
    toast.success(`Email sent to ${recipientCount} recipient(s)!`);
  };

  const filteredLogs = emailLogs.filter((log) => {
    const normalizedQuery = searchQuery.toLowerCase();
    return (
      log.subject.toLowerCase().includes(normalizedQuery) ||
      log.recipientGroup.toLowerCase().includes(normalizedQuery)
    );
  });

  const getRecipientLabel = (group) => {
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
                  {allUsers.length}
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
                  recipientOptions={recipientOptions}
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
                            {log.sentAt}
                          </TableCell>
                          <TableCell className="max-w-xs truncate font-medium">
                            {log.subject}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="gap-1">
                              <Users size={12} />
                              {getRecipientLabel(log.recipientGroup)} (
                              {log.recipientCount})
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
                      No emails sent yet
                    </h3>
                    <p className="text-muted-foreground">
                      Compose your first email to get started
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
                    {selectedLog.sentAt}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Recipients:</span>
                  <p className="mt-1 flex items-center gap-2 font-medium">
                    <Users size={14} />
                    {getRecipientLabel(selectedLog.recipientGroup)} (
                    {selectedLog.recipientCount})
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
