"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { updateContactMessageStatus } from "@/server/actions/contact";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { X } from "lucide-react";

export type ContactMessage = {
  id: number;
  createdAt: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  adminNotes: string | null;
};

type ContactMessagesTableProps = {
  messages: ContactMessage[];
};

export function ContactMessagesTable({ messages }: ContactMessagesTableProps) {
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState<string>("");

  const filteredMessages =
    statusFilter === "all"
      ? messages
      : messages.filter((m) => m.status === statusFilter);

  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    setNewStatus(message.status);
    setAdminNotes(message.adminNotes || "");
    setIsDialogOpen(true);

    // Mark as read if unread
    if (message.status === "Unread") {
      updateContactMessageStatus(message.id, "Read");
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedMessage) return;

    setIsUpdating(true);
    try {
      const result = await updateContactMessageStatus(
        selectedMessage.id,
        newStatus,
        adminNotes
      );

      if (result.success) {
        toast.success(result.message);
        setIsDialogOpen(false);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Unread":
        return "danger";
      case "Read":
        return "secondary";
      case "Replied":
        return "success";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label htmlFor="status-filter" className="text-sm font-medium">
          Filter by status:
        </Label>
        <Select 
          id="status-filter" 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-[180px]"
        >
          <option value="all">All messages</option>
          <option value="Unread">Unread</option>
          <option value="Read">Read</option>
          <option value="Replied">Replied</option>
        </Select>
      </div>

      <div className="rounded-lg border border-soft bg-surface-card overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-soft bg-surface-hover">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-primary">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-primary">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-primary">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-primary">Subject</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-primary">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-primary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-soft">
            {filteredMessages.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No messages found
                </td>
              </tr>
            ) : (
              filteredMessages.map((message) => (
                <tr key={message.id} className="hover:bg-surface-hover">
                  <td className="px-4 py-3 text-sm text-secondary">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-primary">{message.name}</td>
                  <td className="px-4 py-3 text-sm text-secondary">{message.email}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-sm text-primary">{message.subject}</td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusBadgeVariant(message.status)}>
                      {message.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewMessage(message)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog */}
      {isDialogOpen && selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl rounded-lg border border-soft bg-surface-card p-6 shadow-lg">
            <button
              onClick={() => setIsDialogOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-muted hover:bg-surface-hover hover:text-primary"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-2xl font-bold text-primary">Contact Message Details</h2>
              <p className="text-sm text-secondary">View and manage contact form submission</p>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">From</Label>
                <p className="text-sm text-primary">
                  {selectedMessage.name} ({selectedMessage.email})
                </p>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Date</Label>
                <p className="text-sm text-secondary">
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Subject</Label>
                <p className="text-sm text-primary">{selectedMessage.subject}</p>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Message</Label>
                <div className="rounded-lg border border-soft bg-background p-4">
                  <p className="whitespace-pre-wrap text-sm text-primary">
                    {selectedMessage.message}
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status" className="text-sm font-semibold">
                  Status
                </Label>
                <Select 
                  id="status"
                  value={newStatus} 
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="Unread">Unread</option>
                  <option value="Read">Read</option>
                  <option value="Replied">Replied</option>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="admin-notes" className="text-sm font-semibold">
                  Admin Notes (Internal)
                </Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this message..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateStatus} disabled={isUpdating}>
                  {isUpdating ? "Updating..." : "Update"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
