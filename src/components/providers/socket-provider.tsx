"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import createSocketClient from "socket.io-client";

type SocketClient = ReturnType<typeof createSocketClient>;

const SocketContext = createContext<SocketClient | null>(null);

const SOCKET_PATH = "/api/socket";

export function SocketProvider({ userId, children }: { userId: number | null; children: ReactNode }) {
  const [socket, setSocket] = useState<SocketClient | null>(null);
  const initializingRef = useRef(false);

  useEffect(() => {
    if (!userId || userId <= 0) {
      return;
    }

    if (initializingRef.current) {
      return;
    }

    let isActive = true;
    initializingRef.current = true;

    const setup = async () => {
      try {
        await fetch(SOCKET_PATH);
      } catch (error) {
        console.error("SocketProvider: failed to initialize socket endpoint", error);
      }

      if (!isActive) {
        return;
      }

      const instance = createSocketClient({
        path: SOCKET_PATH,
        query: { userId: String(userId) },
        transports: ["websocket"],
      });

      setSocket(instance);

      instance.on("connect_error", (error: unknown) => {
        console.error("Socket connection error", error);
      });
    };

    setup();

    return () => {
      isActive = false;
      initializingRef.current = false;
      setSocket((prev: SocketClient | null) => {
        prev?.disconnect();
        return null;
      });
    };
  }, [userId]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
