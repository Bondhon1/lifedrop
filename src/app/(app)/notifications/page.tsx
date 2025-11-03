import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationList, type NotificationViewModel } from "@/components/notifications/notification-list";

const TAKE = 50;

export default async function NotificationsPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!user) {
    redirect("/login");
  }

  const userId = Number(user.id);
  if (!Number.isInteger(userId)) {
    redirect("/login");
  }

  const notifications = await prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: "desc" },
    take: TAKE,
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
  });

  const viewModel: NotificationViewModel[] = notifications.map((notification: (typeof notifications)[number]) => ({
    id: notification.id,
    message: notification.message,
    createdAt: notification.createdAt.toISOString(),
    link: notification.link,
    senderName: notification.sender?.name ?? notification.sender?.username ?? null,
    isRead: notification.isRead,
  }));

  const unreadCount = notifications.filter((notification: (typeof notifications)[number]) => !notification.isRead).length;

  return (
    <div className="grid gap-6">
      <Card className="border border-soft bg-surface-card">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-primary">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <NotificationList notifications={viewModel} unreadCount={unreadCount} />
        </CardContent>
      </Card>
    </div>
  );
}
