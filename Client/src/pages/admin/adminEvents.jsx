import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/dashboard.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  MapPin,
  MoreHorizontal,
  Search,
  Sparkles,
  ThumbsUp,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  approveAdminEvent,
  fetchAdminEventAiRecommendations,
  fetchAdminEvents,
  rejectAdminEvent,
} from "@/services/adminEventService.js";

const mapToDisplayEvent = (event) => ({
  id: event.id,
  title: event.title,
  description: event.description,
  organizer: event.organizerName || "Event Organizer",
  date: event.date,
  time: event.time,
  venue: event.venue,
  registrations: event.registrations,
  capacity: event.capacity,
  status: event.status,
  image: event.image,
  price: event.price,
  isPaid: event.isPaid,
  tags: event.tags || [],
  category: event.category,
});

function AdminEvents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiSource, setAiSource] = useState("fallback");
  const [aiReason, setAiReason] = useState("");

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const [backendEvents, aiResult] = await Promise.all([
        fetchAdminEvents(),
        fetchAdminEventAiRecommendations(),
      ]);
      const nextEvents = backendEvents.map(mapToDisplayEvent);
      setEvents(nextEvents);
      setAiRecommendations(aiResult.recommendations);
      setAiSource(aiResult.source || "fallback");
      setAiReason(aiResult.reason || "");
      setError("");
    } catch (loadError) {
      setEvents([]);
      setAiRecommendations([]);
      setAiSource("fallback");
      setAiReason("");
      setError(loadError.message || "Unable to load events.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const filteredEvents = events.filter((event) => {
    const normalizedQuery = searchQuery.toLowerCase();
    const matchesSearch =
      event.title.toLowerCase().includes(normalizedQuery) ||
      event.organizer.toLowerCase().includes(normalizedQuery);
    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingEvents = events.filter((event) => event.status === "pending");

  const getAIRecommendation = (eventId) => {
    return aiRecommendations.find((item) => item.eventId === eventId);
  };

  const getRecommendationBadge = (recommendation) => {
    switch (recommendation.recommendation) {
      case "approve":
        return (
          <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100">
            <ThumbsUp size={12} />
            Recommend Approve ({recommendation.confidence}%)
          </Badge>
        );
      case "review":
        return (
          <Badge className="gap-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <Clock size={12} />
            Needs Review ({recommendation.confidence}%)
          </Badge>
        );
      case "reject":
        return (
          <Badge className="gap-1 bg-red-100 text-red-700 hover:bg-red-100">
            <AlertTriangle size={12} />
            Recommend Reject ({recommendation.confidence}%)
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setIsViewDialogOpen(true);
  };

  const handleApproveEvent = async (eventId) => {
    try {
      await approveAdminEvent(eventId);
      await loadEvents();
      toast.success("Event approved successfully! It is now visible to users.");
    } catch (actionError) {
      toast.error(actionError.message || "Could not approve event.");
    }
  };

  const handleRejectEvent = async (eventId) => {
    try {
      await rejectAdminEvent(eventId);
      await loadEvents();
      toast.error("Event rejected");
    } catch (actionError) {
      toast.error(actionError.message || "Could not reject event.");
    }
  };

  const handleApproveAll = async () => {
    try {
      await Promise.all(pendingEvents.map((event) => approveAdminEvent(event.id)));
      await loadEvents();
      toast.success(`${pendingEvents.length} events approved!`);
    } catch (actionError) {
      toast.error(actionError.message || "Could not approve all events.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary md:text-3xl">
            Organizer Events Review
          </h1>
          <p className="mt-1 text-muted-foreground">
            Review all organizer-created events and approve or reject them.
          </p>
        </div>

        {error ? (
          <Card className="border border-rose-200 bg-rose-50 shadow-sm">
            <CardContent className="p-4 text-sm text-rose-700">
              {error}
            </CardContent>
          </Card>
        ) : null}

        {pendingEvents.length > 0 ? (
          <Card className="border-0 bg-gradient-to-r from-[#6D5DF6]/5 to-[#6D5DF6]/10 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="text-[#6D5DF6]" size={20} />
                <span className="text-[#6D5DF6]">AI-Powered Recommendations</span>
                <Badge
                  variant="outline"
                  className="ml-2 border-[#6D5DF6]/30 text-[#6D5DF6]"
                >
                  {pendingEvents.length} Pending
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Our AI has analyzed pending events based on organizer history,
                event type, timing, and capacity utilization.
              </p>
              <p className="text-xs font-medium text-[#6D5DF6]">
                {aiSource === "gemini"
                  ? "Powered by Gemini"
                  : aiReason
                    ? `Showing server fallback recommendations: ${aiReason}`
                    : "Showing server fallback recommendations"}
              </p>

              <div className="grid gap-3">
                {pendingEvents.map((event) => {
                  const recommendation = getAIRecommendation(event.id);

                  return (
                    <div
                      key={event.id}
                      className="flex flex-col justify-between gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{event.title}</span>
                          {recommendation
                            ? getRecommendationBadge(recommendation)
                            : null}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          by {event.organizer} • {event.date}
                        </p>
                        {recommendation ? (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <TrendingUp size={12} className="text-[#6D5DF6]" />
                            {recommendation.reason}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                          onClick={() => handleApproveEvent(event.id)}
                        >
                          <CheckCircle size={14} />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleRejectEvent(event.id)}
                        >
                          <XCircle size={14} />
                          Reject
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {pendingEvents.length > 1 ? (
                <div className="flex justify-end pt-2">
                  <Button
                    variant="brand"
                    size="sm"
                    className="gap-2"
                    onClick={handleApproveAll}
                  >
                    <CheckCircle size={14} />
                    Approve All Recommended
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#8b5e3c]/12">
                <Calendar size={24} className="text-[#8b5e3c]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {events.length}
                </p>
                <p className="text-sm text-muted-foreground">Total Events</p>
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
                  {events.filter((event) => event.status === "approved").length}
                </p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                <Calendar size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {events.filter((event) => event.status === "pending").length}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
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
                  {events.reduce(
                    (total, event) => total + Number(event.registrations || 0),
                    0
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total Registrations
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    statusFilter === "all"
                      ? "border-[#1f4e79] bg-gradient-to-r from-[#1f4e79] to-[#163a5a] text-white shadow-sm"
                      : "hover:border-[#1f4e79] hover:bg-gradient-to-r hover:from-[#1f4e79] hover:to-[#163a5a] hover:text-white"
                  )}
                  onClick={() => setStatusFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "approved" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    statusFilter === "approved"
                      ? "border-[#1f4e79] bg-gradient-to-r from-[#1f4e79] to-[#163a5a] text-white shadow-sm"
                      : "hover:border-[#1f4e79] hover:bg-gradient-to-r hover:from-[#1f4e79] hover:to-[#163a5a] hover:text-white"
                  )}
                  onClick={() => setStatusFilter("approved")}
                >
                  Approved
                </Button>
                <Button
                  variant={statusFilter === "pending" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    statusFilter === "pending"
                      ? "border-[#1f4e79] bg-gradient-to-r from-[#1f4e79] to-[#163a5a] text-white shadow-sm"
                      : "hover:border-[#1f4e79] hover:bg-gradient-to-r hover:from-[#1f4e79] hover:to-[#163a5a] hover:text-white"
                  )}
                  onClick={() => setStatusFilter("pending")}
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === "rejected" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    statusFilter === "rejected"
                      ? "border-[#1f4e79] bg-gradient-to-r from-[#1f4e79] to-[#163a5a] text-white shadow-sm"
                      : "hover:border-[#1f4e79] hover:bg-gradient-to-r hover:from-[#1f4e79] hover:to-[#163a5a] hover:text-white"
                  )}
                  onClick={() => setStatusFilter("rejected")}
                >
                  Rejected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Organizer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Registrations</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>AI Insight</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Loading events...
                    </TableCell>
                  </TableRow>
                ) : filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No events found.
                    </TableCell>
                  </TableRow>
                ) : filteredEvents.map((event) => {
                  const recommendation = getAIRecommendation(event.id);

                  return (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>{event.organizer}</TableCell>
                      <TableCell>{event.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-muted-foreground" />
                          {event.venue}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{event.registrations}</span>
                        <span className="text-muted-foreground">
                          /{event.capacity}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(event.status)}</TableCell>
                      <TableCell>
                        {event.status === "pending" && recommendation ? (
                          <div className="flex items-center gap-1">
                            <Sparkles size={14} className="text-[#6D5DF6]" />
                            <span className="text-xs font-medium text-[#6D5DF6]">
                              {recommendation.confidence}%{" "}
                              {recommendation.recommendation}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {event.status === "pending" ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                                onClick={() => handleApproveEvent(event.id)}
                                title="Approve"
                              >
                                <CheckCircle size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => handleRejectEvent(event.id)}
                                title="Reject"
                              >
                                <XCircle size={16} />
                              </Button>
                            </>
                          ) : null}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => handleViewDetails(event)}
                              >
                                <Eye size={14} /> View Details
                              </DropdownMenuItem>
                              {event.status !== "pending" &&
                              event.status === "rejected" ? (
                                <DropdownMenuItem
                                  className="gap-2 text-green-600"
                                  onClick={() => handleApproveEvent(event.id)}
                                >
                                  <CheckCircle size={14} /> Approve
                                </DropdownMenuItem>
                              ) : null}
                              {event.status !== "pending" &&
                              event.status === "approved" ? (
                                <DropdownMenuItem
                                  className="gap-2 text-red-600"
                                  onClick={() => handleRejectEvent(event.id)}
                                >
                                  <XCircle size={14} /> Reject
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              Review organizer event details before approval or rejection.
            </DialogDescription>
          </DialogHeader>
          {selectedEvent ? (
            <div className="space-y-6">
              {selectedEvent.image ? (
                <div className="aspect-video overflow-hidden rounded-lg">
                  <img
                    src={selectedEvent.image}
                    alt={selectedEvent.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                {getStatusBadge(selectedEvent.status)}
                <Badge variant="secondary">{selectedEvent.category}</Badge>
                {selectedEvent.isPaid ? (
                  <Badge className="bg-green-100 text-green-700">
                    ${selectedEvent.price}
                  </Badge>
                ) : (
                  <Badge className="bg-primary/10 text-primary">Free</Badge>
                )}
              </div>

              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                  Description
                </p>
                <p className="text-foreground">{selectedEvent.description}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <Users size={16} className="mt-0.5 text-brand-orange" />
                  <div>
                    <p className="text-sm text-muted-foreground">Organizer</p>
                    <p className="font-medium">{selectedEvent.organizer}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar size={16} className="mt-0.5 text-brand-orange" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{selectedEvent.date}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock size={16} className="mt-0.5 text-brand-orange" />
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium">{selectedEvent.time}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 text-brand-orange" />
                  <div>
                    <p className="text-sm text-muted-foreground">Venue</p>
                    <p className="font-medium">{selectedEvent.venue}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users size={16} className="mt-0.5 text-brand-orange" />
                  <div>
                    <p className="text-sm text-muted-foreground">Capacity</p>
                    <p className="font-medium">
                      {selectedEvent.registrations} / {selectedEvent.capacity}{" "}
                      registered
                    </p>
                  </div>
                </div>
              </div>

              {selectedEvent.tags && selectedEvent.tags.length > 0 ? (
                <div>
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="bg-brand-orange/10 text-brand-orange"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedEvent.status === "pending" ? (
                <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row">
                  <Button
                    className="flex-1 gap-2 bg-green-600 text-white hover:bg-green-700"
                    onClick={() => {
                      handleApproveEvent(selectedEvent.id);
                      setIsViewDialogOpen(false);
                    }}
                  >
                    <CheckCircle size={16} />
                    Approve Event
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={() => {
                      handleRejectEvent(selectedEvent.id);
                      setIsViewDialogOpen(false);
                    }}
                  >
                    <XCircle size={16} />
                    Reject Event
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export default AdminEvents;
