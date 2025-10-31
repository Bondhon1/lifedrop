import type { Server as IOServer } from "socket.io";

type SocketGlobals = typeof globalThis & {
  __ioServer?: IOServer;
  __userSockets?: Map<number, Set<string>>;
  __socketUsers?: Map<string, number>;
};

const globalForSocket = globalThis as SocketGlobals;

if (!globalForSocket.__userSockets) {
  globalForSocket.__userSockets = new Map();
}

if (!globalForSocket.__socketUsers) {
  globalForSocket.__socketUsers = new Map();
}

export const setIOServer = (io: IOServer) => {
  globalForSocket.__ioServer = io;
};

export const getIOServer = () => globalForSocket.__ioServer;

export const registerSocket = (userId: number, socketId: string) => {
  const userSockets = globalForSocket.__userSockets!;
  const socketUsers = globalForSocket.__socketUsers!;
  const sockets = userSockets.get(userId) ?? new Set<string>();
  sockets.add(socketId);
  userSockets.set(userId, sockets);
  socketUsers.set(socketId, userId);
};

export const unregisterSocket = (socketId: string) => {
  const socketUsers = globalForSocket.__socketUsers!;
  const userSockets = globalForSocket.__userSockets!;
  const userId = socketUsers.get(socketId);
  if (userId === undefined) {
    return;
  }

  socketUsers.delete(socketId);
  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) {
      userSockets.delete(userId);
    }
  }
};

export const emitToUser = (userId: number, event: string, payload: unknown) => {
  const io = getIOServer();
  if (!io) {
    return;
  }

  io.to(`user:${userId}`).emit(event, payload);
};
