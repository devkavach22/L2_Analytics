// ManageUsers.tsx
import React, { useState } from "react"; // Import useState
import { Plus, Search, Trash2 } from "lucide-react"; // Import Trash2 icon
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// --- New Imports for Modals and Forms ---
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Label } from "@/components/ui/label";

// --- Define a User type for better code ---
type User = {
  id: number;
  name: string;
  email: string;
  role: "Admin" | "User";
};

// Dummy user data
const initialUsers: User[] = [
  { id: 1, name: "Admin User", email: "admin@kavach.app", role: "Admin" },
  { id: 2, name: "Prachi Sharma", email: "prachi@example.com", role: "User" },
  { id: 3, name: "Demo User", email: "demo@example.com", role: "User" },
];

const ManageUsersPage: React.FC = () => {
  // --- State for modals ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [users, setUsers] = useState(initialUsers); // Manage users in state

  // --- Handler for deleting a user (simulated) ---
  const handleDeleteUser = () => {
    if (userToDelete) {
      setUsers(users.filter((user) => user.id !== userToDelete.id));
      console.log("Deleting user", userToDelete.id);
      setUserToDelete(null); // Close the dialog
    }
  };

  // --- Handler for adding a user (simulated) ---
  const handleAddUser = (event: React.FormEvent) => {
    event.preventDefault();
    // Logic to get form data would go here
    // For this example, we'll just add a new dummy user
    const newUser: User = {
      id: Math.max(...users.map(u => u.id)) + 1, // Generate new ID
      name: "New User", // Get from form
      email: "newuser@example.com", // Get from form
      role: "User", // Get from form
    };
    setUsers([...users, newUser]);
    console.log("Adding new user:", newUser);
    setIsAddModalOpen(false); // Close the modal
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-neutral-950">
      <Header isAuthenticated isAdmin onLogout={() => console.log("Logout")} />

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Manage Users
            </h1>
            <p className="text-muted-foreground mt-1">
              Add, edit, and manage user accounts.
            </p>
          </div>
          <div className="flex w-full md:w-auto items-center space-x-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
                className="w-full pl-10"
              />
            </div>
            {/* Updated Button to trigger the modal */}
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        {/* User Table in a Card */}
        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "Admin" ? "default" : "secondary"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      {/* --- Updated Actions Cell --- */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-600"
                            onClick={() => setUserToDelete(user)} // Set user to delete
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />

      {/* --- Add New User Modal --- */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Fill in the details for the new user. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {/* We wrap in a form for proper handling */}
          <form onSubmit={handleAddUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  placeholder="Prachi Sharma"
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="prachi@example.com"
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select required defaultValue="User">
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- Delete Confirmation Dialog --- */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              account for{" "}
              <span className="font-bold">{userToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
              onClick={handleDeleteUser}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageUsersPage;