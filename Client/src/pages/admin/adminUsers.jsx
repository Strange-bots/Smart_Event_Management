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
import { cn } from "@/lib/utils";
import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUser,
} from "@/services/adminUserService.js";

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
    error: (message) => show(message, "error"),
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
            toast.type === "warning"
              ? "bg-yellow-500"
              : toast.type === "error"
              ? "bg-rose-600"
              : "bg-green-600"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

const INITIAL_EDIT_FORM = { name: "", email: "", role: "user", status: "active" };
const INITIAL_CREATE_FORM = { name: "", email: "", role: "user", status: "active", password: "" };

function AdminUsers() {
  const storedUser = window.localStorage.getItem("smart_event_user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteBlockedDialogOpen, setIsDeleteBlockedDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteBlockDetails, setDeleteBlockDetails] = useState(null);
  const [editForm, setEditForm] = useState(INITIAL_EDIT_FORM);
  const [createForm, setCreateForm] = useState(INITIAL_CREATE_FORM);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const backendUsers = await fetchAdminUsers();
      setUsers(backendUsers);
      setError("");
    } catch (loadError) {
      setUsers([]);
      setError(loadError.message || "Unable to load users.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

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
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) {
      return;
    }

    try {
      const updatedUser = await updateAdminUser(selectedUser.email, {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        status: editForm.status,
      });

      setUsers((prev) =>
        prev.map((user) => (user.id === selectedUser.id ? updatedUser : user))
      );
      setSelectedUser(updatedUser);
      toast.success("User updated successfully!");
      setIsEditDialogOpen(false);
      setEditForm(INITIAL_EDIT_FORM);
    } catch (saveError) {
      toast.error(saveError.message || "Could not update user.");
    }
  };

  const handleCreateUser = async () => {
    try {
      const createdUser = await createAdminUser(createForm);
      setUsers((prev) => [createdUser, ...prev]);
      setIsCreateDialogOpen(false);
      setCreateForm(INITIAL_CREATE_FORM);
      toast.success("User created successfully!");
    } catch (createError) {
      toast.error(createError.message || "Could not create user.");
    }
  };

  const handleApproveUser = async (user) => {
    try {
      const updatedUser = await updateAdminUser(user.email, {
        name: user.name,
        email: user.email,
        role: user.role,
        status: "active",
      });
      setUsers((prev) =>
        prev.map((item) => (item.id === user.id ? updatedUser : item))
      );
      toast.success("User approved!");
    } catch (approveError) {
      toast.error(approveError.message || "Could not approve user.");
    }
  };

  const handleDeactivateUser = async (user) => {
    try {
      const updatedUser = await updateAdminUser(user.email, {
        name: user.name,
        email: user.email,
        role: user.role,
        status: "inactive",
      });
      setUsers((prev) =>
        prev.map((item) => (item.id === user.id ? updatedUser : item))
      );
      toast.warning("User deactivated");
    } catch (deactivateError) {
      toast.error(deactivateError.message || "Could not deactivate user.");
    }
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) {
      return;
    }

    try {
      await deleteAdminUser(userToDelete.email);
      setUsers((prev) => prev.filter((user) => user.id !== userToDelete.id));
      toast.success("User deleted successfully");
    } catch (deleteError) {
      if (deleteError.status === 409) {
        setDeleteBlockDetails({
          name: userToDelete.name,
          email: userToDelete.email,
          message:
            deleteError.message ||
            "This organizer still owns event records and cannot be deleted yet.",
          linkedEvents: deleteError.data?.linkedEvents ?? [],
        });
        setIsDeleteBlockedDialogOpen(true);
      } else {
        toast.error(deleteError.message || "Could not delete user.");
      }
    } finally {
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
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
          <Button
            variant="brand"
            className="min-h-11 gap-2"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus size={18} />
            Add User
          </Button>
        </div>

        {error ? (
          <Card className="border border-rose-200 bg-rose-50 shadow-sm">
            <CardContent className="p-4 text-sm text-rose-700">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f36f21]/12">
                <Users size={24} className="text-[#f36f21]" />
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
                {["all", "admin", "organizer", "user"].map((role) => (
                  <Button
                    key={role}
                    variant={roleFilter === role ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "min-h-11 px-4",
                      roleFilter === role
                        ? "border-[#1f4e79] bg-gradient-to-r from-[#1f4e79] to-[#163a5a] text-white shadow-sm"
                        : "border-[#d9e2ec] bg-white text-[#0f1e33] hover:border-[#1f4e79] hover:bg-gradient-to-r hover:from-[#1f4e79] hover:to-[#163a5a] hover:text-white"
                    )}
                    onClick={() => setRoleFilter(role)}
                  >
                    {role === "all"
                      ? "All"
                      : role === "admin"
                      ? "Admins"
                      : role === "organizer"
                      ? "Organizers"
                      : "Users"}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="grid gap-4 p-4 md:hidden">
              {isLoading ? (
                <div className="rounded-2xl border border-dashed border-[#d9e2ec] px-4 py-8 text-center text-sm text-muted-foreground">
                  Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d9e2ec] px-4 py-8 text-center text-sm text-muted-foreground">
                  No users found.
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-2xl border border-[#e8eef5] bg-white p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar || undefined} alt={user.name} />
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{user.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.status)}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Events</p>
                        <p className="font-medium text-foreground">{user.eventsRegistered}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Joined</p>
                        <p className="font-medium text-foreground">{user.joinDate}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2">
                      <Button
                        variant="outline"
                        className="min-h-11 justify-start gap-2"
                        onClick={() => handleViewProfile(user)}
                      >
                        <Eye size={16} />
                        View Profile
                      </Button>
                      <Button
                        variant="outline"
                        className="min-h-11 justify-start gap-2"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit size={16} />
                        Edit User
                      </Button>
                      {user.status === "pending" ? (
                        <Button
                          variant="outline"
                          className="min-h-11 justify-start gap-2 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                          onClick={() => handleApproveUser(user)}
                        >
                          <UserCheck size={16} />
                          Approve
                        </Button>
                      ) : null}
                      {user.status === "active" ? (
                        <Button
                          variant="outline"
                          className="min-h-11 justify-start gap-2 border-yellow-200 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-800"
                          onClick={() => handleDeactivateUser(user)}
                        >
                          <UserX size={16} />
                          Deactivate
                        </Button>
                      ) : null}
                      <Button
                        variant="outline"
                        className="min-h-11 justify-start gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => handleDeleteUser(user)}
                      >
                        <Trash2 size={16} />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="hidden md:block">
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
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
                            <Button variant="ghost" size="icon" className="h-10 w-10">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem
                              className="min-h-10 gap-2"
                              onClick={() => handleViewProfile(user)}
                            >
                              <Eye size={14} /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="min-h-10 gap-2"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit size={14} /> Edit User
                            </DropdownMenuItem>
                            {user.status === "pending" ? (
                              <DropdownMenuItem
                                className="min-h-10 gap-2 text-green-600"
                                onClick={() => handleApproveUser(user)}
                              >
                                <UserCheck size={14} /> Approve
                              </DropdownMenuItem>
                            ) : null}
                            {user.status === "active" ? (
                              <DropdownMenuItem
                                className="min-h-10 gap-2 text-yellow-600"
                                onClick={() => handleDeactivateUser(user)}
                              >
                                <UserX size={14} /> Deactivate
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem
                              className="min-h-10 gap-2 text-destructive"
                              onClick={() => handleDeleteUser(user)}
                            >
                              <Trash2 size={14} /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              </Table>
            </div>
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Create a new user account from the backend</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="createName">Name</Label>
              <Input
                id="createName"
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createEmail">Email</Label>
              <Input
                id="createEmail"
                type="email"
                value={createForm.email}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, email: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createPassword">Password</Label>
              <Input
                id="createPassword"
                type="password"
                value={createForm.password}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, password: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createRole">Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(value) =>
                  setCreateForm((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger id="createRole">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="organizer">Organizer</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="createStatus">Status</Label>
              <Select
                value={createForm.status}
                onValueChange={(value) =>
                  setCreateForm((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger id="createStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="brand" onClick={handleCreateUser}>
              Create User
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
            <div className="space-y-2">
              <Label htmlFor="editStatus">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) =>
                  setEditForm((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger id="editStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
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

      <Dialog
        open={isDeleteBlockedDialogOpen}
        onOpenChange={setIsDeleteBlockedDialogOpen}
      >
        <DialogContent className="max-w-3xl border-0 bg-white p-0 shadow-2xl">
          <div className="overflow-hidden rounded-2xl">
            <div className="bg-rose-600 px-8 py-6 text-white">
              <DialogTitle className="text-2xl font-bold">
                Organizer Deletion Blocked
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-rose-50">
                {deleteBlockDetails?.message ||
                  "This organizer still has linked event records."}
              </DialogDescription>
            </div>

            <div className="space-y-6 px-8 py-7">
              <div className="rounded-2xl bg-rose-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">
                  Affected Organizer
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {deleteBlockDetails?.name || "Organizer account"}
                </p>
                <p className="text-sm text-slate-600">
                  {deleteBlockDetails?.email || ""}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    Why deletion is blocked
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    This organizer still owns events in the system. Admin must
                    delete or resolve those events first before the organizer
                    account can be removed.
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm font-semibold text-amber-900">
                    Paid attendance warning
                  </p>
                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    If any linked event has paid attendees, delete the event
                    first so refund-pending notifications can be created for
                    affected users before the organizer account is removed.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Linked Events
                  </h3>
                  <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                    {(deleteBlockDetails?.linkedEvents ?? []).length} event(s)
                  </Badge>
                </div>

                <div className="mt-4 space-y-3">
                  {(deleteBlockDetails?.linkedEvents ?? []).map((event) => (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {event.title}
                          </p>
                          <p className="text-sm text-slate-600">
                            Event ID: {event.id}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                            {event.date}
                          </Badge>
                          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                            {event.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900 px-5 py-4 text-sm text-slate-100">
                Next step: remove or resolve these linked events first, then try
                deleting the organizer again.
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteBlockedDialogOpen(false);
                    setDeleteBlockDetails(null);
                  }}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ToastContainer toasts={toast.toasts} />
    </DashboardLayout>
  );
}

export default AdminUsers;
