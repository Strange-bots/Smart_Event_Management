import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/dashboard.jsx";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Users,
  Shield,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/context/authcontext1.jsx";
import { cn } from "@/lib/utils";

const USERS_STORAGE_KEY = "sem_users";

const convertAuthUserToAdminUser = (authUser) => ({
  id: authUser.id,
  name: authUser.name,
  email: authUser.email,
  role: authUser.role || "user",
  status: "active",
  eventsRegistered: 0,
  joinDate: new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }),
  avatar: authUser.avatar || null,
});

function useToast() {
  const [toasts, setToasts] = useState([]);

  const show = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  return {
    toasts,
    success: (message) => show(message, "success"),
    warning: (message) => show(message, "warning"),
  };
}

function ToastContainer({ toasts }) {
  if (!toasts.length) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-md px-4 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === "warning" ? "bg-yellow-500" : "bg-green-600"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

function AdminUsers() {
  const storedUser = window.localStorage.getItem("smart_event_user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const { getAllUsers } = useAuth();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "user" });

  useEffect(() => {
    const loadUsers = () => {
      const authUsers = getAllUsers();
      const convertedUsers = authUsers.map(convertAuthUserToAdminUser);
      setUsers(convertedUsers);
    };

    loadUsers();

    const handleStorageChange = (event) => {
      if (event.key === USERS_STORAGE_KEY) {
        loadUsers();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    const interval = window.setInterval(loadUsers, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.clearInterval(interval);
    };
  }, [getAllUsers]);

  if (!currentUser || currentUser.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
            Admin
          </Badge>
        );
      case "organizer":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            Organizer
          </Badge>
        );
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            Inactive
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            Pending
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedUser) {
      return;
    }

    setUsers((prev) =>
      prev.map((user) =>
        user.id === selectedUser.id
          ? {
              ...user,
              name: editForm.name,
              email: editForm.email,
              role: editForm.role,
            }
          : user,
      ),
    );

    const storedUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
    const updatedUsers = storedUsers.map((user) =>
      user.id === selectedUser.id
        ? {
            ...user,
            name: editForm.name,
            email: editForm.email,
            role: editForm.role,
          }
        : user,
    );

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    toast.success("User updated successfully!");
    setIsEditDialogOpen(false);
  };

  const handleApproveUser = (userId) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, status: "active" } : user,
      ),
    );
    toast.success("User approved!");
  };

  const handleDeactivateUser = (userId) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, status: "inactive" } : user,
      ),
    );
    toast.warning("User deactivated");
  };

  const handleDeleteUser = (userId) => {
    setUserToDelete(userId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      setUsers((prev) => prev.filter((user) => user.id !== userToDelete));

      const storedUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
      const updatedUsers = storedUsers.filter((user) => user.id !== userToDelete);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

      toast.success("User deleted successfully");
    }

    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary md:text-3xl">
              User Management
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage all users, roles, and permissions
            </p>
          </div>
          <Button variant="brand" className="gap-2">
            <Plus size={18} />
            Add User
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <Shield size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter((user) => user.role === "admin").length}
                </p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Calendar size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter((user) => user.role === "organizer").length}
                </p>
                <p className="text-sm text-muted-foreground">Organizers</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <UserCheck size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter((user) => user.status === "active").length}
                </p>
                <p className="text-sm text-muted-foreground">Active Users</p>
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
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={roleFilter === "all" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    roleFilter === "all"
                      ? "border-[#1f4e79] bg-gradient-to-r from-[#1f4e79] to-[#163a5a] text-white shadow-sm"
                      : "border-[#d9e2ec] bg-white text-[#0f1e33] hover:border-[#1f4e79] hover:bg-gradient-to-r hover:from-[#1f4e79] hover:to-[#163a5a] hover:text-white"
                  )}
                  onClick={() => setRoleFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={roleFilter === "admin" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    roleFilter === "admin"
                      ? "border-[#1f4e79] bg-gradient-to-r from-[#1f4e79] to-[#163a5a] text-white shadow-sm"
                      : "border-[#d9e2ec] bg-white text-[#0f1e33] hover:border-[#1f4e79] hover:bg-gradient-to-r hover:from-[#1f4e79] hover:to-[#163a5a] hover:text-white"
                  )}
                  onClick={() => setRoleFilter("admin")}
                >
                  Admins
                </Button>
                <Button
                  variant={roleFilter === "organizer" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    roleFilter === "organizer"
                      ? "border-[#1f4e79] bg-gradient-to-r from-[#1f4e79] to-[#163a5a] text-white shadow-sm"
                      : "border-[#d9e2ec] bg-white text-[#0f1e33] hover:border-[#1f4e79] hover:bg-gradient-to-r hover:from-[#1f4e79] hover:to-[#163a5a] hover:text-white"
                  )}
                  onClick={() => setRoleFilter("organizer")}
                >
                  Organizers
                </Button>
                <Button
                  variant={roleFilter === "user" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    roleFilter === "user"
                      ? "border-[#1f4e79] bg-gradient-to-r from-[#1f4e79] to-[#163a5a] text-white shadow-sm"
                      : "border-[#d9e2ec] bg-white text-[#0f1e33] hover:border-[#1f4e79] hover:bg-gradient-to-r hover:from-[#1f4e79] hover:to-[#163a5a] hover:text-white"
                  )}
                  onClick={() => setRoleFilter("user")}
                >
                  Users
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
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar || undefined} alt={user.name} />
                          <AvatarFallback>
                            {user.name
                              .split(" ")
                              .map((part) => part[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>{user.eventsRegistered}</TableCell>
                    <TableCell>{user.joinDate}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => handleViewProfile(user)}
                          >
                            <Eye size={14} /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit size={14} /> Edit User
                          </DropdownMenuItem>
                          {user.status === "pending" ? (
                            <DropdownMenuItem
                              className="gap-2 text-green-600"
                              onClick={() => handleApproveUser(user.id)}
                            >
                              <UserCheck size={14} /> Approve
                            </DropdownMenuItem>
                          ) : null}
                          {user.status === "active" ? (
                            <DropdownMenuItem
                              className="gap-2 text-yellow-600"
                              onClick={() => handleDeactivateUser(user.id)}
                            >
                              <UserX size={14} /> Deactivate
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem
                            className="gap-2 text-destructive"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 size={14} /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>View user details</DialogDescription>
          </DialogHeader>
          {selectedUser ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={selectedUser.avatar || undefined}
                    alt={selectedUser.name}
                  />
                  <AvatarFallback className="text-lg">
                    {selectedUser.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  {getRoleBadge(selectedUser.role)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedUser.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Events Registered
                  </p>
                  <p className="font-medium">{selectedUser.eventsRegistered}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">{selectedUser.joinDate}</p>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="brand"
              onClick={() => {
                setIsViewDialogOpen(false);
                if (selectedUser) {
                  handleEditUser(selectedUser);
                }
              }}
            >
              Edit User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={editForm.name}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editForm.email}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, email: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(value) =>
                  setEditForm((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger id="editRole">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="organizer">Organizer</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="brand" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ToastContainer toasts={toast.toasts} />
    </DashboardLayout>
  );
}

export default AdminUsers;
