import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatSidebar, type ChatFriend } from "@/components/chat/chat-sidebar";
import { ChatConversation, type ChatMessageView, type ChatPartner } from "@/components/chat/chat-conversation";
import { ScrollToTop } from "@/components/ui/scroll-to-top";

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

  // Get all users the current user has exchanged messages with
  const messagePartners = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { senderId: userId },
        { receiverId: userId },
      ],
    },
    select: {
      senderId: true,
      receiverId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const partnerMap = new Map<number, { firstMessageAt: Date }>();

  for (const message of messagePartners) {
    const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
    if (partnerId !== userId && !partnerMap.has(partnerId)) {
      partnerMap.set(partnerId, { firstMessageAt: message.createdAt });
    }
  }

  const partnerIds = Array.from(partnerMap.keys());

  // Fetch partner user details
  const partners = await prisma.user.findMany({
    where: {
      id: { in: partnerIds },
    },
    select: {
      id: true,
      username: true,
      name: true,
      bloodGroup: true,
    },
  });

  const partnerDetails = new Map<number, { username: string; name: string | null; bloodGroup: string | null }>();
  for (const partner of partners) {
    partnerDetails.set(partner.id, {
      username: partner.username,
      name: partner.name,
      bloodGroup: partner.bloodGroup,
    });
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const searchParamRaw = resolvedSearchParams.user;
  const searchParam = Array.isArray(searchParamRaw) ? searchParamRaw[0] : searchParamRaw;
  let selectedPartnerId = Number(searchParam);

  // If the selected partner is not in existing conversations, fetch their details
  if (Number.isInteger(selectedPartnerId) && selectedPartnerId !== userId && !partnerDetails.has(selectedPartnerId)) {
    const newPartner = await prisma.user.findUnique({
      where: { id: selectedPartnerId },
      select: {
        id: true,
        username: true,
        name: true,
        bloodGroup: true,
      },
    });

    if (newPartner) {
      // Add to partnerDetails and partnerIds
      partnerDetails.set(newPartner.id, {
        username: newPartner.username,
        name: newPartner.name,
        bloodGroup: newPartner.bloodGroup,
      });
      partnerIds.unshift(newPartner.id); // Add to the beginning
    } else {
      // Invalid user ID, fallback to first existing partner
      selectedPartnerId = partnerIds[0];
    }
  } else if (!Number.isInteger(selectedPartnerId) || selectedPartnerId === userId) {
    // Invalid or self-reference, fallback to first existing partner
    selectedPartnerId = partnerIds[0];
  }

  let conversation: ChatMessageView[] = [];
  let partner: ChatPartner | null = null;

  if (selectedPartnerId) {
    await prisma.chatMessage.updateMany({
      where: {
        senderId: selectedPartnerId,
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
            receiverId: selectedPartnerId,
          },
          {
            senderId: selectedPartnerId,
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

    const selectedPartner = partnerDetails.get(selectedPartnerId);
    if (selectedPartner) {
      partner = {
        id: selectedPartnerId,
        username: selectedPartner.username,
        name: selectedPartner.name,
        bloodGroup: selectedPartner.bloodGroup,
      };
    }
  }

  const unreadCounts = partnerIds.length
    ? await prisma.chatMessage.groupBy({
        by: ["senderId"],
        _count: { _all: true },
        where: {
          receiverId: userId,
          isRead: false,
          senderId: { in: partnerIds },
        },
      })
    : [];

  const unreadMap = new Map<number, number>();
  for (const entry of unreadCounts) {
    unreadMap.set(entry.senderId, entry._count._all);
  }

  const latestMessages = await Promise.all(
    partnerIds.map((partnerId) =>
      prisma.chatMessage.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: partnerId },
            { senderId: partnerId, receiverId: userId },
          ],
        },
        orderBy: { createdAt: "desc" },
      }),
    ),
  );

  const sidebarFriends: ChatFriend[] = partnerIds.map((partnerId, index) => {
    const partnerData = partnerDetails.get(partnerId);
    const latestMessage = latestMessages[index];
    return {
      id: partnerId,
      username: partnerData?.username ?? "Unknown",
      name: partnerData?.name ?? null,
      bloodGroup: partnerData?.bloodGroup ?? null,
      lastMessage: latestMessage?.content ?? undefined,
      lastMessageAt: latestMessage
        ? formatDistanceToNow(latestMessage.createdAt, { addSuffix: true })
        : undefined,
      unreadCount: partnerId === selectedPartnerId ? 0 : unreadMap.get(partnerId) ?? 0,
      isActive: partnerId === selectedPartnerId,
    };
  });

  return (
    <div className="grid w-full gap-6 grid-cols-1 lg:grid-cols-[320px_1fr]">
      <ChatSidebar friends={sidebarFriends} />
      <ChatConversation currentUserId={userId} partner={partner} messages={conversation} />
      <ScrollToTop />
    </div>
  );
}
