import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatSidebar, type ChatFriend } from "@/components/chat/chat-sidebar";
import { ChatConversation, type ChatMessageView, type ChatPartner } from "@/components/chat/chat-conversation";

const MESSAGE_LIMIT = 200;

type ChatPageProps = {
  searchParams?: Promise<Record<string, string | string[]>>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;

  if (!sessionUser) {
    redirect("/login");
  }

  const userId = Number(sessionUser.id);
  if (!Number.isInteger(userId)) {
    redirect("/login");
  }

  const connections = await prisma.userFriend.findMany({
    where: {
      OR: [{ userId }, { friendId: userId }],
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          bloodGroup: true,
        },
      },
      friend: {
        select: {
          id: true,
          username: true,
          name: true,
          bloodGroup: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const friendMap = new Map<number, { username: string; name: string | null; bloodGroup: string | null; joinedAt: Date }>();

  for (const connection of connections) {
    const person = connection.userId === userId ? connection.friend : connection.user;
    if (!friendMap.has(person.id)) {
      friendMap.set(person.id, {
        username: person.username,
        name: person.name,
        bloodGroup: person.bloodGroup,
        joinedAt: connection.createdAt,
      });
    }
  }

  const friendEntries = Array.from(friendMap.entries()).sort((a, b) => b[1].joinedAt.getTime() - a[1].joinedAt.getTime());
  const friendIds = friendEntries.map(([id]) => id);

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const searchParamRaw = resolvedSearchParams.user;
  const searchParam = Array.isArray(searchParamRaw) ? searchParamRaw[0] : searchParamRaw;
  let selectedFriendId = Number(searchParam);

  if (!Number.isInteger(selectedFriendId) || !friendMap.has(selectedFriendId)) {
    selectedFriendId = friendIds[0];
  }

  let conversation: ChatMessageView[] = [];
  let partner: ChatPartner | null = null;

  if (selectedFriendId) {
    await prisma.chatMessage.updateMany({
      where: {
        senderId: selectedFriendId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          {
            senderId: userId,
            receiverId: selectedFriendId,
          },
          {
            senderId: selectedFriendId,
            receiverId: userId,
          },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: MESSAGE_LIMIT,
    });

    const transformed: ChatMessageView[] = [];
    for (const message of messages) {
      transformed.push({
        id: message.id,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        senderId: message.senderId,
        isRead: message.isRead,
      });
    }

    conversation = transformed;

    const selectedFriend = friendMap.get(selectedFriendId);
    if (selectedFriend) {
      partner = {
        id: selectedFriendId,
        username: selectedFriend.username,
        name: selectedFriend.name,
        bloodGroup: selectedFriend.bloodGroup,
      };
    }
  }

  const unreadCounts = friendIds.length
    ? await prisma.chatMessage.groupBy({
        by: ["senderId"],
        _count: { _all: true },
        where: {
          receiverId: userId,
          isRead: false,
          senderId: { in: friendIds },
        },
      })
    : [];

  const unreadMap = new Map<number, number>();
  for (const entry of unreadCounts) {
    unreadMap.set(entry.senderId, entry._count._all);
  }

  const latestMessages = await Promise.all(
    friendIds.map((friendId) =>
      prisma.chatMessage.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: friendId },
            { senderId: friendId, receiverId: userId },
          ],
        },
        orderBy: { createdAt: "desc" },
      }),
    ),
  );

  const sidebarFriends: ChatFriend[] = friendEntries.map(([friendId, friendData], index) => {
    const latestMessage = latestMessages[index];
    return {
      id: friendId,
      username: friendData.username,
      name: friendData.name,
      bloodGroup: friendData.bloodGroup,
      lastMessage: latestMessage?.content ?? undefined,
      lastMessageAt: latestMessage
        ? formatDistanceToNow(latestMessage.createdAt, { addSuffix: true })
        : undefined,
      unreadCount: friendId === selectedFriendId ? 0 : unreadMap.get(friendId) ?? 0,
      isActive: friendId === selectedFriendId,
    };
  });

  return (
    <div className="grid w-full gap-6 grid-cols-1 lg:grid-cols-[320px_1fr]">
      <ChatSidebar friends={sidebarFriends} />
      <ChatConversation currentUserId={userId} partner={partner} messages={conversation} />
    </div>
  );
}
