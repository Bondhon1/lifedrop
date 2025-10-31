import type { Server as HTTPServer } from "http";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Socket } from "net";
import { Server as IOServer } from "socket.io";
import { registerSocket, setIOServer, unregisterSocket } from "@/lib/socket-server";

export const config = {
  api: {
    bodyParser: false,
  },
};

const normalizeUserId = (raw: unknown): number | null => {
  if (typeof raw === "string") {
    const parsed = Number(raw);
    return Number.isInteger(parsed) ? parsed : null;
  }

  if (Array.isArray(raw) && raw.length > 0) {
    const parsed = Number(raw[0]);
    return Number.isInteger(parsed) ? parsed : null;
  }

  return null;
};

type NextSocketWithIO = Socket & { server: HTTPServer & { io?: IOServer } };

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const socket = res.socket as NextSocketWithIO | null | undefined;

  if (!socket) {
    res.status(500).end();
    return;
  }

  const httpServer = socket.server;

  if (!httpServer.io) {
    const io = new IOServer(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
    });

    httpServer.io = io;
    setIOServer(io);

    io.on("connection", (client) => {
      const userId = normalizeUserId(client.handshake.query.userId);

      if (userId) {
        client.join(`user:${userId}`);
        registerSocket(userId, client.id);
      }

      client.on("disconnect", () => {
        unregisterSocket(client.id);
      });
    });
  }

  res.end();
}
