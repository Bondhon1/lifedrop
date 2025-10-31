import { redirect } from "next/navigation";
import { auth, type SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FriendList } from "@/components/friends/friend-list";
import type { FriendListItem } from "@/components/friends/friend-list";
import { PendingRequestsList } from "@/components/friends/pending-requests-list";
import type { PendingFriendRequest } from "@/components/friends/pending-requests-list";
import { OutgoingRequestsList } from "@/components/friends/outgoing-requests-list";
import type { OutgoingFriendRequest } from "@/components/friends/outgoing-requests-list";

export default async function FriendsPage() {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;

  if (!sessionUser) {
    redirect("/login");
  }

  const userId = Number(sessionUser.id);
  if (!Number.isInteger(userId)) {
    redirect("/login");
  }

  const [incomingRequests, outgoingRequests, friendEntries] = await Promise.all([
    prisma.friendRequest.findMany({
      where: { receiverId: userId, status: "pending" },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            bloodGroup: true,
            profilePicture: true,
            district: { select: { name: true } },
            division: { select: { name: true } },
          },
        },
      },
    }),
    prisma.friendRequest.findMany({
      where: { senderId: userId, status: "pending" },
      orderBy: { createdAt: "desc" },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            name: true,
            bloodGroup: true,
            profilePicture: true,
            district: { select: { name: true } },
            division: { select: { name: true } },
          },
        },
      },
    }),
    prisma.userFriend.findMany({
      where: { userId },
      include: {
        friend: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            bloodGroup: true,
            profilePicture: true,
            district: { select: { name: true } },
            division: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  type IncomingRequest = (typeof incomingRequests)[number];
  const pendingIncoming = incomingRequests.map((request: IncomingRequest): PendingFriendRequest => ({
    id: request.id,
    createdAt: request.createdAt.toISOString(),
    sender: {
      id: request.sender.id,
      username: request.sender.username,
      name: request.sender.name,
      bloodGroup: request.sender.bloodGroup,
      profilePicture: request.sender.profilePicture,
      district: request.sender.district?.name ?? null,
      division: request.sender.division?.name ?? null,
    },
  }));

  type OutgoingRequest = (typeof outgoingRequests)[number];
  const pendingOutgoing = outgoingRequests.map((request: OutgoingRequest): OutgoingFriendRequest => ({
    id: request.id,
    createdAt: request.createdAt.toISOString(),
    receiver: {
      id: request.receiver.id,
      username: request.receiver.username,
      name: request.receiver.name,
      bloodGroup: request.receiver.bloodGroup,
      profilePicture: request.receiver.profilePicture,
      district: request.receiver.district?.name ?? null,
      division: request.receiver.division?.name ?? null,
    },
  }));

  type FriendEntry = (typeof friendEntries)[number];
  const friends: FriendListItem[] = friendEntries
    .map((entry: FriendEntry): FriendListItem => ({
      id: entry.friend.id,
      username: entry.friend.username,
      name: entry.friend.name,
      email: entry.friend.email,
      bloodGroup: entry.friend.bloodGroup,
      profilePicture: entry.friend.profilePicture,
      district: entry.friend.district?.name ?? null,
      division: entry.friend.division?.name ?? null,
    }))
  .sort((a: FriendListItem, b: FriendListItem) => {
      const nameA = (a.name ?? a.username).toLocaleLowerCase();
      const nameB = (b.name ?? b.username).toLocaleLowerCase();
      return nameA.localeCompare(nameB);
    });

  return (
    <div className="grid gap-10">
      <header className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 shadow-lg shadow-rose-950/30">
        <h1 className="text-3xl font-semibold text-white">Connections</h1>
        <p className="mt-3 max-w-2xl text-sm text-rose-100/80">
          Manage your confirmed friends, act on pending requests, and keep your donor network close.
        </p>
      </header>

      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">Your friends</h2>
          <p className="text-sm text-rose-100/70">{friends.length} connected</p>
        </div>
        <FriendList friends={friends} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="grid gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Incoming requests</h3>
            <p className="text-sm text-rose-100/70">Accept requests from members who want to connect.</p>
          </div>
          <PendingRequestsList requests={pendingIncoming} />
        </div>
        <div className="grid gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Sent requests</h3>
            <p className="text-sm text-rose-100/70">Track requests you have sent to other members.</p>
          </div>
          <OutgoingRequestsList requests={pendingOutgoing} />
        </div>
      </section>
    </div>
  );
}
