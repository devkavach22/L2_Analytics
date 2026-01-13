import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// --- STATIC DATA (Expand this with more users for a real page) ---
const allUsers = [
  { id: 1, name: "John Doe", email: "john@example.com", status: "active", joined: "2024-01-15" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", status: "active", joined: "2024-01-14" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", status: "inactive", joined: "2024-01-13" },
  { id: 4, name: "Alice Brown", email: "alice@example.com", status: "active", joined: "2024-01-12" },
  { id: 5, name: "Charlie Wilson", email: "charlie@example.com", status: "active", joined: "2024-01-11" },
  { id: 6, name: "David Lee", email: "david@example.com", status: "inactive", joined: "2024-01-10" },
  { id: 7, name: "Eve Davis", email: "eve@example.com", status: "active", joined: "2024-01-09" },
];
// --- END STATIC DATA ---

export default function UserListPage() {
  return (
    <Card className="shadow-lg rounded-2xl border-0">
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        {/* You could add a SearchBar or "Add User" button here */}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Status</TableHead>
              {/* Add an 'Actions' head here for edit/delete buttons */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {allUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium">{user.name}</div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.joined}</TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={user.status === "active" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                {/* Add a TableCell for action buttons */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* You would add pagination controls here */}
      </CardContent>
    </Card>
  );
}