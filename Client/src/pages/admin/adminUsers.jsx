import DashboardLayout from "@/components/dashboard/dashboard.jsx";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useState, useEffect } from "react";
import { useAuth } from "@/context/authcontext1.jsx";

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

// Simple inline toast
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };
  return { toasts, success: (msg) => show(msg, "success"), warning: (msg) => show(msg, "warning") };
}

function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-md px-4 py-3 text-sm font-medium shadow-lg text-white ${
            t.type === "warning" ? "bg-yellow-500" : "bg-green-600"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

const AdminUsers = () => {
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

    const handleStorageChange = (e) => {
      if (e.key === USERS_STORAGE_KEY) {
        loadUsers();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(loadUsers, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [getAllUsers]);

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
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Admin</Badge>;
      case "organizer":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Organizer</Badge>;
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Inactive</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>;
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
    if (selectedUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? { ...u, name: editForm.name, email: editForm.email, role: editForm.role }
            : u
        )
      );

      const storedUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
      const updatedUsers = storedUsers.map((u) =>
        u.id === selectedUser.id
          ? { ...u, name: editForm.name, email: editForm.email, role: editForm.role }
          : u
      );
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

      toast.success("User updated successfully!");
      setIsEditDialogOpen(false);
    }
  };

  const handleApproveUser = (userId) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: "active" } : u))
    );
    toast.success("User approved!");
  };

  const handleDeactivateUser = (userId) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: "inactive" } : u))
    );
    toast.warning("User deactivated");
  };

  const handleDeleteUser = (userId) => {
    setUserToDelete(userId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete));

      const storedUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
      const updatedUsers = storedUsers.filter((u) => u.id !== userToDelete);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

      toast.success("User deleted successfully");
    }
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-primary">
              User Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage all users, roles, and permissions
            </p>
          </div>
          <Button variant="brand" className="gap-2">
            <Plus size={18} />
            Add User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Shield size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter((u) => u.role === "admin").length}
                </p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter((u) => u.role === "organizer").length}
                </p>
                <p className="text-sm text-muted-foreground">Organizers</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <UserCheck size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter((u) => u.status === "active").length}
                </p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={roleFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRoleFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={roleFilter === "admin" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRoleFilter("admin")}
                >
                  Admins
                </Button>
                <Button
                  variant={roleFilter === "organizer" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRoleFilter("organizer")}
                >
                  Organizers
                </Button>
                <Button
                  variant={roleFilter === "user" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRoleFilter("user")}
                >
                  Users
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">User</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Events</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Joined</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar || undefined} alt={user.name} />
                            <AvatarFallback>
                              {user.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle">{getRoleBadge(user.role)}</td>
                      <td className="p-4 align-middle">{getStatusBadge(user.status)}</td>
                      <td className="p-4 align-middle">{user.eventsRegistered}</td>
                      <td className="p-4 align-middle">{user.joinDate}</td>
                      <td className="p-4 align-middle text-right">
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
                            {user.status === "pending" && (
                              <DropdownMenuItem
                                className="gap-2 text-green-600"
                                onClick={() => handleApproveUser(user.id)}
                              >
                                <UserCheck size={14} /> Approve
                              </DropdownMenuItem>
                            )}
                            {user.status === "active" && (
                              <DropdownMenuItem
                                className="gap-2 text-yellow-600"
                                onClick={() => handleDeactivateUser(user.id)}
                              >
                                <UserX size={14} /> Deactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="gap-2 text-destructive"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 size={14} /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Profile Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>View user details</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar || undefined} alt={selectedUser.name} />
                  <AvatarFallback className="text-lg">
                    {selectedUser.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
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
                  <p className="text-sm text-muted-foreground">Events Registered</p>
                  <p className="font-medium">{selectedUser.eventsRegistered}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">{selectedUser.joinDate}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button
              variant="brand"
              onClick={() => {
                setIsViewDialogOpen(false);
                if (selectedUser) handleEditUser(selectedUser);
              }}
            >
              Edit User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
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
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(value) => setEditForm((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
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
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="brand" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
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
};

export default AdminUsers;
