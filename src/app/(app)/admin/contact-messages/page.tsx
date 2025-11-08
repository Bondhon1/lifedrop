import { redirect } from "next/navigation";
import { auth, type SessionUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContactMessages } from "@/server/actions/contact";
import { ContactMessagesTable } from "@/components/admin/contact-messages-table";

export default async function AdminContactMessagesPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user) {
    redirect("/login");
  }

  if (!user.isAdmin) {
    redirect("/feed");
  }

  const messages = await getContactMessages();

  const unreadCount = messages.filter((m: { status: string }) => m.status === "Unread").length;
  const readCount = messages.filter((m: { status: string }) => m.status === "Read").length;
  const repliedCount = messages.filter((m: { status: string }) => m.status === "Replied").length;

  const serializedMessages = messages.map((message: any) => ({
    ...message,
    createdAt: message.createdAt.toISOString(),
  }));

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold text-[#2E2E2E]">Contact Messages</h1>
        <p className="text-sm text-[#5F5F5F]">
          View and manage messages from users who contacted us through the contact form.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#5F5F5F]">Unread Messages</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#2E2E2E]">{unreadCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#5F5F5F]">Read Messages</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#2E2E2E]">{readCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#5F5F5F]">Replied</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#2E2E2E]">{repliedCount}</CardContent>
        </Card>
      </section>

      <section className="grid gap-4">
        <div className="grid gap-1">
          <h2 className="text-xl font-semibold text-[#2E2E2E]">All Messages</h2>
          <p className="text-sm text-[#5F5F5F]">Review and respond to contact form submissions.</p>
        </div>
        <ContactMessagesTable messages={serializedMessages} />
      </section>
    </div>
  );
}
